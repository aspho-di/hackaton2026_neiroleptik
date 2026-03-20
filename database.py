"""
database.py — Подключение к PostgreSQL через SQLAlchemy.
Настройки берутся из переменных окружения (.env).
"""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# ── URL подключения ───────────────────────────────────────────────────────────
# Формат: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/irrigation_db",
)

# ── Engine и Session ──────────────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # проверять соединение перед использованием
    pool_size=5,
    max_overflow=10,
    echo=False,               # True — выводить SQL-запросы в лог (удобно при отладке)
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    """
    FastAPI dependency — открывает сессию БД и закрывает после запроса.

    Использование:
        @app.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Создаёт все таблицы если они не существуют. Вызывается при старте приложения."""
    import models_db  # noqa: F401 — импорт модуля регистрирует модели в Base.metadata
    Base.metadata.create_all(bind=engine)

