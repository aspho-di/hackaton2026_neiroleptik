package handlers

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"github.com/go-redis/redis/v8"
)

var startTime = time.Now()

// HealthHandler godoc
// @Summary      Health check
// @Description  Проверка что сервис запущен
// @Tags         system
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Router       /health [get]
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"status":         "ok",
		"timestamp":      time.Now().Format(time.RFC3339),
		"uptime_seconds": int(time.Since(startTime).Seconds()),
		"service":        "agro-backend",
		"version":        "1.0.0",
	})
}

// ReadyHandler godoc
// @Summary      Readiness check
// @Description  Проверка готовности — БД и Redis доступны
// @Tags         system
// @Produce      json
// @Success      200  {object}  map[string]interface{}
// @Failure      503  {object}  map[string]interface{}
// @Router       /ready [get]
func ReadyHandler(db *sql.DB, rdb *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		dbOk := db.PingContext(ctx) == nil
		redisOk := rdb.Ping(ctx).Err() == nil

		status := "ok"
		httpStatus := http.StatusOK
		if !dbOk || !redisOk {
			status = "degraded"
			httpStatus = http.StatusServiceUnavailable
		}

		respondJSON(w, httpStatus, map[string]interface{}{
			"status":    status,
			"postgres":  boolToStatus(dbOk),
			"redis":     boolToStatus(redisOk),
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}
}

func boolToStatus(ok bool) string {
	if ok {
		return "ok"
	}
	return "unavailable"
}
