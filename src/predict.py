import joblib
import pandas as pd
import numpy as np
from fetch_weather import fetch_forecast_weather
from preprocess import aggregate_season

MODEL_PATH = "../models/yield_model.pkl"

FEATURE_COLS = [
    "temp_mean", "temp_max", "temp_min",
    "precip_total", "precip_days",
    "wind_max", "evapotranspiration",
    "hot_days", "dry_days", "water_balance"
]


def load_model():
    return joblib.load(MODEL_PATH)


def predict_from_forecast() -> dict:
    """
    Качает прогноз погоды и предсказывает урожайность.
    Возвращает dict — бэкендер отдаёт это как JSON.
    """
    model = load_model()

    # Берём прогноз на 7 дней
    df_forecast = fetch_forecast_weather(days=7)

    # Считаем фичи вручную (без агрегации по году — прогноз короткий)
    features = {
        "temp_mean": df_forecast["temperature_2m_mean"].mean(),
        "temp_max": df_forecast["temperature_2m_max"].max(),
        "temp_min": df_forecast["temperature_2m_min"].min(),
        "precip_total": df_forecast["precipitation_sum"].sum(),
        "precip_days": (df_forecast["precipitation_sum"] > 1).sum(),
        "wind_max": df_forecast["windspeed_10m_max"].max(),
        "evapotranspiration": df_forecast["et0_fao_evapotranspiration"].sum(),
        "hot_days": (df_forecast["temperature_2m_max"] > 35).sum(),
        "dry_days": (df_forecast["precipitation_sum"] == 0).sum(),
        "water_balance": df_forecast["precipitation_sum"].sum() - df_forecast["et0_fao_evapotranspiration"].sum(),
    }

    X = pd.DataFrame([features])[FEATURE_COLS]
    prediction = float(model.predict(X)[0])

    # Прогноз осадков — отдаём второй модели (полив)
    precip_forecast = df_forecast[["date", "precipitation_sum"]].to_dict(orient="records")

    return {
        "yield_prediction_centner_per_ha": round(prediction, 2),
        "confidence": "high" if features["precip_total"] > 0 else "medium",
        "weather_summary": {
            "avg_temp": round(features["temp_mean"], 1),
            "total_precip_mm": round(features["precip_total"], 1),
            "hot_days": int(features["hot_days"]),
        },
        "precip_forecast_7days": precip_forecast  # для второй модели
    }


def predict_from_manual_input(weather_data: dict) -> dict:
    """
    Принимает данные вручную (от бэкенда/фронта).
    weather_data — dict с теми же ключами что FEATURE_COLS.
    """
    model = load_model()

    # Валидация аномалий
    anomalies = []
    if weather_data.get("precip_total", 0) < 0:
        anomalies.append("Отрицательные осадки — физически невозможно")
    if weather_data.get("temp_mean", 20) > 50:
        anomalies.append("Температура выше 50°C — проверьте датчик")
    if weather_data.get("temp_mean", 20) < -30:
        anomalies.append("Температура ниже -30°C — проверьте датчик")

    if anomalies:
        return {
            "status": "anomaly_detected",
            "confidence": "low",
            "anomalies": anomalies,
            "message": "Введённые данные содержат аномалии. Прогноз может быть неточным.",
            "yield_prediction_centner_per_ha": None
        }

    X = pd.DataFrame([weather_data])[FEATURE_COLS]
    prediction = float(model.predict(X)[0])

    return {
        "status": "ok",
        "confidence": "high",
        "yield_prediction_centner_per_ha": round(prediction, 2),
        "anomalies": []
    }


if __name__ == "__main__":
    print("Тест прогноза по реальной погоде:")
    result = predict_from_forecast()
    import json
    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))
