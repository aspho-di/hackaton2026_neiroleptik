# АгроАналитика — Предиктивная аналитика для АПК Ростовской области

Хакатон 2026 · Кейс Банк Центр-Инвест «Сельское хозяйство»

Веб-платформа для агрономов Ростовской области: прогнозирование урожайности по культуре и району, рекомендации по поливу на основе данных датчиков, мониторинг аномалий и аналитика полей в режиме реального времени.

---

## Демо

| Сервис | URL |
|---|---|
| Веб-приложение | https://divine-bravery-production-6d24.up.railway.app |
| Go Backend API | https://hackaton2026neiroleptik-production.up.railway.app |
| Swagger UI | https://hackaton2026neiroleptik-production.up.railway.app/swagger/index.html |
| ML Yield API | http://178.72.166.137:8001/health |
| ML Irrigation API | http://178.72.166.137:8002/health |

---

## Деплой

| Сервис | Платформа |
|---|---|
| Frontend (React + Nginx) | Railway |
| Backend (Go) | Railway |
| PostgreSQL | Railway |
| Redis | Railway |
| ML Yield (:8001) | Selectel |
| ML Irrigation (:8002) | Selectel |

---

## Содержание

- [Возможности](#возможности)
- [Архитектура](#архитектура)
- [Стек технологий](#стек-технологий)
- [Быстрый старт](#быстрый-старт)
- [Разработка](#разработка)
- [API](#api)
- [Переменные окружения](#переменные-окружения)
- [Структура проекта](#структура-проекта)
- [Схема базы данных](#схема-базы-данных)
- [Страницы приложения](#страницы-приложения)
- [ML-модели](#ml-модели)

---

## Возможности

| Функция | Описание |
|---|---|
| Прогноз урожайности | XGBoost-классификатор на данных Open-Meteo. Учитывает район поля и тип культуры: пшеница 35 ц/га, кукуруза 50 ц/га, подсолнечник 22 ц/га, томаты 400 ц/га |
| Рекомендации по поливу | Расчёт объёма и даты полива по профилю культуры, влажности почвы, температуре и прогнозу осадков |
| Детектирование аномалий | Автоматическое выявление критических отклонений показаний датчиков |
| Водный баланс | График осадки − ET₀ по дням; ET₀ берётся из реального прогноза Open-Meteo |
| Данные с датчика | Два режима ввода: вручную и с внешнего API (настраиваемый URL, Bearer-токен, маппинг полей) |
| Исторический анализ | Динамика урожайности и погодных показателей Ростовской области 2016–2025 |
| Сравнение участков | Радарный график и таблица по 2–4 полям одновременно |
| Сезонный календарь | Агрономический план по культурам и фазам вегетации |
| Telegram-уведомления | Push-уведомления об аномалиях в реальном времени |
| Redis-кэширование | Кэш прогнозов по ключу `district_crop` — 10 минут для ML, 30 минут для Go |

---

## Архитектура

```
Браузер (React SPA)
  Dashboard · FieldDetail · History · Compare · IrrigationPlan · ...
        |
        | HTTP / JSON
        v
Go Backend :8080  [Railway]
  Chi Router · REST API · Redis Cache · Swagger UI
        |               |                  |
        v               v                  v
   PostgreSQL        Redis           Telegram Bot API
   [Railway]        [Railway]
        |
        | proxy
        +---------------------------+
        |                           |
        v                           v
ML Yield :8001 [Selectel]   ML Irrigation :8002 [Selectel]
FastAPI + XGBoost            FastAPI + crop profiles
Open-Meteo API               SQLAlchemy (PostgreSQL)
```

Все запросы фронтенда идут через единый Go-прокси на `:8080`. ML-сервисы не доступны напрямую из браузера.

---

## Стек технологий

### Frontend
| Библиотека | Назначение |
|---|---|
| React 18 + Vite 5 | SPA |
| React Router 6 | Клиентский роутинг |
| Recharts 2 | Графики (Line, Bar, Radar) |
| Montserrat + Inter | Типографика (Google Fonts) |

### Go Backend
| Технология | Назначение |
|---|---|
| Go | Язык |
| Chi v5 | HTTP-роутер |
| PostgreSQL 15 | Основная БД |
| Redis 7 | Кэш прогнозов |
| Swagger / Swag | Документация API |

### ML Yield (:8001)
| Технология | Назначение |
|---|---|
| Python 3.11 + FastAPI | API-фреймворк |
| XGBoost + scikit-learn | Бинарный классификатор урожайности |
| Open-Meteo API | Прогноз погоды (без ключа) |
| pandas | Подготовка признаков |

### ML Irrigation (:8002)
| Технология | Назначение |
|---|---|
| Python 3.11 + FastAPI | API-фреймворк |
| SQLAlchemy | Профили культур в PostgreSQL |
| httpx | Запрос осадков из ML Yield |

---

## Быстрый старт

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

Откройте http://localhost, зарегистрируйтесь с любыми данными и добавьте первое поле.

---

## Разработка

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

`.env.local`:
```
VITE_API_URL=http://localhost:8080
```

### Go Backend

```bash
cd agro-backend
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
GET    /api/v1/predict/forecast?district=&crop=  — прогноз ML + ET0 + осадки 7 дней
POST   /api/v1/predict/manual                    — прогноз по ручным погодным данным
POST   /api/v1/recommend/irrigation              — рекомендация полива
POST   /api/v1/validate                          — валидация показаний датчика
GET    /api/v1/config/profiles                   — список профилей культур
GET    /api/v1/config/profiles/{crop}            — профиль конкретной культуры
PATCH  /api/v1/config/profiles/{crop}            — обновить пороги профиля
GET    /api/v1/ml/health                         — статус ML-сервисов
GET    /api/v1/districts                         — список районов
```

### Уведомления

```
GET    /api/alerts                    — алерты для фронтенда
GET    /api/v1/alerts/unread          — непрочитанные
PUT    /api/v1/alerts/{id}/read       — отметить прочитанным
```

Полная интерактивная документация: `http://localhost:8080/swagger/index.html`

---

## Переменные окружения

### Go Backend

```
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

WEATHER_PROVIDER=mock
OPENWEATHER_API_KEY=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

ML_SERVICE_1_URL=http://ml-yield:8001
ML_SERVICE_2_URL=http://ml-irrigation:8002
```

### ML Irrigation

```
DATABASE_URL=postgresql://user:password@db:5432/agro
FORECAST_SERVICE_URL=http://ml-yield:8001/predict/forecast
```

### Frontend (сборка)

```
VITE_API_URL=http://localhost:8080
```

---

## Структура проекта

```
.
├── docker-compose.yml
│
├── agro-backend/                     Go REST API
│   ├── cmd/main.go
│   ├── internal/
│   │   ├── api/                      Chi-роутер, хендлеры
│   │   ├── models/                   Field, User, Prediction, Alert, SensorData
│   │   ├── repository/               Слой БД (интерфейсы + реализации)
│   │   ├── service/                  Бизнес-логика, Telegram, прогнозы
│   │   └── provider/                 Погодные провайдеры (Mock / OpenWeather)
│   ├── migrations/001_init.sql       Схема БД
│   └── Dockerfile
│
├── ml-yield/                         Сервис прогноза урожайности :8001
│   ├── src/
│   │   ├── api.py                    FastAPI endpoints, кэш 10 мин по district+crop
│   │   ├── predict.py                Инференс XGBoost, CROP_THRESHOLDS
│   │   ├── train.py                  Обучение модели
│   │   └── fetch_weather.py          Open-Meteo интеграция, 10 районов РО
│   ├── models/yield_model.pkl
│   └── Dockerfile
│
├── ml-irrigation/                    Сервис рекомендаций полива :8002
│   ├── api.py                        FastAPI endpoints
│   ├── irrigation.py                 Расчёт: дефицит влаги, ET0, осадки
│   ├── validate.py                   Валидация показаний датчиков
│   ├── crud.py                       CRUD профилей культур
│   └── Dockerfile
│
└── frontend/                         React SPA
    ├── src/
    │   ├── pages/                    12 страниц
    │   ├── components/               17 UI-компонентов
    │   ├── hooks/useFields.js        Синхронизация полей (API + localStorage)
    │   ├── api/client.js             Fetch-обёртка, маппинг районов -> ML-ключи
    │   ├── auth.js                   Сессия через localStorage
    │   └── index.css                 CSS-переменные, дизайн-система
    ├── vite.config.js
    └── Dockerfile
```

---

## Схема базы данных

| Таблица | Поля |
|---|---|
| users | id, email, name, created_at |
| fields | id, user_id, name, area_hectares, crop_type, latitude, longitude, created_at |
| sensor_data | id, field_id, soil_moisture, temperature, humidity, timestamp |
| predictions | id, field_id, yield_prediction, irrigation_recommendation, confidence, is_anomaly, created_at |
| alerts | id, user_id, field_id, message, severity, is_read, created_at |

---

## Страницы приложения

| Маршрут | Описание |
|---|---|
| `/` | Публичный лендинг |
| `/login` | Форма входа |
| `/register` | Регистрация агронома |
| `/dashboard` | Список полей, счётчики статусов, монитор сервисов |
| `/field/:id` | Прогноз урожайности, водный баланс, форма датчика, аномалии |
| `/history` | История прогнозов, справочные данные по РО 2016–2025 |
| `/compare` | Сравнение 2–4 полей: радарный график + таблица |
| `/irrigation` | Сводный план полива по всем участкам |
| `/calendar` | Агрономический календарь по культурам |
| `/alerts` | Уведомления с фильтрацией по типу и важности |
| `/profile` | Профиль агронома, статистика |

---

## ML-модели

### Прогноз урожайности (XGBoost, :8001)

Обучена на исторических данных урожайности и погоды Ростовской области за 10 лет.

Входные признаки: средняя/макс/мин температура, сумма осадков, количество дождливых дней, скорость ветра, суммарная эвапотранспирация, жаркие дни (>35°C), сухие дни, водный баланс.

Выход: бинарная метка 0 (низкий) / 1 (хороший) + вероятность хорошего урожая + прогноз осадков и ET0 по дням на 7 дней. Порог урожайности зависит от культуры.

| Культура | Ключ | Порог (ц/га) |
|---|---|---|
| Пшеница | wheat | 35 |
| Кукуруза | corn | 50 |
| Подсолнечник | sunflower | 22 |
| Томаты | tomato | 400 |

### Рекомендации по поливу (FastAPI + профили культур, :8002)

Вход: тип культуры, влажность почвы (%), температура почвы и воздуха, влажность воздуха, скорость ветра, прогноз осадков на 7 дней.

Логика: загрузка профиля культуры из БД → валидация показаний → расчёт дефицита влаги → ET0 с учётом температуры и ветра → рекомендуемый объём (мм) с поправкой на прогноз дождей.

Профили культур (пороги влажности, нормы полива, температурные лимиты) настраиваются через `/api/v1/config/profiles`.
