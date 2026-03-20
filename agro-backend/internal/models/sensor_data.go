package models

import (
	"fmt"
	"time"
)

// SensorData представляет данные с датчиков поля
type SensorData struct {
	ID           int64     `json:"id"`
	FieldID      int64     `json:"field_id"`
	SoilMoisture float64   `json:"soil_moisture"`
	Temperature  float64   `json:"temperature"`
	Humidity     float64   `json:"humidity"`
	Timestamp    time.Time `json:"timestamp"`
}

// CreateSensorDataRequest запрос на сохранение данных датчиков
type CreateSensorDataRequest struct {
	FieldID      int64   `json:"field_id"`
	SoilMoisture float64 `json:"soil_moisture"`
	Temperature  float64 `json:"temperature"`
	Humidity     float64 `json:"humidity"`
}

// Validate валидирует данные датчиков
func (r *CreateSensorDataRequest) Validate() error {
	if r.FieldID <= 0 {
		return fmt.Errorf("field_id must be positive")
	}
	if r.SoilMoisture < 0 || r.SoilMoisture > 100 {
		return fmt.Errorf("soil_moisture must be between 0 and 100")
	}
	if r.Temperature < -50 || r.Temperature > 60 {
		return fmt.Errorf("temperature must be between -50 and 60")
	}
	if r.Humidity < 0 || r.Humidity > 100 {
		return fmt.Errorf("humidity must be between 0 and 100")
	}
	return nil
}

// IsAnomaly проверяет данные на аномалии
func (r *CreateSensorDataRequest) IsAnomaly() bool {
	// Аномалия если влажность > 90% или < 10%
	if r.SoilMoisture > 90 || r.SoilMoisture < 10 {
		return true
	}
	return false
}
