package models

import "time"

// Prediction представляет прогноз урожайности и полива
type Prediction struct {
	ID                       int64     `json:"id"`
	FieldID                  int64     `json:"field_id"`
	YieldPrediction          float64   `json:"yield_prediction"`
	IrrigationRecommendation float64   `json:"irrigation_recommendation"`
	Confidence               float64   `json:"confidence"`
	IsAnomaly                bool      `json:"is_anomaly"`
	CreatedAt                time.Time `json:"created_at"`
}

// PredictionResponse ответ с прогнозом
type PredictionResponse struct {
	Prediction *Prediction `json:"prediction"`
	Warning    string      `json:"warning,omitempty"`
	Status     string      `json:"status"`
}
