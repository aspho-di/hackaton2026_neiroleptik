package api

import (
	"database/sql"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-redis/redis/v8"
	httpswagger "github.com/swaggo/http-swagger"

	_ "agro-backend/docs"
	"agro-backend/internal/api/handlers"
	"agro-backend/internal/provider"
	"agro-backend/internal/repository"
	"agro-backend/internal/service"
)

func NewRouter(db *sql.DB, rdb *redis.Client) http.Handler {
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(chimiddleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Сервисы
	telegramSvc := service.NewTelegramService()
	alertSvc := service.NewAlertService(repository.NewAlertRepository(db), telegramSvc)

	weatherProvider := provider.NewWeatherProvider(
		os.Getenv("WEATHER_PROVIDER"),
		os.Getenv("OPENWEATHER_API_KEY"),
	)
	weatherSvc := service.NewWeatherService(weatherProvider)
	predictSvc := service.NewPredictService(
		repository.NewSensorRepository(db),
		repository.NewPredictionRepository(db),
		repository.NewFieldRepository(db),
		repository.NewAlertRepository(db),
		weatherSvc,
	)

	// Swagger UI
	r.Get("/swagger/*", httpswagger.Handler(
		httpswagger.URL("/swagger/doc.json"),
	))

	// Health
	r.Get("/health", handlers.HealthHandler)
	r.Get("/ready", handlers.ReadyHandler(db, rdb))

	// Endpoint для фронтенда — алерты в формате который ожидает фронт
	r.Get("/api/alerts", handlers.GetAlertsForFrontend(db))

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		// Fields
		r.Get("/fields", handlers.GetFields(db))
		r.Post("/fields", handlers.CreateField(db))
		r.Get("/fields/{id}", handlers.GetField(db))
		r.Put("/fields/{id}", handlers.UpdateField(db))
		r.Delete("/fields/{id}", handlers.DeleteField(db))

		// Sensors
		r.Post("/sensors/data", handlers.SaveSensorData(db, rdb, alertSvc))
		r.Get("/sensors/{field_id}", handlers.GetSensorData(db))

		// Predictions
		r.Post("/predict", handlers.GetPrediction(db, rdb, predictSvc))
		r.Get("/predictions/{field_id}", handlers.GetPredictions(db))

		// Alerts (внутренние)
		r.Get("/alerts", handlers.GetAlerts(db))
		r.Get("/alerts/unread", handlers.GetUnreadAlerts(db))
		r.Put("/alerts/{id}/read", handlers.MarkAlertRead(db))

		// ML proxy
		r.Get("/districts", handlers.GetDistricts)
		r.Get("/predict/forecast", handlers.GetForecast)
		r.Post("/predict/manual", handlers.PredictManual)
		r.Post("/recommend/irrigation", handlers.RecommendIrrigation)
		r.Post("/validate", handlers.ValidateData)
		r.Get("/config/profiles", handlers.GetConfigProfiles)
		r.Get("/ml/health", handlers.MLHealthHandler)
	})

	return r
}
