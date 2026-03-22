# АгроАналитика — Предиктивная аналитика для АПК Ростовской области

> Хакатон 2026 · Кейс Банк Центр-Инвест «Сельское хозяйство»

Веб-платформа для агрономов Ростовской области: прогнозирование урожайности, рекомендации по поливу, мониторинг аномалий датчиков и аналитика полей в режиме реального времени.

---

## Содержание

- [О проекте](#о-проекте)
- [Возможности](#возможности)
- [Архитектура](#архитектура)
- [Стек технологий](#стек-технологий)
- [Быстрый старт](#быстрый-старт)
- [Разработка](#разработка)
- [API](#api)
- [Переменные окружения](#переменные-окружения)
- [Структура проекта](#структура-проекта)

---

## О проекте

**АгроАналитика** решает задачу цифровизации управления сельхозугодиями для агрономов Ростовской области. Система объединяет:

- **ML-прогнозирование** урожайности на основе исторических данных и погоды (XGBoost)
- **Рекомендации по поливу** с учётом показаний датчиков и профиля культуры
- **Детектирование аномалий** в показаниях датчиков почвы и воздуха
- **Telegram-уведомления** об аномалиях и рекомендациях в реальном времени
- **Сравнительную аналитику** по полям и районам Ростовской области

---

## Возможности

| Функция | Описание |
|---|---|
| Прогноз урожайности | XGBoost-модель на данных Open-Meteo + 10 лет истории по РО |
| Оптимизация полива | Рекомендации по объёму и срокам с учётом культуры и прогноза осадков |
| Детектирование аномалий | Автоматическое выявление критических отклонений показаний датчиков |
| Telegram-бот | Push-уведомления об аномалиях и рекомендациях |
| Исторический анализ | Динамика урожайности и погодных показателей 2016–2025 |
| Сравнение участков | Радарный график и таблица по 2–4 полям одновременно |
| Сезонный календарь | Агрономический план по культурам и фазам вегетации |
| Redis-кэширование | Кэш прогнозов 30 минут — снижение нагрузки на ML-сервисы |
| Мониторинг сервисов | Виджет статуса Go API / ML-сервисов / Open-Meteo на дашборде |

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                      Браузер (React SPA)                        │
│  Dashboard · FieldDetail · History · Compare · IrrigationPlan   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP / JSON
                           ▼
┌────────────────────────────────────────────────────────────────┐
│                    Go Backend  :8080                            │
│   Chi Router · REST API · Redis Cache · Swagger UI             │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │    Redis    │  │   Telegram Bot API   │  │
│  │    :5432     │  │   :6379     │  │     (алерты)         │  │
│  └──────────────┘  └─────────────┘  └──────────────────────┘  │
└──────────┬──────────────────────────────┬──────────────────────┘
           │ proxy                        │ proxy
           ▼                              ▼
┌─────────────────────┐      ┌────────────────────────┐
│  ML Yield  :8001    │      │  ML Irrigation  :8002  │
│  FastAPI            │      │  FastAPI + SQLAlchemy  │
│  XGBoost            │      │  scikit-learn          │
│  Open-Meteo API     │      │  crop profiles (DB)    │
└─────────────────────┘      └────────────────────────┘
```

Все запросы фронтенда идут через единый Go-прокси на `:8080`. ML-сервисы изолированы и не доступны напрямую из браузера.

---

## Стек технологий

### Frontend
| Библиотека | Назначение |
|---|---|
| React 18 + Vite 5 | SPA, HMR, PWA |
| React Router 6 | Клиентский роутинг |
| Recharts 2 | Графики (Line, Bar, Radar, Composed) |
| Montserrat + Inter | Google Fonts |

### Go Backend
| Технология | Назначение |
|---|---|
| Go 1.25 | Язык |
| Chi v5 | HTTP-роутер |
| PostgreSQL 15 | Основная БД |
| Redis 7 | Кэш прогнозов (TTL 30 мин) |
| Swagger / Swag | Авто-документация API |

### ML Yield (:8001)
| Технология | Назначение |
|---|---|
| Python 3.11 + FastAPI 0.111 | API-фреймворк |
| XGBoost 2.0 + scikit-learn 1.4 | Бинарный классификатор урожайности |
| Open-Meteo API | Прогноз погоды (бесплатно, без ключа) |
| pandas 2.2 | Подготовка признаков |

### ML Irrigation (:8002)
| Технология | Назначение |
|---|---|
| Python 3.11 + FastAPI 0.111 | API-фреймворк |
| scikit-learn 1.4 | Движок рекомендаций |
| SQLAlchemy 2.0 | Профили культур в PostgreSQL |
| httpx 0.27 | Запрос осадков из ML Yield |

---

## Быстрый старт

### Docker Compose (рекомендуется)

```bash
git clone https://github.com/aspho-di/hackaton2026_neiroleptik.git
cd hackaton2026_neiroleptik

docker compose up --build
```

| Сервис | URL |
|---|---|
| Фронтенд | http://localhost |
| Go API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger/index.html |
| ML Yield docs | http://localhost:8001/docs |
| ML Irrigation docs | http://localhost:8002/docs |

Откройте http://localhost, зарегистрируйтесь с любыми данными — и начните работу.

---

## Разработка

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

`.env.local`:
```env
VITE_API_URL=http://localhost:8080
```

### Go Backend

```bash
cd agro-backend

# Запустить только зависимости
docker compose up db redis -d

go mod download
go run ./cmd/main.go
```

### ML Yield

```bash
cd ml-yield
pip install -r requirements.txt
uvicorn src.api:app --reload --port 8001
```

### ML Irrigation

```bash
cd ml-irrigation
pip install -r requirements.txt
uvicorn api:app --reload --port 8002
```

---

## API

### Поля

```
GET    /api/v1/fields              — список всех полей
POST   /api/v1/fields              — создать поле
GET    /api/v1/fields/{id}         — карточка поля
PUT    /api/v1/fields/{id}         — обновить поле
DELETE /api/v1/fields/{id}         — удалить поле
```

### Датчики и прогнозы

```
POST   /api/v1/sensors/data            — сохранить показания (триггер алертов)
GET    /api/v1/sensors/{field_id}      — история показаний
POST   /api/v1/predict                 — прогноз урожайности (Go-формула)
GET    /api/v1/predictions/{field_id}  — история прогнозов
```

### ML-прокси

```
GET    /api/v1/predict/forecast       — прогноз ML (XGBoost) + осадки 7 дней
POST   /api/v1/recommend/irrigation   — рекомендация полива
POST   /api/v1/validate               — валидация показаний датчика
GET    /api/v1/config/profiles        — профили культур
GET    /api/v1/ml/health              — статус ML-сервисов
```

### Уведомления

```
GET    /api/alerts                    — алерты для фронтенда
GET    /api/v1/alerts/unread          — непрочитанные
PUT    /api/v1/alerts/{id}/read       — отметить прочитанным
```

Полная интерактивная документация: **http://localhost:8080/swagger/index.html**

---

## Переменные окружения

### Go Backend

```env
PORT=8080

DB_HOST=db
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_NAME=agro
DB_SSLMODE=disable

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

WEATHER_PROVIDER=mock           # mock | openweather
OPENWEATHER_API_KEY=            # нужен только для openweather

TELEGRAM_BOT_TOKEN=             # токен бота @BotFather
TELEGRAM_CHAT_ID=               # ID чата для уведомлений

ML_SERVICE_1_URL=http://ml-yield:8001
ML_SERVICE_2_URL=http://ml-irrigation:8002
```

### ML Irrigation

```env
DATABASE_URL=postgresql://user:password@db:5432/agro
FORECAST_SERVICE_URL=http://ml-yield:8001/predict/forecast
```

### Frontend (сборка)

```env
VITE_API_URL=http://localhost:8080
```

---

## Структура проекта

```
.
├── docker-compose.yml            # Оркестрация всех сервисов
│
├── agro-backend/                 # Go REST API
│   ├── cmd/main.go
│   ├── internal/
│   │   ├── api/                  # Chi-роутер + 8 файлов хендлеров
│   │   ├── models/               # Field, User, Prediction, Alert, SensorData
│   │   ├── repository/           # Слой БД (интерфейсы + реализации)
│   │   ├── service/              # Бизнес-логика, Telegram, прогнозы
│   │   └── provider/             # Погодные провайдеры (Mock / OpenWeather)
│   ├── migrations/001_init.sql   # Схема БД
│   └── Dockerfile                # Multi-stage Go build
│
├── ml-yield/                     # Сервис прогноза урожайности
│   ├── src/
│   │   ├── api.py                # FastAPI endpoints
│   │   ├── predict.py            # Инференс XGBoost
│   │   ├── train.py              # Обучение модели
│   │   └── fetch_weather.py      # Open-Meteo интеграция
│   ├── models/yield_model.pkl    # Обученная модель
│   └── Dockerfile
│
├── ml-irrigation/                # Сервис рекомендаций полива
│   ├── api.py                    # FastAPI endpoints
│   ├── irrigation.py             # Движок рекомендаций
│   ├── validate.py               # Валидация показаний датчиков
│   ├── crud.py                   # CRUD профилей культур
│   └── Dockerfile
│
└── frontend/                     # React SPA
    ├── src/
    │   ├── pages/                # 12 страниц
    │   ├── components/           # UI-компоненты
    │   ├── hooks/useFields.js    # Хук синхронизации полей (API + localStorage)
    │   ├── api/client.js         # Fetch-обёртка для всех эндпоинтов
    │   ├── auth.js               # Сессия через localStorage
    │   └── index.css             # CSS-переменные, дизайн-система
    ├── vite.config.js
    └── Dockerfile                # Multi-stage Node → Nginx
```

---

## Страницы приложения

| Маршрут | Страница | Описание |
|---|---|---|
| `/` | Landing | Публичный лендинг с описанием платформы |
| `/login` | Login | Форма входа |
| `/register` | Register | Регистрация агронома |
| `/dashboard` | Dashboard | Список полей, счётчики статусов, монитор сервисов |
| `/field/:id` | FieldDetail | Прогноз, осадки, водный баланс, форма датчика, аномалии |
| `/history` | History | История прогнозов + справочные данные по РО 2016–2025 |
| `/compare` | Compare | Сравнение 2–4 полей: радар + таблица лучших/худших |
| `/irrigation` | IrrigationPlan | Сводный план полива по всем участкам |
| `/calendar` | SeasonalCalendar | Агрономический календарь по культурам |
| `/alerts` | Alerts | Уведомления с фильтрацией по типу и важности |
| `/profile` | Profile | Профиль агронома, статистика, подключение Telegram |

---

## ML-модели

### Прогноз урожайности (XGBoost, `:8001`)

Обучена на исторических данных урожайности и погоды Ростовской области за 10 лет.

**Входные признаки:** средняя/макс/мин температура, сумма осадков, количество дождливых дней, скорость ветра, эвапотранспирация, жаркие дни (>30°C), водный баланс.

**Выход:** бинарная метка (урожайно/не урожайно) + уверенность модели + прогноз осадков на 7 дней.

### Рекомендации по поливу (scikit-learn, `:8002`)

**Вход:** тип культуры, влажность почвы (%), температура почвы и воздуха, прогноз осадков.

**Логика:** загрузка профиля культуры из БД → валидация показаний → расчёт дефицита влаги → рекомендуемый объём (мм) и оптимальная дата полива.

**Профили культур:** пшеница, подсолнечник, кукуруза, ячмень, томат — пороги влажности, нормы полива и температурные лимиты настраиваются через API (`/api/v1/config/profiles`).
