"""
models_db.py — ORM-модели таблиц PostgreSQL.

Таблицы:
  crop_profiles      — пороги полива по культурам
  threshold_history  — история всех изменений порогов
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class CropProfile(Base):
    """
    Профиль культуры — пороговые значения для расчёта рекомендации полива.

    Пример строки:
      crop_name="wheat", moisture_threshold_high=65.0, rain_skip_mm=4.0, ...
    """

    __tablename__ = "crop_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    crop_name: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True,
        comment="Название культуры (wheat, tomato, corn, ...)",
    )
    display_name: Mapped[str] = mapped_column(
        String(200), nullable=False,
        comment="Человекочитаемое название (Пшеница, Томаты, ...)",
    )

    # ── Пороги влажности ──────────────────────────────────────────────────────
    moisture_threshold_high: Mapped[float] = mapped_column(
        Float, nullable=False, default=70.0,
        comment="Влажность выше этого % — полив не нужен",
    )
    moisture_threshold_low: Mapped[float] = mapped_column(
        Float, nullable=False, default=30.0,
        comment="Влажность ниже этого % — критический уровень",
    )

    # ── Параметры осадков ─────────────────────────────────────────────────────
    rain_skip_mm: Mapped[float] = mapped_column(
        Float, nullable=False, default=5.0,
        comment="Если осадки > этого значения в ближ. 2 дня — полив пропускаем",
    )
    rain_skip_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=2,
        comment="Сколько ближайших дней смотрим на осадки",
    )

    # ── Параметры полива ──────────────────────────────────────────────────────
    base_water_mm: Mapped[float] = mapped_column(
        Float, nullable=False, default=20.0,
        comment="Базовый объём полива, мм",
    )
    heat_threshold: Mapped[float] = mapped_column(
        Float, nullable=False, default=25.0,
        comment="Температура воздуха выше этого порога — добавляем воду",
    )
    heat_coeff: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.4,
        comment="Мм воды на каждый °C сверх heat_threshold",
    )

    # ── Метаданные ────────────────────────────────────────────────────────────
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Дополнительное описание профиля",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_by: Mapped[str | None] = mapped_column(
        String(200), nullable=True,
        comment="Кто последний изменил профиль",
    )

    # ── Связь с историей ──────────────────────────────────────────────────────
    history: Mapped[list["ThresholdHistory"]] = relationship(
        "ThresholdHistory", back_populates="profile", cascade="all, delete-orphan"
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "crop_name": self.crop_name,
            "display_name": self.display_name,
            "moisture_threshold_high": self.moisture_threshold_high,
            "moisture_threshold_low": self.moisture_threshold_low,
            "rain_skip_mm": self.rain_skip_mm,
            "rain_skip_days": self.rain_skip_days,
            "base_water_mm": self.base_water_mm,
            "heat_threshold": self.heat_threshold,
            "heat_coeff": self.heat_coeff,
            "description": self.description,
            "updated_at": self.updated_at.isoformat(),
            "updated_by": self.updated_by,
        }


class ThresholdHistory(Base):
    """
    История изменений порогов культуры.
    Каждое изменение любого поля — отдельная запись.
    """

    __tablename__ = "threshold_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("crop_profiles.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    crop_name: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True,
        comment="Дублируем для удобства запросов без JOIN",
    )

    field_name: Mapped[str] = mapped_column(
        String(100), nullable=False,
        comment="Какое поле было изменено",
    )
    old_value: Mapped[str | None] = mapped_column(
        String(200), nullable=True,
        comment="Старое значение (строка для универсальности)",
    )
    new_value: Mapped[str] = mapped_column(
        String(200), nullable=False,
        comment="Новое значение",
    )

    changed_by: Mapped[str] = mapped_column(
        String(200), nullable=False,
        comment="Кто изменил (имя агронома / логин)",
    )
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    comment: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="Причина изменения (опционально)",
    )

    # ── Связь с профилем ──────────────────────────────────────────────────────
    profile: Mapped["CropProfile"] = relationship("CropProfile", back_populates="history")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "crop_name": self.crop_name,
            "field_name": self.field_name,
            "old_value": self.old_value,
            "new_value": self.new_value,
            "changed_by": self.changed_by,
            "changed_at": self.changed_at.isoformat(),
            "comment": self.comment,
        }
