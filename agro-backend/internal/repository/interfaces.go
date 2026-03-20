package repository

import (
	"agro-backend/internal/models"
	"context"
)

// UserRepository интерфейс для работы с пользователями
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id int64) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetAll(ctx context.Context) ([]models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id int64) error
}

// FieldRepository интерфейс для работы с полями
type FieldRepository interface {
	Create(ctx context.Context, field *models.Field) error
	GetByID(ctx context.Context, id int64) (*models.Field, error)
	GetByUserID(ctx context.Context, userID int64) ([]models.Field, error)
	GetAll(ctx context.Context) ([]models.Field, error)
	Update(ctx context.Context, field *models.Field) error
	Delete(ctx context.Context, id int64) error
}

// SensorDataRepository интерфейс для работы с данными датчиков
type SensorDataRepository interface {
	Create(ctx context.Context, data *models.SensorData) error
	GetByFieldID(ctx context.Context, fieldID int64, limit int) ([]models.SensorData, error)
	GetLatest(ctx context.Context, fieldID int64) (*models.SensorData, error)
}

// PredictionRepository интерфейс для работы с прогнозами
type PredictionRepository interface {
	Create(ctx context.Context, prediction *models.Prediction) error
	GetByFieldID(ctx context.Context, fieldID int64, limit int) ([]models.Prediction, error)
	GetLatest(ctx context.Context, fieldID int64) (*models.Prediction, error)
}

// AlertRepository интерфейс для работы с уведомлениями
type AlertRepository interface {
	Create(ctx context.Context, alert *models.Alert) error
	GetByUserID(ctx context.Context, userID int64, limit int) ([]models.Alert, error)
	GetUnread(ctx context.Context, userID int64) ([]models.Alert, error)
	MarkAsRead(ctx context.Context, id int64) error
}
