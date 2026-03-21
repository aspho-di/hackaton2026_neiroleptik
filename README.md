# 🌾 Agro Backend

Сервис предиктивной аналитики для сельского хозяйства Ростовской области.
Прогнозирует урожайность и даёт рекомендации по поливу на основе данных датчиков и погоды.

## 🚀 Быстрый старт

```bash
git clone <repo>
cd agro-backend
cp .env.example .env  # заполни переменные
docker-compose up --build
```

Сервис доступен на `http://localhost:8080`

## 📖 API документация

Swagger UI: `http://localhost:8080/swagger/index.html`

## 🔌 Endpoints

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check (БД + Redis) |
| GET | `/api/v1/fields` | Список полей |
| POST | `/api/v1/fields` | Создать поле |
| GET | `/api/v1/fields/{id}` | Получить поле |
| PUT | `/api/v1/fields/{id}` | Обновить поле |
| DELETE | `/api/v1/fields/{id}` | Удалить поле |
| POST | `/api/v1/sensors/data` | Отправить данные датчиков |
| GET | `/api/v1/sensors/{field_id}` | История датчиков |
| POST | `/api/v1/predict` | Получить прогноз полива |
| GET | `/api/v1/predictions/{field_id}` | История прогнозов |
| GET | `/api/v1/alerts` | Уведомления |
| GET | `/api/v1/alerts/unread` | Непрочитанные |
| PUT | `/api/v1/alerts/{id}/read` | Отметить прочитанным |

## 🧪 Пример использования

**Создать поле:**
```bash
curl -X POST http://localhost:8080/api/v1/fields \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"name":"Поле №1","area_hectares":10.5,"crop_type":"wheat","latitude":47.2,"longitude":39.7}'
```

**Отправить данные датчиков:**
```bash
curl -X POST http://localhost:8080/api/v1/sensors/data \
  -H "Content-Type: application/json" \
  -d '{"field_id":1,"soil_moisture":55.0,"temperature":24.5,"humidity":62.0}'
```

**Получить прогноз полива:**
```bash
curl -X POST http://localhost:8080/api/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"field_id":1,"latitude":47.2,"longitude":39.7,"user_id":1}'
```

**Аномалия — триггер Telegram уведомления:**
```bash
curl -X POST http://localhost:8080/api/v1/sensors/data \
  -H "Content-Type: application/json" \
  -d '{"field_id":1,"soil_moisture":5,"temperature":24.5,"humidity":62.0}'
```

## ⚙️ Переменные окружения

```env
PORT=8080

# PostgreSQL
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=agro
DATABASE_URL=postgres://user:password@db:5432/agro?sslmode=disable

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Weather (mock или openweather)
WEATHER_PROVIDER=openweather
OPENWEATHER_API_KEY=your_key_here

# Telegram уведомления
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

## 🏗 Архитектура

```
agro-backend/
├── cmd/main.go              # Точка входа, graceful shutdown
├── configs/config.go        # Конфигурация из env
├── internal/
│   ├── api/
│   │   ├── routes.go        # Chi роутер, middleware, CORS
│   │   └── handlers/        # HTTP handlers
│   ├── service/             # Бизнес-логика
│   │   ├── predict_service.go
│   │   ├── alert_service.go
│   │   ├── weather_service.go
│   │   └── telegram.go
│   ├── repository/          # Слой данных (PostgreSQL)
│   ├── models/              # Модели данных
│   └── provider/            # Weather провайдеры
├── pkg/
│   ├── database/postgres.go
│   └── redis/redis.go
├── migrations/001_init.sql  # Схема БД
└── docs/                    # Swagger (генерируется автоматически)
```

## 🛠 Технологии

| Компонент | Технология |
|-----------|------------|
| Backend | Go 1.25 |
| Router | Chi v5 |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Docs | Swagger (swaggo) |
| Notifications | Telegram Bot API |
| Container | Docker + Docker Compose |

## 🔔 Система уведомлений

Алерты создаются автоматически при:
- Влажность почвы < 10% → 🚨 Критическая засуха
- Влажность почвы > 90% → 🚨 Переувлажнение
- Влажность почвы < 20% → ⚠️ Рекомендуется полив
- Температура > 38°C → 🚨 Тепловой стресс
- Температура < -5°C → 🚨 Заморозки

Critical и medium алерты автоматически отправляются в Telegram.

## 🤖 ML прогнозирование

Прогноз учитывает:
- Текущую влажность почвы
- Температуру и влажность воздуха
- Погодный прогноз (осадки снижают рекомендацию по поливу)
- Обнаружение аномалий в данных датчиков

При аномалии прогноз помечается флагом `is_anomaly: true` и `confidence` снижается до 0.4.

## 📊 Кэширование

Прогнозы кэшируются в Redis на 30 минут. Кэш инвалидируется автоматически при получении новых данных с датчиков.
