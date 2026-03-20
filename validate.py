"""
validate.py — Валидация входных данных с датчиков фермера.
Диапазоны проверяются по фиксированным физическим пределам (не по профилю культуры).
"""

from typing import Any

SOIL_MOISTURE_MIN = 10.0
SOIL_MOISTURE_MAX = 90.0
SOIL_TEMP_MIN = -10.0
SOIL_TEMP_MAX = 50.0


def validate_sensor_data(data: dict[str, Any]) -> dict[str, Any]:
    """
    Проверяет показания датчиков на физическую допустимость.

    Returns {"status": "ok"} или {"status": "anomaly", "confidence": "low",
                                   "anomalies": [...], "message": "..."}
    """
    anomalies: list[str] = []

    # ── Влажность почвы ───────────────────────────────────────────────────────
    moisture = data.get("soil_moisture_percent")
    if moisture is None:
        anomalies.append("soil_moisture_percent: поле отсутствует")
    elif not isinstance(moisture, (int, float)):
        anomalies.append("soil_moisture_percent: ожидается числовое значение")
    elif not (SOIL_MOISTURE_MIN <= float(moisture) <= SOIL_MOISTURE_MAX):
        anomalies.append(
            f"soil_moisture_percent: {moisture}% вне диапазона "
            f"[{SOIL_MOISTURE_MIN}–{SOIL_MOISTURE_MAX}%]"
        )

    # ── Температура почвы ─────────────────────────────────────────────────────
    soil_temp = data.get("soil_temperature")
    if soil_temp is None:
        anomalies.append("soil_temperature: поле отсутствует")
    elif not isinstance(soil_temp, (int, float)):
        anomalies.append("soil_temperature: ожидается числовое значение")
    elif not (SOIL_TEMP_MIN <= float(soil_temp) <= SOIL_TEMP_MAX):
        anomalies.append(
            f"soil_temperature: {soil_temp}°C вне диапазона "
            f"[{SOIL_TEMP_MIN}–{SOIL_TEMP_MAX}°C]"
        )

    # ── Осадки в прогнозе ─────────────────────────────────────────────────────
    forecast = data.get("precip_forecast_7days")
    if forecast is not None:
        if not isinstance(forecast, list):
            anomalies.append("precip_forecast_7days: ожидается список объектов")
        else:
            for i, entry in enumerate(forecast):
                if not isinstance(entry, dict):
                    anomalies.append(f"precip_forecast_7days[{i}]: ожидается объект")
                    continue
                precip = entry.get("precipitation_sum")
                date_label = entry.get("date", f"индекс {i}")
                if precip is None:
                    anomalies.append(
                        f"precip_forecast_7days[{i}] ({date_label}): "
                        "поле precipitation_sum отсутствует"
                    )
                elif not isinstance(precip, (int, float)):
                    anomalies.append(
                        f"precip_forecast_7days[{i}] ({date_label}): "
                        "precipitation_sum должен быть числом"
                    )
                elif float(precip) < 0:
                    anomalies.append(
                        f"precip_forecast_7days[{i}] ({date_label}): "
                        f"precipitation_sum={precip} мм — отрицательное значение"
                    )

    if anomalies:
        n = len(anomalies)
        word = "аномалия" if n == 1 else "аномалии" if n < 5 else "аномалий"
        return {
            "status": "anomaly",
            "confidence": "low",
            "anomalies": anomalies,
            "message": (
                f"Обнаружено {n} {word} во входных данных. "
                "Проверьте показания датчиков."
            ),
        }

    return {"status": "ok"}
