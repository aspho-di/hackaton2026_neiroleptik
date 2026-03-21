"""
database.py — Подключение к PostgreSQL через SQLAlchemy.
Настройки берутся из переменных окружения (.env).

FIX B8: engine и SessionLocal создаются лениво через get_engine() / get_session_factory(),
а не на уровне модуля при импорте. Это позволяет:
  - запускать тесты без реальной БД (передаётся тестовый URL через переменную окружения);
  - делать mypy/ruff/import без DATABASE_URL в окружении.
"""

import os
from typing import Generator

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# ── Глобальные синглтоны (инициализируются один раз при первом вызове) ────────
_engine: Engine | None = None
_SessionLocal: sessionmaker | None = None  # type: ignore[type-arg]


class Base(DeclarativeBase):
    pass


# ── Фабрика движка ────────────────────────────────────────────────────────────

def get_engine() -> Engine:
    """
    Возвращает (или создаёт) SQLAlchemy Engine.
    DATABASE_URL проверяется здесь, а не при импорте модуля — тесты могут
    подменить переменную окружения до первого вызова.
    """
    global _engine
    if _engine is None:
        # FIX B8: проверка URL отложена до реальной попытки подключения
        url = os.environ.get("DATABASE_URL")
        if not url:
            raise RuntimeError(
                "Переменная окружения DATABASE_URL не задана. "
                "Добавьте её в .env или передайте при запуске."
            )
        sql_echo: bool = os.getenv("SQL_ECHO", "false").lower() == "true"
        _engine = create_engine(
            url,
            pool_pre_ping=True,   # проверять соединение перед использованием
            pool_size=5,
            max_overflow=10,
            echo=sql_echo,
        )
    return _engine


def get_session_factory() -> sessionmaker:  # type: ignore[type-arg]
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            bind=get_engine(),
            autocommit=False,
            autoflush=False,
        )
    return _SessionLocal


# ── Обратная совместимость: SessionLocal как свойство-обёртка ─────────────────
# Старый код вида `from database import SessionLocal; db = SessionLocal()`
# продолжает работать без изменений.

class _SessionProxy:
    """Прокси: вызов SessionProxy() делегируется фабрике."""
    def __call__(self) -> Session:
        return get_session_factory()()

    def __getattr__(self, name: str):
        return getattr(get_session_factory(), name)


SessionLocal = _SessionProxy()


# ── FastAPI dependency ────────────────────────────────────────────────────────

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency — открывает сессию БД и закрывает после запроса.

    Использование:
        @app.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = get_session_factory()()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Создаёт все таблицы если они не существуют. Вызывается при старте приложения.

    FIX B9: models_db импортируется здесь же (не в отдельной функции), что делает
    зависимость явной и устраняет скрытый циклический импорт.
    """
    import models_db  # noqa: F401 — регистрирует модели в Base.metadata
    Base.metadata.create_all(bind=get_engine())

