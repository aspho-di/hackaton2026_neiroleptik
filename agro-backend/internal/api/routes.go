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

	_ "agro-backend/docs" // swagger docs — генерируется командой swag init
	"agro-backend/internal/api/handlers"
	"agro-backend/internal/provider"
	"agro-backend/internal/repository"
	"agro-backend/internal/service"
)

func NewRouter(db *sql.DB, rdb *redis.Client) http.Handler {
	r := chi.NewRouter()

	// Middleware
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

	// API v1
	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/fields", handlers.GetFields(db))
		r.Post("/fields", handlers.CreateField(db))
		r.Get("/fields/{id}", handlers.GetField(db))
		r.Put("/fields/{id}", handlers.UpdateField(db))
		r.Delete("/fields/{id}", handlers.DeleteField(db))

		r.Post("/sensors/data", handlers.SaveSensorData(db, rdb, alertSvc))
		r.Get("/sensors/{field_id}", handlers.GetSensorData(db))

		r.Post("/predict", handlers.GetPrediction(db, rdb, predictSvc))
		r.Get("/predictions/{field_id}", handlers.GetPredictions(db))

		r.Get("/alerts", handlers.GetAlerts(db))
		r.Get("/alerts/unread", handlers.GetUnreadAlerts(db))
		r.Put("/alerts/{id}/read", handlers.MarkAlertRead(db))
	})

	return r
}
