# АгроАналитика — Ростовская область

Платформа предиктивной аналитики для агрономов Ростовской области.
Прогнозирует урожайность, выдаёт рекомендации по поливу, отслеживает аномалии с датчиков и отправляет уведомления.

Разработано в рамках хакатона 2026 · кейс Банк Центр-Инвест.

---

## Архитектура

```
Браузер (React)
      │
      ▼
Go Backend  :8080       — REST API, прокси к ML, PostgreSQL, Redis, Telegram
      │
      ├──▶ ML Yield      :8001  — прогноз урожайности (sklearn, Open-Meteo)
      └──▶ ML Irrigation :8002  — рекомендации по поливу (FastAPI, профили культур)

PostgreSQL :5432         — поля, датчики, прогнозы, уведомления
Redis      :6379         — кэш прогнозов (30 мин)
```

Все сервисы поднимаются одной командой через Docker Compose.

---

## Быстрый старт

```bash
git clone https://github.com/aspho-di/hackaton2026_neiroleptik.git
cd hackaton2026_neiroleptik
cp .env.example .env        # заполни переменные (см. ниже)
docker-compose up --build
```

| Сервис | URL |
|--------|-----|
| Фронтенд (dev) | http://localhost:5173 |
| Go API + Swagger | http://localhost:8080/swagger/index.html |
| ML Yield | http://localhost:8001/docs |
| ML Irrigation | http://localhost:8002/docs |

Для фронтенда в режиме разработки:

```bash
cd frontend
npm install
npm run dev
```

---

## Сервисы

### Go Backend (`agro-backend/`) — порт 8080

Основной API-сервер. Хранит данные, обрабатывает запросы, проксирует ML-сервисы.

**Эндпоинты:**

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness (БД + Redis) |
| GET | `/api/v1/fields` | Список полей |
| POST | `/api/v1/fields` | Создать поле |
| GET | `/api/v1/fields/{id}` | Получить поле |
| PUT | `/api/v1/fields/{id}` | Обновить поле |
| DELETE | `/api/v1/fields/{id}` | Удалить поле |
| POST | `/api/v1/sensors/data` | Сохранить данные датчиков |
| GET | `/api/v1/sensors/{field_id}` | История датчиков |
| POST | `/api/v1/predict` | Прогноз урожайности + полива |
| GET | `/api/v1/predictions/{field_id}` | История прогнозов |
| GET | `/api/v1/predict/forecast?district=salsk` | Прогноз по району (→ ML Yield) |
| POST | `/api/v1/recommend/irrigation` | Рекомендация полива (→ ML Irrigation) |
| POST | `/api/v1/validate` | Валидация данных датчиков (→ ML Irrigation) |
| GET | `/api/v1/districts` | Список районов (→ ML Yield) |
| GET | `/api/v1/alerts` | Уведомления пользователя |
| GET | `/api/v1/alerts/unread` | Непрочитанные уведомления |
| PUT | `/api/v1/alerts/{id}/read` | Отметить как прочитанное |
| GET | `/api/v1/ml/health` | Статус ML сервисов |
| GET | `/api/v1/config/profiles` | Профили культур (→ ML Irrigation) |

**Стек:** Go · Chi · PostgreSQL · Redis · Swagger · Telegram Bot API · Docker

---

### ML Yield (`ml-yield/`) — порт 8001

Сервис прогноза урожайности на основе обученной модели и реальной погоды.

**Эндпоинты:**

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/predict/forecast?district=salsk` | Прогноз по погоде с Open-Meteo |
| POST | `/predict/manual` | Прогноз по введённым вручную данным |
| GET | `/districts` | Список доступных районов |
| GET | `/health` | Health check |

**Как работает:**
1. Скачивает прогноз погоды на 7 дней с Open-Meteo по координатам района
2. Вычисляет признаки: `temp_mean`, `precip_total`, `hot_days`, `water_balance` и др.
3. Прогоняет через `yield_model.pkl` (scikit-learn)
4. Возвращает `yield_prediction_centner_per_ha` + прогноз осадков для сервиса полива

**Стек:** Python · FastAPI · scikit-learn · Open-Meteo API · joblib

---

### ML Irrigation (`ml-irrigation/`) — порт 8002

Сервис рекомендаций по поливу с профилями культур в PostgreSQL.

**Эндпоинты:**

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/recommend/irrigation` | Рекомендация полива |
| POST | `/validate` | Валидация данных датчиков |
| GET | `/config/profiles` | Все профили культур |
| GET | `/config/profiles/{crop}` | Профиль конкретной культуры |
| POST | `/config/profiles` | Создать профиль культуры |
| PATCH | `/config/profiles/{crop}` | Обновить пороги культуры |
| GET | `/config/history` | История изменений профилей |
| GET | `/health` | Health check |

**Запрос на рекомендацию:**
```json
{
  "field_id": 45,
  "crop": "wheat",
  "soil_moisture_percent": 35.0,
  "soil_temperature": 18.0,
  "air_temperature": 25.0,
  "precip_forecast_7days": []
}
```

**Как работает:**
1. Валидирует данные датчиков по физическим пределам
2. Загружает профиль культуры из БД (пороги влажности, нормы полива)
3. Если `precip_forecast_7days` пустой — запрашивает у ML Yield (`:8001`)
4. Считает объём полива и ближайший подходящий день

**Стек:** Python · FastAPI · SQLAlchemy · PostgreSQL · httpx

---

### Frontend (`frontend/`) — порт 5173

React-приложение для агрономов.

**Страницы:**

| Маршрут | Описание |
|---------|----------|
| `/` | Dashboard — список полей, счётчики статусов |
| `/field/:id` | Карточка поля — прогноз, погода, форма датчика, график осадков |
| `/profile` | Профиль агронома — статистика, список полей |
| `/alerts` | Уведомления с фильтрацией по типу |
| `/history` | Историческая урожайность 2016–2025, история прогнозов |
| `/compare` | Сравнение 2–4 участков: таблица + радарная диаграмма |
| `/irrigation` | Оптимизация полива |
| `/login` | Вход |
| `/register` | Регистрация |

**Стек:** React 18 · Vite · Recharts · React Router

---

## Система уведомлений

Алерты создаются автоматически при сохранении данных датчиков:

| Условие | Уровень | Telegram |
|---------|---------|----------|
| Влажность почвы < 10% | critical | да |
| Влажность почвы > 90% | critical | да |
| Влажность почвы < 20% | medium | да |
| Температура > 38°C | critical | да |
| Температура < -5°C | critical | да |

---

## Переменные окружения

Скопируй `.env.example` в `.env` и заполни:

```env
# PostgreSQL
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=agro
DATABASE_URL=postgres://user:password@db:5432/agro?sslmode=disable

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Weather (mock | openweather)
WEATHER_PROVIDER=mock
OPENWEATHER_API_KEY=your_key

# Telegram
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

# ML сервисы (в docker-compose проставляются автоматически)
ML_SERVICE_1_URL=http://ml-yield:8001
ML_SERVICE_2_URL=http://ml-irrigation:8002
```

---

## Структура репозитория

```
hackaton2026_neiroleptik/
├── agro-backend/          # Go API сервер
│   ├── cmd/main.go
│   ├── internal/
│   │   ├── api/           # Chi роутер, handlers, ml_proxy
│   │   ├── service/       # Бизнес-логика, Telegram
│   │   ├── repository/    # Слой данных PostgreSQL
│   │   ├── models/        # Модели данных
│   │   └── provider/      # Погодные провайдеры
│   ├── migrations/        # SQL схема БД
│   └── docs/              # Swagger (авто)
├── ml-yield/              # Python сервис урожайности
│   ├── src/
│   │   ├── api.py         # FastAPI эндпоинты
│   │   ├── predict.py     # Логика прогноза
│   │   ├── train.py       # Обучение модели
│   │   └── fetch_weather.py
│   ├── models/
│   │   └── yield_model.pkl
│   └── data/
├── ml-irrigation/         # Python сервис полива
│   ├── api.py             # FastAPI эндпоинты
│   ├── irrigation.py      # Логика рекомендации
│   ├── validate.py        # Валидация датчиков
│   └── crud.py            # Работа с профилями культур
├── frontend/              # React приложение
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       └── api/
└── docker-compose.yml     # Запуск всех сервисов
```
