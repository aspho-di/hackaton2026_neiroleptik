"""
irrigation.py — Логика рекомендации полива.
Принимает профиль культуры из БД вместо захардкоженных констант.
"""

import math
from datetime import date, timedelta
from typing import Any

# Максимальная тепловая надбавка к поливу, мм — защита от аномальных датчиков
MAX_HEAT_ADD_MM = 10.0

# Базовая ET₀ для Ростовской области в вегетационный период, мм/день
BASE_ET0_MM_DAY = 4.0


def recommend_irrigation(
    soil_moisture: float,
    air_temperature: float,
    precip_forecast_7days: list[dict[str, Any]],
    profile: dict,
    today: date | None = None,
    humidity_air: float = 60.0,
    wind_speed: float = 2.0,
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
    humidity_air           : влажность воздуха, % (используется для расчёта ET₀)
    wind_speed             : скорость ветра, м/с (используется для расчёта ET₀)
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
        humidity_air, wind_speed,
    )
    when_date = _next_dry_day(precip_forecast_7days, today, rain_skip_mm, rain_skip_days)

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


def _calc_et0(air_temp: float, humidity_air: float, wind_speed: float) -> float:
    """
    Упрощённая оценка ET₀ (мм/день) по Пенману без данных солнечной радиации.
    Использует температуру воздуха, влажность и скорость ветра.
    Диапазон результата ограничен физически обоснованными значениями [0.5, 12.0].
    """
    # Давление насыщенного пара (кПа) — формула Тетенса
    es = 0.6108 * math.exp(17.27 * air_temp / (air_temp + 237.3))
    # Фактическое давление пара
    ea = max(0.0, humidity_air / 100.0 * es)
    # Дефицит давления пара (VPD)
    vpd = max(0.0, es - ea)
    # Наклон кривой насыщенного давления пара (Δ, кПа/°C)
    delta = 4098.0 * es / (air_temp + 237.3) ** 2
    # Психрометрическая постоянная (кПа/°C при стандартном давлении)
    gamma = 0.066
    # Аэродинамический член FAO-56 (учитывает ветер и VPD)
    denom = delta + gamma * (1.0 + 0.34 * wind_speed)
    et0_aero = gamma * (900.0 / (air_temp + 273.0)) * wind_speed * vpd / max(denom, 1e-6)
    # Радиационный член — прокси по температуре (Харгривс, без Rn)
    et0_rad = max(0.0, 0.0135 * (air_temp + 17.8))
    return max(0.5, min(et0_rad + et0_aero, 12.0))


def _calc_water(
    soil_moisture: float,
    air_temp: float,
    moisture_high: float,
    moisture_low: float,
    base_water_mm: float,
    heat_threshold: float,
    heat_coeff: float,
    humidity_air: float = 60.0,
    wind_speed: float = 2.0,
) -> float:
    # FIX 1: убран жёсткий floor 0.5 — маленький дефицит → маленький полив
    deficit_ratio = max(
        0.0,
        (moisture_high - soil_moisture) / max(moisture_high - moisture_low, 1.0),
    )
    amount = base_water_mm * deficit_ratio

    # FIX 2: тепловая надбавка ограничена MAX_HEAT_ADD_MM — защита от аномальных датчиков
    if air_temp > heat_threshold:
        heat_addition = min((air_temp - heat_threshold) * heat_coeff, MAX_HEAT_ADD_MM)
        amount += heat_addition

    # FIX 5: ET₀ по humidity_air и wind_speed — данные больше не выбрасываются
    et0 = _calc_et0(air_temp, humidity_air, wind_speed)
    et0_extra = max(0.0, et0 - BASE_ET0_MM_DAY)  # надбавка сверх базовой ET₀
    amount += et0_extra

    return max(0.0, amount)


def _next_dry_day(
    forecast: list[dict],
    today: date,
    rain_skip_mm: float,
    rain_skip_days: int = 1,
) -> date:
    # FIX 3: накапливаем дублирующиеся даты вместо перезаписи
    # FIX 4: дневной порог = rain_skip_mm / rain_skip_days — унификация с _sum_rain
    daily_threshold = rain_skip_mm / max(rain_skip_days, 1)
    daily: dict[date, float] = {}
    for entry in forecast:
        try:
            d = date.fromisoformat(entry["date"])
            daily[d] = daily.get(d, 0.0) + float(entry.get("precipitation_sum", 0.0))
        except (KeyError, ValueError, TypeError):
            continue
    for offset in range(8):
        candidate = today + timedelta(days=offset)
        if daily.get(candidate, 0.0) < daily_threshold:
            return candidate
    return today
