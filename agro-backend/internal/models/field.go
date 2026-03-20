package models

import (
	"fmt"
	"time"
)

// Field представляет сельскохозяйственное поле
type Field struct {
	ID           int64     `json:"id"`
	UserID       int64     `json:"user_id"`
	Name         string    `json:"name"`
	AreaHectares float64   `json:"area_hectares"`
	CropType     string    `json:"crop_type"`
	Latitude     float64   `json:"latitude"`
	Longitude    float64   `json:"longitude"`
	CreatedAt    time.Time `json:"created_at"`
}

// CreateFieldRequest запрос на создание поля
type CreateFieldRequest struct {
	UserID       int64   `json:"user_id"`
	Name         string  `json:"name"`
	AreaHectares float64 `json:"area_hectares"`
	CropType     string  `json:"crop_type"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
}

// Validate валидирует данные поля
func (r *CreateFieldRequest) Validate() error {
	if r.Name == "" {
		return fmt.Errorf("field name is required")
	}
	if r.UserID <= 0 {
		return fmt.Errorf("user_id must be positive")
	}
	if r.AreaHectares <= 0 {
		return fmt.Errorf("area_hectares must be positive")
	}
	return nil
}
