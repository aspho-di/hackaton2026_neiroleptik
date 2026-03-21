"""
api.py — FastAPI-сервис рекомендаций по поливу с PostgreSQL.
Порт: 8002

Эндпоинты:
  GET  /health
  POST /validate
  POST /recommend/irrigation

  GET    /config/profiles              — все профили культур
  GET    /config/profiles/{crop}       — профиль конкретной культуры
  POST   /config/profiles              — создать новый профиль
  PATCH  /config/profiles/{crop}       — изменить пороги
  GET    /config/history               — история всех изменений
  GET    /config/history/{crop}        — история изменений по культуре
"""

from contextlib import asynccontextmanager
from datetime import date
from typing import Any
import os
import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import crud
from database import get_db, init_db
from irrigation import recommend_irrigation
from validate import validate_sensor_data

FORECAST_URL = os.getenv("FORECAST_SERVICE_URL", "http://localhost:8001/predict/forecast")

# FIX B3: базовая проверка URL при старте модуля — отсутствие схемы
# обнаруживается сразу, а не при первом реальном запросе с невнятной 502.
if not FORECAST_URL.startswith(("http://", "https://")):
    raise RuntimeError(
        f"FORECAST_SERVICE_URL имеет некорректный формат: {FORECAST_URL!r}. "
        "Ожидается URL вида http://host:port/path"
    )


# ── Lifespan: инициализация БД при старте ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from database import SessionLocal
    db = SessionLocal()
    try:
        seeded = crud.seed_default_profiles(db)
        if seeded:
            print(f"[startup] Добавлено {seeded} стандартных профилей культур.")
    finally:
        db.close()
    yield


app = FastAPI(
    title="Irrigation Recommendation Service",
    description="Рекомендации по поливу на основе данных датчиков. Порт 8002.",
    version="2.0.0",
    lifespan=lifespan,
)


# ── Pydantic-схемы ────────────────────────────────────────────────────────────

class PrecipEntry(BaseModel):
    date: str = Field(..., examples=["2026-03-20"])
    precipitation_sum: float = Field(..., ge=0.0)


class SensorPayload(BaseModel):
    field_id: int = Field(..., examples=[45])
    crop: str = Field(
        ..., examples=["wheat"],
        description="Культура на поле — определяет пороги полива из БД",
    )
    soil_moisture_percent: float = Field(..., examples=[45.0])
    soil_temperature: float = Field(..., examples=[18.0])
    air_temperature: float = Field(..., examples=[25.0])
    precip_forecast_7days: list[PrecipEntry] = Field(
        default_factory=list,
        description="Если пустой — запрашивается с localhost:8001",
    )


class CreateProfileRequest(BaseModel):
    crop_name: str = Field(..., examples=["soybean"])
    display_name: str = Field(..., examples=["Соя"])
    created_by: str = Field(..., examples=["Иванов А.П."])
    moisture_threshold_high: float = Field(70.0, ge=0, le=100)
    moisture_threshold_low: float = Field(30.0, ge=0, le=100)
    rain_skip_mm: float = Field(5.0, ge=0)
    rain_skip_days: int = Field(2, ge=1, le=7)
    base_water_mm: float = Field(20.0, ge=0)
    heat_threshold: float = Field(25.0)
    heat_coeff: float = Field(0.4, ge=0)
    description: str | None = None


class PatchProfileRequest(BaseModel):
    changed_by: str = Field(..., examples=["Петров В.С."])
    comment: str | None = Field(None, examples=["Скорректировано по результатам сезона"])
    moisture_threshold_high: float | None = Field(None, ge=0, le=100)
    moisture_threshold_low: float | None = Field(None, ge=0, le=100)
    rain_skip_mm: float | None = Field(None, ge=0)
    rain_skip_days: int | None = Field(None, ge=1, le=7)
    base_water_mm: float | None = Field(None, ge=0)
    heat_threshold: float | None = None
    heat_coeff: float | None = Field(None, ge=0)
    display_name: str | None = None
    description: str | None = None


# ── Вспомогательные функции ───────────────────────────────────────────────────

async def _get_forecast() -> list[dict[str, Any]]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(FORECAST_URL)
            # FIX B1: сохраняем status_code до raise_for_status — после поднятия
            # исключения соединение закрывается и exc.response может быть недоступен
            # при некоторых конфигурациях прокси/транспорта.
            status_code = resp.status_code
            resp.raise_for_status()
            # Читаем тело внутри with-блока, пока соединение ещё открыто
            data = resp.json()
        except httpx.HTTPStatusError:
            raise HTTPException(
                status_code=502,
                detail=f"Сервис прогноза вернул {status_code}: {FORECAST_URL}",
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Нет соединения с сервисом прогноза ({FORECAST_URL}): {exc}",
            )
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("forecast", "precip_forecast_7days", "data"):
            if key in data and isinstance(data[key], list):
                return data[key]
    return []


# ── Эндпоинты: сервис ────────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "irrigation-recommendation", "port": 8002}


@app.post("/validate")
async def validate(
    payload: SensorPayload,
    db: Session = Depends(get_db),
) -> dict:
    """
    Валидация входных данных с датчиков.

    FIX B2: помимо физической валидации датчиков, проверяет существование
    профиля культуры в БД — чтобы /validate и /recommend давали одинаковый
    результат для одних и тех же входных данных.
    """
    result = validate_sensor_data(payload.model_dump())
    if result["status"] == "anomaly":
        return result

    # Проверяем культуру: если профиля нет — предупреждаем сразу,
    # не дожидаясь вызова /recommend.
    profile = crud.get_profile(db, payload.crop)
    if profile is None:
        return {
            "status": "anomaly",
            "confidence": "low",
            "anomalies": [
                f"crop: профиль культуры «{payload.crop}» не найден в БД"
            ],
            "message": (
                f"Датчики в норме, но культура «{payload.crop}» неизвестна. "
                "Создайте профиль через POST /config/profiles."
            ),
        }

    return result


@app.post("/recommend/irrigation")
async def recommend(
    payload: SensorPayload,
    db: Session = Depends(get_db),
) -> dict:
    """
    Полный пайплайн: валидация → профиль культуры из БД → рекомендация полива.
    """
    # 1. Валидация
    raw = payload.model_dump()
    validation = validate_sensor_data(raw)
    if validation["status"] == "anomaly":
        return validation

    # 2. Профиль культуры
    profile = crud.get_profile(db, payload.crop)
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Профиль культуры «{payload.crop}» не найден. "
                "Создайте через POST /config/profiles или получите список доступных культур "
                "через GET /config/profiles."
            ),
        )

    # 3. Прогноз осадков
    if payload.precip_forecast_7days:
        forecast = [e.model_dump() for e in payload.precip_forecast_7days]
    else:
        forecast = await _get_forecast()

    # 4. Рекомендация
    result = recommend_irrigation(
        soil_moisture_percent=payload.soil_moisture_percent,
        air_temperature=payload.air_temperature,
        precip_forecast_7days=forecast,
        profile=profile.to_dict(),
        today=date.today(),
    )

    return {
        "field_id": payload.field_id,
        "validation": validation,
        "profile_used": profile.to_dict(),
        **result,
    }


# ── Эндпоинты: управление профилями ─────────────────────────────────────────

@app.get("/config/profiles")
def list_profiles(db: Session = Depends(get_db)) -> list[dict]:
    """Список всех профилей культур с их порогами."""
    return [p.to_dict() for p in crud.get_all_profiles(db)]


@app.get("/config/profiles/{crop_name}")
def get_profile(crop_name: str, db: Session = Depends(get_db)) -> dict:
    """Профиль конкретной культуры."""
    profile = crud.get_profile(db, crop_name)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Культура «{crop_name}» не найдена")
    return profile.to_dict()


@app.post("/config/profiles", status_code=201)
def create_profile(body: CreateProfileRequest, db: Session = Depends(get_db)) -> dict:
    """Создать новый профиль культуры."""
    existing = crud.get_profile(db, body.crop_name)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Профиль «{body.crop_name}» уже существует. Используйте PATCH для изменения.",
        )
    profile = crud.create_profile(db, **body.model_dump())
    return profile.to_dict()


@app.patch("/config/profiles/{crop_name}")
def patch_profile(
    crop_name: str,
    body: PatchProfileRequest,
    db: Session = Depends(get_db),
) -> dict:
    """
    Изменить пороги культуры. Записывает историю — кто и когда изменил.

    Передавайте только те поля, которые нужно изменить.
    """
    # FIX B4: нормализуем path-параметр — GET /profiles/Wheat и /profiles/wheat
    # должны вести себя одинаково.
    normalized = crop_name.lower().strip()
    profile = crud.get_profile(db, normalized)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Культура «{crop_name}» не найдена")

    # Собираем только явно переданные поля (кроме служебных).
    # Используем model_fields_set вместо `v is not None`, чтобы корректно
    # обрабатывать нулевые значения (0.0, False) — они легитимны и не должны
    # отфильтровываться.
    updates = {
        k: v
        for k, v in body.model_dump().items()
        if k in body.model_fields_set and k not in ("changed_by", "comment")
    }

    updated = crud.update_profile(
        db=db,
        profile=profile,
        updates=updates,
        changed_by=body.changed_by,
        comment=body.comment,
    )
    return updated.to_dict()


# ── Эндпоинты: история изменений ─────────────────────────────────────────────

@app.get("/config/history")
def get_history(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[dict]:
    """История всех изменений порогов (последние N записей)."""
    return [h.to_dict() for h in crud.get_history(db, limit=limit)]


@app.get("/config/history/{crop_name}")
def get_history_by_crop(
    crop_name: str,
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[dict]:
    """История изменений порогов для конкретной культуры."""
    # FIX B4: нормализуем для единообразия с хранимыми значениями
    return [h.to_dict() for h in crud.get_history(db, crop_name=crop_name.lower().strip(), limit=limit)]


# ── Точка входа ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8002, reload=True)
