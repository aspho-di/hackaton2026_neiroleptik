from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sys
import os
import time

sys.path.append(os.path.dirname(__file__))
from predict import predict_from_forecast, predict_from_manual_input

app = FastAPI(title="Агро ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Кэш прогноза — не дёргаем Open-Meteo на каждый запрос
_cache = {}
CACHE_TTL = 600  # секунд (10 минут)


# ── Модели запросов ────────────────────────────────────────────────────────────

class WeatherInput(BaseModel):
    temp_mean: float
    temp_max: float
    temp_min: float
    precip_total: float
    precip_days: int
    wind_max: float
    evapotranspiration: float
    hot_days: int
    dry_days: int
    water_balance: float


class SensorValidateInput(BaseModel):
    field_id: Optional[int] = None
    crop: Optional[str] = None
    soil_moisture_percent: Optional[float] = None
    soil_temperature: Optional[float] = None
    air_temperature: Optional[float] = None
    wind_speed: Optional[float] = None


class IrrigationInput(BaseModel):
    field_id: Optional[int] = None
    crop: Optional[str] = None
    soil_moisture_percent: Optional[float] = None
    soil_temperature: Optional[float] = None
    air_temperature: Optional[float] = None
    precip_forecast_7days: Optional[List[float]] = []
    wind_speed: Optional[float] = None


# ── Прогноз урожайности ────────────────────────────────────────────────────────

@app.get("/predict/forecast")
@app.get("/api/v1/predict/forecast")
def forecast(district: str = "rostov", crop: str = "wheat"):
    """Прогноз по реальной погоде с Open-Meteo. Кэшируется на 10 минут."""
    cache_key = f"forecast_{district}_{crop}"
    now = time.time()

    if cache_key in _cache and now - _cache[cache_key]["ts"] < CACHE_TTL:
        import copy
        result = copy.deepcopy(_cache[cache_key]["data"])
        result["cached"] = True
        return result

    result = predict_from_forecast(district=district, crop=crop)
    result["cached"] = False
    _cache[cache_key] = {"data": result, "ts": now}
    return result


# ── Валидация данных датчика ───────────────────────────────────────────────────

@app.post("/api/v1/validate")
def validate_sensor(data: SensorValidateInput):
    """
    Проверяет данные датчика на аномалии.
    Возвращает: { status: 'ok'|'anomaly', anomalies: [...] }
    """
    anomalies = []

    if data.soil_moisture_percent is not None:
        if data.soil_moisture_percent < 0:
            anomalies.append("Влажность почвы отрицательная — сбой датчика")
        elif data.soil_moisture_percent > 100:
            anomalies.append("Влажность почвы > 100% — сбой датчика")
        elif data.soil_moisture_percent < 5:
            anomalies.append("Критически низкая влажность почвы — возможен сбой")

    if data.air_temperature is not None:
        if data.air_temperature > 55:
            anomalies.append("Температура воздуха > 55°C — проверьте датчик")
        elif data.air_temperature < -40:
            anomalies.append("Температура воздуха < -40°C — проверьте датчик")

    if data.soil_temperature is not None:
        if data.soil_temperature > 60:
            anomalies.append("Температура почвы > 60°C — проверьте датчик")
        elif data.soil_temperature < -20:
            anomalies.append("Температура почвы < -20°C — проверьте датчик")

    if data.wind_speed is not None:
        if data.wind_speed < 0:
            anomalies.append("Скорость ветра отрицательная — сбой датчика")
        elif data.wind_speed > 100:
            anomalies.append("Скорость ветра > 100 м/с — проверьте датчик")

    return {
        "status": "anomaly" if anomalies else "ok",
        "anomalies": anomalies,
        "is_anomaly": len(anomalies) > 0,
    }


# ── Рекомендация полива ────────────────────────────────────────────────────────

@app.post("/api/v1/recommend/irrigation")
def recommend_irrigation(data: IrrigationInput):
    """
    Рассчитывает рекомендацию по поливу на основе данных датчика.
    Возвращает: { irrigate: bool, amount_mm: float, reason: str }
    """
    soil_moisture = data.soil_moisture_percent or 50.0
    air_temp      = data.air_temperature or 20.0
    wind_speed    = data.wind_speed or 0.0
    crop          = data.crop or "пшеница"
    precip        = data.precip_forecast_7days or []

    # Пороги влажности по культуре
    thresholds = {
        "пшеница":      {"low": 30, "high": 70},
        "кукуруза":     {"low": 40, "high": 75},
        "подсолнечник": {"low": 35, "high": 70},
        "ячмень":       {"low": 30, "high": 65},
    }
    t = thresholds.get(crop.lower(), {"low": 35, "high": 70})

    # Осадки на ближайшие 3 дня
    precip_3d = sum(precip[:3]) if precip else 0

    # Логика рекомендации
    irrigate  = False
    amount_mm = 0.0
    reason    = ""

    if soil_moisture < t["low"]:
        irrigate  = True
        deficit   = t["low"] - soil_moisture
        amount_mm = round(deficit * 0.5 + max(0, (air_temp - 25) * 0.2), 1)

        if precip_3d > 5:
            amount_mm = round(amount_mm * 0.5, 1)
            reason = f"Влажность низкая ({soil_moisture}%), но ожидаются осадки {precip_3d:.1f} мм — полив уменьшен"
        else:
            reason = f"Влажность почвы низкая ({soil_moisture}%), необходим полив"

        if air_temp > 35:
            amount_mm = round(amount_mm * 1.3, 1)
            reason += f". Высокая температура ({air_temp}°C) усиливает испарение"

        if wind_speed > 10:
            amount_mm = round(amount_mm * 1.1, 1)

    elif soil_moisture > t["high"]:
        reason = f"Влажность почвы достаточная ({soil_moisture}%), полив не требуется"
    else:
        if precip_3d > 10:
            reason = f"Влажность в норме ({soil_moisture}%), ожидаются осадки {precip_3d:.1f} мм"
        else:
            reason = f"Влажность почвы в норме ({soil_moisture}%)"

    return {
        "irrigate":              irrigate,
        "amount_mm":             amount_mm,
        "reason":                reason,
        "crop":                  crop,
        "soil_moisture_percent": soil_moisture,
        "is_anomaly":            False,
    }


# ── Прочие эндпоинты ───────────────────────────────────────────────────────────

@app.get("/districts")
@app.get("/api/v1/districts")
def districts():
    from fetch_weather import DISTRICTS
    return [{"key": k, "name": v["name"]} for k, v in DISTRICTS.items()]


@app.post("/predict/manual")
@app.post("/api/v1/predict/manual")
def manual(data: WeatherInput):
    return predict_from_manual_input(data.dict())


@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {"status": "ok"}


# uvicorn api:app --host 0.0.0.0 --port 8001 --reload