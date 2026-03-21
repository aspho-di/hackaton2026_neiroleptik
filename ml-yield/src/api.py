"""
api.py — FastAPI-сервис прогноза урожайности.
Порт: 8001

Эндпоинты:
  GET  /health
  GET  /predict/forecast        — прогноз по реальной погоде
  POST /predict/manual          — прогноз по ручному вводу
  GET  /districts               — список доступных районов
"""

from fastapi import FastAPI
from pydantic import BaseModel
from predict import predict_from_forecast, predict_from_manual_input

app = FastAPI(
    title="Yield Forecast Service",
    description="Прогноз урожайности на основе погодных данных. Порт 8001.",
    version="1.0.0",
)

DISTRICTS = [
    {"key": "rostov",      "name": "Ростов-на-Дону"},
    {"key": "salsk",       "name": "Сальск"},
    {"key": "zernograd",   "name": "Зерноградский район"},
    {"key": "aksay",       "name": "Аксайский район"},
    {"key": "taganrog",    "name": "Таганрог"},
]


class ManualWeatherInput(BaseModel):
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


@app.get("/health")
def health():
    return {"status": "ok", "service": "yield-forecast", "port": 8001}


@app.get("/districts")
def get_districts():
    """Список доступных районов."""
    return DISTRICTS


@app.get("/predict/forecast")
def forecast(district: str = "rostov"):
    """Прогноз урожайности по реальной погоде с Open-Meteo."""
    result = predict_from_forecast()
    result["district"] = district
    return result


@app.post("/predict/manual")
def manual(data: ManualWeatherInput):
    """Прогноз урожайности по вручную введённым данным."""
    return predict_from_manual_input(data.model_dump())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8001, reload=True)
