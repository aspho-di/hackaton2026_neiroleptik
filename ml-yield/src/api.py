from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
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


@app.get("/predict/forecast")
def forecast(district: str = "rostov"):
    """Прогноз по реальной погоде с Open-Meteo. Кэшируется на 10 минут."""
    cache_key = f"forecast_{district}"
    now = time.time()

    if cache_key in _cache and now - _cache[cache_key]["ts"] < CACHE_TTL:
        result = _cache[cache_key]["data"]
        result["cached"] = True
        return result

    result = predict_from_forecast(district=district)
    result["cached"] = False
    _cache[cache_key] = {"data": result, "ts": now}
    return result


@app.get("/districts")
def districts():
    """Список доступных районов для фронта."""
    from fetch_weather import DISTRICTS
    return [{"key": k, "name": v["name"]} for k, v in DISTRICTS.items()]


@app.post("/predict/manual")
def manual(data: WeatherInput):
    """Прогноз по данным от фермера, с валидацией аномалий"""
    return predict_from_manual_input(data.dict())


@app.get("/health")
def health():
    return {"status": "ok"}


# uvicorn api:app --host 0.0.0.0 --port 8001 --reload