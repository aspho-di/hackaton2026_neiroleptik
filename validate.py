"""
validate.py — Валидация входных данных с датчиков фермера.
Диапазоны проверяются по фиксированным физическим пределам (не по профилю культуры).
"""

from typing import Any

SOIL_MOISTURE_MIN = 10.0
SOIL_MOISTURE_MAX = 90.0
SOIL_TEMP_MIN = -10.0
SOIL_TEMP_MAX = 50.0
<<<<<<< HEAD
AIR_TEMP_MIN = -50.0
AIR_TEMP_MAX = 60.0
WIND_SPEED_MIN = 0.0
WIND_SPEED_MAX = 150.0   # м/с — выше уже ураган, физически невозможно для датчика
=======
# FIX B12: физические пределы для температуры воздуха
AIR_TEMP_MIN = -50.0
AIR_TEMP_MAX = 60.0
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33


def validate_sensor_data(data: dict[str, Any]) -> dict[str, Any]:
    """
    Проверяет показания датчиков на физическую допустимость.

<<<<<<< HEAD
    Returns:
        {"status": "ok", "is_anomaly": false}
        или
        {"status": "anomaly", "is_anomaly": true, "confidence": "low",
         "anomalies": [...], "message": "..."}
    """
    anomalies: list[str] = []

    # ── field_id ──────────────────────────────────────────────────────────────
=======
    Returns {"status": "ok"} или {"status": "anomaly", "confidence": "low",
                                   "anomalies": [...], "message": "..."}
    """
    anomalies: list[str] = []

    # ── FIX B13: field_id ─────────────────────────────────────────────────────
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
    field_id = data.get("field_id")
    if field_id is None:
        anomalies.append("field_id: поле отсутствует")
    elif not isinstance(field_id, int) or isinstance(field_id, bool):
        anomalies.append("field_id: ожидается целое число")
    elif field_id <= 0:
        anomalies.append(f"field_id: {field_id} — должен быть положительным целым")

<<<<<<< HEAD
    # ── crop_type ─────────────────────────────────────────────────────────────
    crop = data.get("crop_type")
    if crop is None:
        anomalies.append("crop_type: поле отсутствует")
    elif not isinstance(crop, str):
        anomalies.append("crop_type: ожидается строка")
    elif not crop.strip():
        anomalies.append("crop_type: не может быть пустой строкой")

    # ── soil_moisture (влажность почвы) ───────────────────────────────────────
    moisture = data.get("soil_moisture")
    if moisture is None:
        anomalies.append("soil_moisture: поле отсутствует")
    elif not isinstance(moisture, (int, float)):
        anomalies.append("soil_moisture: ожидается числовое значение")
    elif not (SOIL_MOISTURE_MIN <= float(moisture) <= SOIL_MOISTURE_MAX):
        anomalies.append(
            f"soil_moisture: {moisture}% вне диапазона "
            f"[{SOIL_MOISTURE_MIN}–{SOIL_MOISTURE_MAX}%]"
        )

    # ── soil_temperature (температура почвы) ──────────────────────────────────
=======
    # ── FIX B13: crop ─────────────────────────────────────────────────────────
    crop = data.get("crop")
    if crop is None:
        anomalies.append("crop: поле отсутствует")
    elif not isinstance(crop, str):
        anomalies.append("crop: ожидается строка")
    elif not crop.strip():
        anomalies.append("crop: не может быть пустой строкой")

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
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
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

<<<<<<< HEAD
    # ── air_temperature (температура воздуха) ─────────────────────────────────
=======
    # ── FIX B12: температура воздуха ──────────────────────────────────────────
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
    air_temp = data.get("air_temperature")
    if air_temp is None:
        anomalies.append("air_temperature: поле отсутствует")
    elif not isinstance(air_temp, (int, float)):
        anomalies.append("air_temperature: ожидается числовое значение")
    elif not (AIR_TEMP_MIN <= float(air_temp) <= AIR_TEMP_MAX):
        anomalies.append(
            f"air_temperature: {air_temp}°C вне диапазона "
            f"[{AIR_TEMP_MIN}–{AIR_TEMP_MAX}°C]"
        )

<<<<<<< HEAD
    # ── humidity_air (влажность воздуха) ──────────────────────────────────────
    humidity_air = data.get("humidity_air")
    if humidity_air is None:
        anomalies.append("humidity_air: поле отсутствует")
    elif not isinstance(humidity_air, (int, float)):
        anomalies.append("humidity_air: ожидается числовое значение")
    elif not (0.0 <= float(humidity_air) <= 100.0):
        anomalies.append(
            f"humidity_air: {humidity_air}% вне диапазона [0–100%]"
        )

    # ── wind_speed (скорость ветра) ───────────────────────────────────────────
    wind_speed = data.get("wind_speed")
    if wind_speed is None:
        anomalies.append("wind_speed: поле отсутствует")
    elif not isinstance(wind_speed, (int, float)):
        anomalies.append("wind_speed: ожидается числовое значение")
    elif not (WIND_SPEED_MIN <= float(wind_speed) <= WIND_SPEED_MAX):
        anomalies.append(
            f"wind_speed: {wind_speed} м/с вне диапазона "
            f"[{WIND_SPEED_MIN}–{WIND_SPEED_MAX} м/с]"
        )

=======
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
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

<<<<<<< HEAD
    # ── Результат ─────────────────────────────────────────────────────────────
=======
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
    if anomalies:
        n = len(anomalies)
        word = "аномалия" if n == 1 else "аномалии" if n < 5 else "аномалий"
        return {
            "status": "anomaly",
<<<<<<< HEAD
            "is_anomaly": True,
=======
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
            "confidence": "low",
            "anomalies": anomalies,
            "message": (
                f"Обнаружено {n} {word} во входных данных. "
                "Проверьте показания датчиков."
            ),
        }

<<<<<<< HEAD
    return {"status": "ok", "is_anomaly": False}
=======
    return {"status": "ok"}
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
