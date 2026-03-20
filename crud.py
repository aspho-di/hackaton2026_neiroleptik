"""
crud.py — Операции с базой данных (Create / Read / Update).

Содержит всю логику работы с таблицами crop_profiles и threshold_history.
api.py вызывает функции отсюда — не пишет SQL напрямую.
"""

from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from models_db import CropProfile, ThresholdHistory

# ── Поля, которые можно менять через PATCH ────────────────────────────────────
PATCHABLE_FIELDS = {
    "display_name",
    "moisture_threshold_high",
    "moisture_threshold_low",
    "rain_skip_mm",
    "rain_skip_days",
    "base_water_mm",
    "heat_threshold",
    "heat_coeff",
    "description",
}


# ── Чтение ────────────────────────────────────────────────────────────────────

def get_all_profiles(db: Session) -> Sequence[CropProfile]:
    """Возвращает все профили культур."""
    result = db.execute(select(CropProfile).order_by(CropProfile.crop_name))
    return result.scalars().all()


def get_profile(db: Session, crop_name: str) -> CropProfile | None:
    """Возвращает профиль по названию культуры или None."""
    result = db.execute(
        select(CropProfile).where(CropProfile.crop_name == crop_name.lower().strip())
    )
    return result.scalars().first()


def get_history(
    db: Session,
    crop_name: str | None = None,
    limit: int = 100,
) -> Sequence[ThresholdHistory]:
    """
    История изменений порогов.
    Если crop_name передан — только для этой культуры.
    """
    stmt = select(ThresholdHistory).order_by(ThresholdHistory.changed_at.desc())
    if crop_name:
        stmt = stmt.where(ThresholdHistory.crop_name == crop_name.lower().strip())
    stmt = stmt.limit(limit)
    result = db.execute(stmt)
    return result.scalars().all()


# ── Создание ──────────────────────────────────────────────────────────────────

def create_profile(
    db: Session,
    crop_name: str,
    display_name: str,
    created_by: str,
    moisture_threshold_high: float = 70.0,
    moisture_threshold_low: float = 30.0,
    rain_skip_mm: float = 5.0,
    rain_skip_days: int = 2,
    base_water_mm: float = 20.0,
    heat_threshold: float = 25.0,
    heat_coeff: float = 0.4,
    description: str | None = None,
) -> CropProfile:
    """Создаёт новый профиль культуры."""
    profile = CropProfile(
        crop_name=crop_name.lower().strip(),
        display_name=display_name,
        moisture_threshold_high=moisture_threshold_high,
        moisture_threshold_low=moisture_threshold_low,
        rain_skip_mm=rain_skip_mm,
        rain_skip_days=rain_skip_days,
        base_water_mm=base_water_mm,
        heat_threshold=heat_threshold,
        heat_coeff=heat_coeff,
        description=description,
        updated_by=created_by,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


# ── Обновление ────────────────────────────────────────────────────────────────

def update_profile(
    db: Session,
    profile: CropProfile,
    updates: dict,
    changed_by: str,
    comment: str | None = None,
) -> CropProfile:
    """
    Обновляет пороги профиля и записывает историю изменений.

    Parameters
    ----------
    profile    : CropProfile — объект из БД
    updates    : dict — только изменяемые поля (из PATCHABLE_FIELDS)
    changed_by : str — кто вносит изменения
    comment    : str | None — причина изменения
    """
    history_entries: list[ThresholdHistory] = []

    for field, new_value in updates.items():
        if field not in PATCHABLE_FIELDS:
            continue

        old_value = getattr(profile, field)

        # Пишем в историю только если значение реально изменилось
        if str(old_value) != str(new_value):
            history_entries.append(
                ThresholdHistory(
                    profile_id=profile.id,
                    crop_name=profile.crop_name,
                    field_name=field,
                    old_value=str(old_value),
                    new_value=str(new_value),
                    changed_by=changed_by,
                    changed_at=datetime.now(timezone.utc),
                    comment=comment,
                )
            )
            setattr(profile, field, new_value)

    if history_entries:
        profile.updated_by = changed_by
        profile.updated_at = datetime.now(timezone.utc)
        db.add_all(history_entries)
        db.commit()
        db.refresh(profile)

    return profile


# ── Сиды (начальные данные) ───────────────────────────────────────────────────

DEFAULT_PROFILES: list[dict] = [
    {
        "crop_name": "wheat",
        "display_name": "Пшеница",
        "moisture_threshold_high": 60.0,
        "moisture_threshold_low": 25.0,
        "rain_skip_mm": 4.0,
        "base_water_mm": 15.0,
        "heat_threshold": 28.0,
        "description": "Озимая и яровая пшеница",
    },
    {
        "crop_name": "tomato",
        "display_name": "Томаты",
        "moisture_threshold_high": 75.0,
        "moisture_threshold_low": 40.0,
        "rain_skip_mm": 6.0,
        "base_water_mm": 25.0,
        "heat_threshold": 22.0,
        "description": "Томаты открытого и закрытого грунта",
    },
    {
        "crop_name": "corn",
        "display_name": "Кукуруза",
        "moisture_threshold_high": 65.0,
        "moisture_threshold_low": 30.0,
        "rain_skip_mm": 5.0,
        "base_water_mm": 20.0,
        "heat_threshold": 30.0,
        "description": "Кукуруза на зерно и силос",
    },
    {
        "crop_name": "sunflower",
        "display_name": "Подсолнечник",
        "moisture_threshold_high": 55.0,
        "moisture_threshold_low": 20.0,
        "rain_skip_mm": 4.0,
        "base_water_mm": 12.0,
        "heat_threshold": 30.0,
        "description": "Засухоустойчивая культура",
    },
]


def seed_default_profiles(db: Session) -> int:
    """
    Заполняет таблицу начальными профилями если она пустая.
    Возвращает количество добавленных записей.
    """
    existing = len(db.execute(select(CropProfile)).scalars().all())
    if existing > 0:
        return 0

    added = 0
    for data in DEFAULT_PROFILES:
        profile = CropProfile(**data, updated_by="system")
        db.add(profile)
        added += 1

    db.commit()
    return added
