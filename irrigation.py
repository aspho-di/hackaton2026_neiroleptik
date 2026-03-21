"""
irrigation.py — Логика рекомендации полива.
Теперь принимает профиль культуры из БД вместо захардкоженных констант.
"""

from datetime import date, timedelta
from typing import Any


<<<<<<< HEAD
def recommend_irrigation(
    soil_moisture: float,
=======
# ── Валидация профиля ─────────────────────────────────────────────────────────

def validate_profile(profile: dict) -> None:
    """
    Проверяет корректность профиля культуры перед использованием.
    Выбрасывает ValueError при обнаружении некорректных значений.
    """
    required_keys = [
        "moisture_threshold_high", "moisture_threshold_low",
        "rain_skip_mm", "rain_skip_days", "base_water_mm",
        "heat_threshold", "crop_name", "display_name",
    ]
    for key in required_keys:
        if key not in profile:
            raise ValueError(f"Профиль культуры не содержит обязательное поле: '{key}'")

    high = profile["moisture_threshold_high"]
    low  = profile["moisture_threshold_low"]

    if high <= low:
        raise ValueError(
            f"moisture_threshold_high ({high}) должен быть строго больше "
            f"moisture_threshold_low ({low}). Проверьте профиль культуры "
            f"«{profile.get('display_name', profile.get('crop_name', '?'))}»."
        )

    if profile["base_water_mm"] <= 0:
        raise ValueError(
            f"base_water_mm должен быть положительным, получено: {profile['base_water_mm']}"
        )

    if profile["rain_skip_days"] < 1:
        raise ValueError(
            f"rain_skip_days должен быть ≥ 1, получено: {profile['rain_skip_days']}"
        )

    # FIX B11: отрицательный heat_coeff тихо уменьшает полив при жаре —
    # это контр-интуитивно и, скорее всего, ошибка в данных.
    heat_coeff = profile.get("heat_coeff", 0.0)
    if heat_coeff < 0:
        raise ValueError(
            f"heat_coeff должен быть ≥ 0, получено: {heat_coeff}. "
            "Для отключения поправки на жару используйте 0."
        )


# ── Основная функция ──────────────────────────────────────────────────────────

def recommend_irrigation(
    soil_moisture_percent: float,
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
    air_temperature: float,
    precip_forecast_7days: list[dict[str, Any]],
    profile: dict,
    today: date | None = None,
) -> dict[str, Any]:
    """
    Рассчитывает рекомендацию по поливу на основе профиля культуры.

    Parameters
    ----------
<<<<<<< HEAD
    soil_moisture          : текущая влажность почвы, % (поле датасета: soil_moisture)
=======
    soil_moisture_percent  : текущая влажность почвы, %
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
    air_temperature        : температура воздуха, °C
    precip_forecast_7days  : прогноз осадков [{"date": "...", "precipitation_sum": float}]
    profile                : dict с порогами из CropProfile.to_dict()
    today                  : текущая дата (для тестов)
<<<<<<< HEAD
=======

    Raises
    ------
    ValueError
        Если профиль культуры содержит некорректные значения (например,
        moisture_threshold_high <= moisture_threshold_low).
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
    """
    if today is None:
        today = date.today()

<<<<<<< HEAD
=======
    # Валидируем профиль до любых вычислений — чтобы ловить кривые данные
    # на входе, а не получать тихо неверный результат.
    validate_profile(profile)

>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
    # ── Пороги из профиля культуры ────────────────────────────────────────────
    moisture_high  = profile["moisture_threshold_high"]
    moisture_low   = profile["moisture_threshold_low"]
    rain_skip_mm   = profile["rain_skip_mm"]
    rain_skip_days = profile["rain_skip_days"]
    base_water_mm  = profile["base_water_mm"]
    heat_threshold = profile["heat_threshold"]
    heat_coeff     = profile.get("heat_coeff", 0.4)

    rain_nd = _sum_rain(precip_forecast_7days, today, rain_skip_days)

    # ── Правило 1: ждём дождя ────────────────────────────────────────────────
    if rain_nd > rain_skip_mm:
        return {
            "irrigate": False,
            "when": None,
            "amount_mm": None,
            "reason": (
                f"Ожидается {rain_nd:.1f} мм осадков в ближайшие {rain_skip_days} дня(-ей). "
                "Полив не требуется."
            ),
            "rain_next_days_mm": round(rain_nd, 1),
            "crop": profile["crop_name"],
        }

    # ── Правило 2: почва достаточно влажная ─────────────────────────────────
<<<<<<< HEAD
    if soil_moisture >= moisture_high:
=======
    if soil_moisture_percent >= moisture_high:
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
        return {
            "irrigate": False,
            "when": None,
            "amount_mm": None,
            "reason": (
<<<<<<< HEAD
                f"Влажность почвы {soil_moisture:.1f}% ≥ {moisture_high}% "
=======
                f"Влажность почвы {soil_moisture_percent:.1f}% ≥ {moisture_high}% "
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
                f"(порог для «{profile['display_name']}»). Полив не требуется."
            ),
            "rain_next_days_mm": round(rain_nd, 1),
            "crop": profile["crop_name"],
        }

    # ── Правило 3: полив нужен ───────────────────────────────────────────────
    amount_mm = _calc_water(
<<<<<<< HEAD
        soil_moisture, air_temperature,
=======
        soil_moisture_percent, air_temperature,
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
        moisture_high, moisture_low,
        base_water_mm, heat_threshold, heat_coeff,
    )
    when_date = _next_dry_day(precip_forecast_7days, today, rain_skip_mm)

    reasons = [
<<<<<<< HEAD
        f"Влажность почвы {soil_moisture:.1f}% ниже порога {moisture_high}% "
        f"для культуры «{profile['display_name']}»."
    ]
    if soil_moisture < moisture_low:
=======
        f"Влажность почвы {soil_moisture_percent:.1f}% ниже порога {moisture_high}% "
        f"для культуры «{profile['display_name']}»."
    ]
    if soil_moisture_percent < moisture_low:
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
        reasons.append("Критически низкий уровень — полив срочно необходим.")
    if air_temperature > heat_threshold:
        reasons.append(
            f"Высокая температура воздуха ({air_temperature:.1f}°C) "
            "увеличивает испарение."
        )
<<<<<<< HEAD

    return {
        "irrigate": True,
        "when": when_date.isoformat(),
=======
    if when_date is None:
        reasons.append(
            "Все ближайшие 7 дней — дождливые; запланируйте полив вручную."
        )

    return {
        "irrigate": True,
        "when": when_date.isoformat() if when_date is not None else None,
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
        "amount_mm": round(amount_mm, 1),
        "reason": " ".join(reasons),
        "rain_next_days_mm": round(rain_nd, 1),
        "crop": profile["crop_name"],
    }


# ── Вспомогательные функции ───────────────────────────────────────────────────

def _sum_rain(forecast: list[dict], today: date, days: int) -> float:
    cutoff = today + timedelta(days=days - 1)
    total = 0.0
    for entry in forecast:
        try:
            d = date.fromisoformat(entry["date"])
        except (KeyError, ValueError, TypeError):
            continue
        if today <= d <= cutoff:
            total += max(0.0, float(entry.get("precipitation_sum", 0.0)))
    return total


def _calc_water(
    soil_moisture: float,
    air_temp: float,
    moisture_high: float,
    moisture_low: float,
    base_water_mm: float,
    heat_threshold: float,
    heat_coeff: float,
) -> float:
<<<<<<< HEAD
=======
    # После validate_profile гарантировано moisture_high > moisture_low,
    # поэтому знаменатель всегда > 0 и защита max(..., 1.0) здесь не нужна,
    # но оставлена как дополнительный страховочный слой.
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
    deficit_ratio = max(
        0.0,
        (moisture_high - soil_moisture) / max(moisture_high - moisture_low, 1.0),
    )
    amount = base_water_mm * max(deficit_ratio, 0.5)
    if air_temp > heat_threshold:
        amount += (air_temp - heat_threshold) * heat_coeff
    return amount


<<<<<<< HEAD
def _next_dry_day(forecast: list[dict], today: date, rain_skip_mm: float) -> date:
=======
def _next_dry_day(
    forecast: list[dict], today: date, rain_skip_mm: float
) -> date | None:
    """
    Возвращает ближайший день без значительных осадков (< rain_skip_mm).
    Если все 7 дней горизонта дождливые — возвращает None.

    FIX B10: дни, отсутствующие в прогнозе, считаются сухими (осадки = 0),
    но только начиная с offset=1 (завтра). Для сегодня (offset=0) при
    отсутствии данных явно возвращаем сегодня — это ожидаемое поведение
    ("нет данных о дожде сегодня → поливаем сегодня"). Если же сегодня
    есть запись в прогнозе с осадками ≥ rain_skip_mm, сдвигаемся на
    следующий сухой день — как и раньше.
    """
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
    daily: dict[date, float] = {}
    for entry in forecast:
        try:
            d = date.fromisoformat(entry["date"])
            daily[d] = float(entry.get("precipitation_sum", 0.0))
        except (KeyError, ValueError, TypeError):
            continue
<<<<<<< HEAD
    for offset in range(8):
        candidate = today + timedelta(days=offset)
        if daily.get(candidate, 0.0) < rain_skip_mm:
            return candidate
    return today
=======

    for offset in range(8):
        candidate = today + timedelta(days=offset)
        # Если день есть в прогнозе — используем реальное значение.
        # Если дня нет — считаем сухим (0.0), что верно для любого offset.
        if daily.get(candidate, 0.0) < rain_skip_mm:
            return candidate

    return None  # весь горизонт дождливый
>>>>>>> 2c686ed0b38e980d39ef5c48c8be3930c2f04c33
