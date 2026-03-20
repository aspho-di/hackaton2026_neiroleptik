package handlers

import (
	"agro-backend/internal/models"
	"agro-backend/internal/repository"
	"context"
	"database/sql"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// GetAlerts godoc
// @Summary      Список уведомлений
// @Description  Возвращает уведомления пользователя
// @Tags         alerts
// @Produce      json
// @Param        user_id  query     int  false  "User ID (по умолчанию 1)"
// @Param        limit    query     int  false  "Количество записей (по умолчанию 50)"
// @Success      200      {array}   models.Alert
// @Failure      500      {object}  map[string]string
// @Router       /api/v1/alerts [get]
func GetAlerts(db *sql.DB) http.HandlerFunc {
	repo := repository.NewAlertRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := int64(1)
		if u := r.URL.Query().Get("user_id"); u != "" {
			if id, err := strconv.ParseInt(u, 10, 64); err == nil {
				userID = id
			}
		}
		limit := 50
		if l := r.URL.Query().Get("limit"); l != "" {
			if v, err := strconv.Atoi(l); err == nil && v > 0 {
				limit = v
			}
		}
		alerts, err := repo.GetByUserID(context.Background(), userID, limit)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if alerts == nil {
			alerts = []models.Alert{}
		}
		respondJSON(w, http.StatusOK, alerts)
	}
}

// GetUnreadAlerts godoc
// @Summary      Непрочитанные уведомления
// @Description  Возвращает только непрочитанные уведомления пользователя
// @Tags         alerts
// @Produce      json
// @Param        user_id  query     int  false  "User ID (по умолчанию 1)"
// @Success      200      {array}   models.Alert
// @Failure      500      {object}  map[string]string
// @Router       /api/v1/alerts/unread [get]
func GetUnreadAlerts(db *sql.DB) http.HandlerFunc {
	repo := repository.NewAlertRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		userID := int64(1)
		if u := r.URL.Query().Get("user_id"); u != "" {
			if id, err := strconv.ParseInt(u, 10, 64); err == nil {
				userID = id
			}
		}
		alerts, err := repo.GetUnread(context.Background(), userID)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if alerts == nil {
			alerts = []models.Alert{}
		}
		respondJSON(w, http.StatusOK, alerts)
	}
}

// MarkAlertRead godoc
// @Summary      Отметить как прочитанное
// @Description  Помечает уведомление как прочитанное
// @Tags         alerts
// @Produce      json
// @Param        id  path      int  true  "Alert ID"
// @Success      200 {object}  map[string]string
// @Failure      400 {object}  map[string]string
// @Failure      404 {object}  map[string]string
// @Router       /api/v1/alerts/{id}/read [put]
func MarkAlertRead(db *sql.DB) http.HandlerFunc {
	repo := repository.NewAlertRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid id")
			return
		}
		if err := repo.MarkAsRead(context.Background(), id); err != nil {
			respondError(w, http.StatusNotFound, "alert not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}
