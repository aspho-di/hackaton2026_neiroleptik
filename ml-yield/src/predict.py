import joblib
import pandas as pd
import numpy as np
from fetch_weather import fetch_forecast_weather

MODEL_PATH = "models/yield_model.pkl"

FEATURE_COLS = [
    "temp_mean", "temp_max", "temp_min",
    "precip_total", "precip_days",
    "wind_max", "evapotranspiration",
    "hot_days", "dry_days", "water_balance"
]


def load_model():
    bundle = joblib.load(MODEL_PATH)
    threshold = bundle.get("threshold") or 30.0  # дефолт если None
    return bundle["model"], threshold, bundle.get("cv_accuracy")

def predict_from_forecast(district: str = "rostov") -> dict:
    """
    Качает прогноз погоды и предсказывает урожайность (0/1).
    district — ключ района из DISTRICTS в fetch_weather.py
    """
    model, threshold, cv_acc = load_model()

    df_forecast = fetch_forecast_weather(days=7, district=district)

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
        "water_balance": (
            df_forecast["precipitation_sum"].sum()
            - df_forecast["et0_fao_evapotranspiration"].sum()
        ),
    }

    X = pd.DataFrame([features])[FEATURE_COLS]

    # === БИНАРНОЕ ПРЕДСКАЗАНИЕ ===
    yield_actual = int(model.predict(X)[0])   # 0 = низкий, 1 = хороший
    proba = model.predict_proba(X)[0]          # [P(низкий), P(хороший)]

    # P(хороший урожай) — единая метрика уверенности независимо от predict
    p_good = round(float(proba[1]), 3)

    precip_forecast = df_forecast[["date", "precipitation_sum"]].to_dict(orient="records")
    et0_forecast    = df_forecast[["date", "et0_fao_evapotranspiration"]].to_dict(orient="records")

    # Оценка ц/га: threshold — центр; P(хороший) смещает ±40% от порога
    yield_estimate = round(threshold + (p_good - 0.5) * threshold * 0.8, 2)

    return {
        "yield_actual":                  yield_actual,          # 0 или 1 (бинарный)
        "yield_label":                   "хороший" if yield_actual == 1 else "низкий",
        "yield_threshold_centner_per_ha": threshold,
        "confidence_proba":              p_good,                # P(хороший урожай) [0-1]
        "confidence":                    "high" if p_good >= 0.7 else "low",
        "model_cv_accuracy":             cv_acc,
        "yield_prediction_centner_per_ha": yield_estimate,      # оценка ц/га
        "weather_summary": {
            "avg_temp":       round(features["temp_mean"], 1),
            "total_precip_mm": round(features["precip_total"], 1),
            "hot_days":       int(features["hot_days"]),
        },
        "precip_forecast_7days": precip_forecast,
        "et0_forecast_7days":    et0_forecast,
    }


def predict_from_manual_input(weather_data: dict) -> dict:
    """
    Принимает погодные данные вручную и возвращает yield_actual (0/1).
    weather_data — dict с ключами из FEATURE_COLS.
    """
    model, threshold, cv_acc = load_model()

    # Валидация аномалий
    anomalies = []
    if weather_data.get("precip_total", 0) < 0:
        anomalies.append("Отрицательные осадки — физически невозможно")
    if weather_data.get("temp_mean", 20) > 50:
        anomalies.append("Температура выше 50°C — проверьте датчик")
    if weather_data.get("temp_mean", 20) < -30:
        anomalies.append("Температура ниже -30°C — проверьте датчик")
    if weather_data.get("hot_days", 0) < 0:
        anomalies.append("Отрицательное число жарких дней — ошибка датчика")

    if anomalies:
        return {
            "status": "anomaly_detected",
            "yield_actual": None,
            "yield_label": None,
            "confidence_proba": None,
            "model_cv_accuracy": cv_acc,
            "anomalies": anomalies,
            "message": "Введённые данные содержат аномалии. Прогноз невозможен.",
        }

    X = pd.DataFrame([weather_data])[FEATURE_COLS]

    yield_actual = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]
    yield_proba = round(float(proba[yield_actual]), 3)

    return {
        "status": "ok",
        "yield_actual": yield_actual,                  # 0 или 1
        "yield_label": "хороший" if yield_actual == 1 else "низкий",
        "yield_threshold_centner_per_ha": threshold,
        "confidence_proba": yield_proba,
        "model_cv_accuracy": cv_acc,
        "anomalies": []
    }


if __name__ == "__main__":
    print("Тест прогноза по реальной погоде:")
    result = predict_from_forecast()
    import json
    print(json.dumps(result, ensure_ascii=False, indent=2, default=str))