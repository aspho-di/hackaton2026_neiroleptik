"""
irrigation.py — Логика рекомендации полива.
Теперь принимает профиль культуры из БД вместо захардкоженных констант.
"""

from datetime import date, timedelta
from typing import Any


def recommend_irrigation(
    soil_moisture: float,
    air_temperature: float,
    precip_forecast_7days: list[dict[str, Any]],
    profile: dict,
    today: date | None = None,
) -> dict[str, Any]:
    """
    Рассчитывает рекомендацию по поливу на основе профиля культуры.

    Parameters
    ----------
    soil_moisture          : текущая влажность почвы, % (поле датасета: soil_moisture)
    air_temperature        : температура воздуха, °C
    precip_forecast_7days  : прогноз осадков [{"date": "...", "precipitation_sum": float}]
    profile                : dict с порогами из CropProfile.to_dict()
    today                  : текущая дата (для тестов)
    """
    if today is None:
        today = date.today()

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
    if soil_moisture >= moisture_high:
        return {
            "irrigate": False,
            "when": None,
            "amount_mm": None,
            "reason": (
                f"Влажность почвы {soil_moisture:.1f}% ≥ {moisture_high}% "
                f"(порог для «{profile['display_name']}»). Полив не требуется."
            ),
            "rain_next_days_mm": round(rain_nd, 1),
            "crop": profile["crop_name"],
        }

    # ── Правило 3: полив нужен ───────────────────────────────────────────────
    amount_mm = _calc_water(
        soil_moisture, air_temperature,
        moisture_high, moisture_low,
        base_water_mm, heat_threshold, heat_coeff,
    )
    when_date = _next_dry_day(precip_forecast_7days, today, rain_skip_mm)

    reasons = [
        f"Влажность почвы {soil_moisture:.1f}% ниже порога {moisture_high}% "
        f"для культуры «{profile['display_name']}»."
    ]
    if soil_moisture < moisture_low:
        reasons.append("Критически низкий уровень — полив срочно необходим.")
    if air_temperature > heat_threshold:
        reasons.append(
            f"Высокая температура воздуха ({air_temperature:.1f}°C) "
            "увеличивает испарение."
        )

    return {
        "irrigate": True,
        "when": when_date.isoformat(),
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
    deficit_ratio = max(
        0.0,
        (moisture_high - soil_moisture) / max(moisture_high - moisture_low, 1.0),
    )
    amount = base_water_mm * max(deficit_ratio, 0.5)
    if air_temp > heat_threshold:
        amount += (air_temp - heat_threshold) * heat_coeff
    return amount


def _next_dry_day(forecast: list[dict], today: date, rain_skip_mm: float) -> date:
    daily: dict[date, float] = {}
    for entry in forecast:
        try:
            d = date.fromisoformat(entry["date"])
            daily[d] = float(entry.get("precipitation_sum", 0.0))
        except (KeyError, ValueError, TypeError):
            continue
    for offset in range(8):
        candidate = today + timedelta(days=offset)
        if daily.get(candidate, 0.0) < rain_skip_mm:
            return candidate
    return today