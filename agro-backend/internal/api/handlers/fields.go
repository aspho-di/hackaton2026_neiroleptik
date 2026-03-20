package handlers

import (
	"agro-backend/internal/models"
	"agro-backend/internal/repository"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

// GetFields godoc
// @Summary      Список полей
// @Description  Возвращает все поля
// @Tags         fields
// @Produce      json
// @Success      200  {array}   models.Field
// @Failure      500  {object}  map[string]string
// @Router       /api/v1/fields [get]
func GetFields(db *sql.DB) http.HandlerFunc {
	repo := repository.NewFieldRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		fields, err := repo.GetAll(context.Background())
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if fields == nil {
			fields = []models.Field{}
		}
		respondJSON(w, http.StatusOK, fields)
	}
}

// GetField godoc
// @Summary      Получить поле
// @Description  Возвращает поле по ID
// @Tags         fields
// @Produce      json
// @Param        id   path      int  true  "Field ID"
// @Success      200  {object}  models.Field
// @Failure      400  {object}  map[string]string
// @Failure      404  {object}  map[string]string
// @Router       /api/v1/fields/{id} [get]
func GetField(db *sql.DB) http.HandlerFunc {
	repo := repository.NewFieldRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid id")
			return
		}
		field, err := repo.GetByID(context.Background(), id)
		if err != nil {
			respondError(w, http.StatusNotFound, "field not found")
			return
		}
		respondJSON(w, http.StatusOK, field)
	}
}

// CreateField godoc
// @Summary      Создать поле
// @Description  Создаёт новое сельскохозяйственное поле
// @Tags         fields
// @Accept       json
// @Produce      json
// @Param        field  body      models.CreateFieldRequest  true  "Данные поля"
// @Success      201    {object}  models.Field
// @Failure      400    {object}  map[string]string
// @Failure      500    {object}  map[string]string
// @Router       /api/v1/fields [post]
func CreateField(db *sql.DB) http.HandlerFunc {
	repo := repository.NewFieldRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.CreateFieldRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		if err := req.Validate(); err != nil {
			respondError(w, http.StatusBadRequest, err.Error())
			return
		}
		field := &models.Field{
			UserID:       req.UserID,
			Name:         req.Name,
			AreaHectares: req.AreaHectares,
			CropType:     req.CropType,
			Latitude:     req.Latitude,
			Longitude:    req.Longitude,
		}
		if err := repo.Create(context.Background(), field); err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusCreated, field)
	}
}

// UpdateField godoc
// @Summary      Обновить поле
// @Description  Обновляет данные поля по ID
// @Tags         fields
// @Accept       json
// @Produce      json
// @Param        id     path      int           true  "Field ID"
// @Param        field  body      models.Field  true  "Данные поля"
// @Success      200    {object}  models.Field
// @Failure      400    {object}  map[string]string
// @Failure      500    {object}  map[string]string
// @Router       /api/v1/fields/{id} [put]
func UpdateField(db *sql.DB) http.HandlerFunc {
	repo := repository.NewFieldRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid id")
			return
		}
		var field models.Field
		if err := json.NewDecoder(r.Body).Decode(&field); err != nil {
			respondError(w, http.StatusBadRequest, "invalid request body")
			return
		}
		field.ID = id
		if err := repo.Update(context.Background(), &field); err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		respondJSON(w, http.StatusOK, field)
	}
}

// DeleteField godoc
// @Summary      Удалить поле
// @Description  Удаляет поле по ID
// @Tags         fields
// @Produce      json
// @Param        id  path      int  true  "Field ID"
// @Success      200 {object}  map[string]string
// @Failure      400 {object}  map[string]string
// @Failure      404 {object}  map[string]string
// @Router       /api/v1/fields/{id} [delete]
func DeleteField(db *sql.DB) http.HandlerFunc {
	repo := repository.NewFieldRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
		if err != nil {
			respondError(w, http.StatusBadRequest, "invalid id")
			return
		}
		if err := repo.Delete(context.Background(), id); err != nil {
			respondError(w, http.StatusNotFound, "field not found")
			return
		}
		respondJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	}
}
