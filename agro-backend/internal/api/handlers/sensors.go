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

	"github.com/go-chi/chi/v5"
	"github.com/go-redis/redis/v8"
)

// SaveSensorData godoc
// @Summary      Сохранить данные датчиков
// @Description  Принимает данные с датчиков поля. При аномалии создаёт алерт и отправляет уведомление в Telegram.
// @Tags         sensors
// @Accept       json
// @Produce      json
// @Param        data  body      models.CreateSensorDataRequest  true  "Данные датчиков"
// @Success      201   {object}  map[string]interface{}
// @Failure      400   {object}  map[string]string
// @Failure      500   {object}  map[string]string
// @Router       /api/v1/sensors/data [post]
func SaveSensorData(db *sql.DB, rdb *redis.Client, alertSvc *service.AlertService) http.HandlerFunc {
	repo := repository.NewSensorRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.CreateSensorDataRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if err := req.Validate(); err != nil {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}

		data := &models.SensorData{
			FieldID:      req.FieldID,
			SoilMoisture: req.SoilMoisture,
			Temperature:  req.Temperature,
			Humidity:     req.Humidity,
		}

		ctx := context.Background()

		if err := repo.Create(ctx, data); err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}

		_ = alertSvc.CheckSensorConditions(ctx, 1, req.FieldID, data)

		cacheKey := "prediction:" + strconv.FormatInt(req.FieldID, 10)
		rdb.Del(ctx, cacheKey)

		respondJSON(w, http.StatusCreated, map[string]interface{}{
			"status":           "ok",
			"id":               data.ID,
			"anomaly_detected": req.IsAnomaly(),
		})
	}
}

// GetSensorData godoc
// @Summary      Данные датчиков поля
// @Description  Возвращает историю данных датчиков для указанного поля
// @Tags         sensors
// @Produce      json
// @Param        field_id  path      int  true   "Field ID"
// @Param        limit     query     int  false  "Количество записей (по умолчанию 50)"
// @Success      200       {array}   models.SensorData
// @Failure      400       {object}  map[string]string
// @Failure      500       {object}  map[string]string
// @Router       /api/v1/sensors/{field_id} [get]
func GetSensorData(db *sql.DB) http.HandlerFunc {
	repo := repository.NewSensorRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		fieldID, err := strconv.ParseInt(chi.URLParam(r, "field_id"), 10, 64)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid field_id")
			return
		}
		limit := 50
		if l := r.URL.Query().Get("limit"); l != "" {
			if v, err := strconv.Atoi(l); err == nil && v > 0 {
				limit = v
			}
		}
		dataList, err := repo.GetByFieldID(context.Background(), fieldID, limit)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if dataList == nil {
			dataList = []models.SensorData{}
		}
		respondJSON(w, http.StatusOK, dataList)
	}
}
