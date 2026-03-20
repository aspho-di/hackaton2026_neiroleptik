package handlers

import (
	"agro-backend/internal/models"
	"agro-backend/internal/repository"
	"agro-backend/internal/service"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-redis/redis/v8"
)

// PredictRequest запрос на получение прогноза
type PredictRequest struct {
	FieldID   int64   `json:"field_id" example:"1"`
	Latitude  float64 `json:"latitude" example:"47.2"`
	Longitude float64 `json:"longitude" example:"39.7"`
	UserID    int64   `json:"user_id" example:"1"`
}

// GetPrediction godoc
// @Summary      Получить прогноз
// @Description  Рассчитывает прогноз урожайности и рекомендацию по поливу на основе данных датчиков и погоды. При аномалии возвращает warning.
// @Tags         predictions
// @Accept       json
// @Produce      json
// @Param        request  body      PredictRequest  true  "Параметры запроса"
// @Success      200      {object}  models.PredictionResponse
// @Failure      400      {object}  map[string]string
// @Failure      500      {object}  map[string]string
// @Router       /api/v1/predict [post]
func GetPrediction(db *sql.DB, rdb *redis.Client, predictSvc *service.PredictService) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req PredictRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if req.FieldID <= 0 {
			respondError(w, http.StatusBadRequest, "field_id must be positive")
			return
		}

		ctx := context.Background()

		// Проверяем кэш Redis
		cacheKey := "prediction:" + strconv.FormatInt(req.FieldID, 10)
		if cached, err := rdb.Get(ctx, cacheKey).Result(); err == nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(cached))
			return
		}

		result, err := predictSvc.Predict(ctx, service.PredictInput{
			FieldID:   req.FieldID,
			Latitude:  req.Latitude,
			Longitude: req.Longitude,
			UserID:    req.UserID,
		})
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}

		response := map[string]interface{}{
			"prediction": result.Prediction,
			"warning":    result.Warning,
			"status":     result.Status,
		}

		if data, err := json.Marshal(response); err == nil {
			rdb.Set(ctx, cacheKey, data, 30*time.Minute)
		}

		respondJSON(w, http.StatusOK, response)
	}
}

// GetPredictions godoc
// @Summary      История прогнозов
// @Description  Возвращает историю прогнозов для указанного поля
// @Tags         predictions
// @Produce      json
// @Param        field_id  path      int  true   "Field ID"
// @Param        limit     query     int  false  "Количество записей (по умолчанию 20)"
// @Success      200       {array}   models.Prediction
// @Failure      400       {object}  map[string]string
// @Failure      500       {object}  map[string]string
// @Router       /api/v1/predictions/{field_id} [get]
func GetPredictions(db *sql.DB) http.HandlerFunc {
	repo := repository.NewPredictionRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		fieldID, err := strconv.ParseInt(chi.URLParam(r, "field_id"), 10, 64)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid field_id")
			return
		}
		limit := 20
		if l := r.URL.Query().Get("limit"); l != "" {
			if v, err := strconv.Atoi(l); err == nil && v > 0 {
				limit = v
			}
		}
		predictions, err := repo.GetByFieldID(context.Background(), fieldID, limit)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if predictions == nil {
			predictions = []models.Prediction{}
		}
		respondJSON(w, http.StatusOK, predictions)
	}
}
