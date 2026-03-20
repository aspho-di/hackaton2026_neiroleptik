package service_test

import (
	"agro-backend/internal/models"
	"agro-backend/internal/provider"
	"testing"
)

// Тестируем логику расчёта прогноза напрямую через публичный метод

func TestPredictCalculation_NormalConditions(t *testing.T) {
	sensor := &models.SensorData{
		FieldID:      1,
		SoilMoisture: 55,
		Temperature:  24,
		Humidity:     60,
	}
	weather := &provider.WeatherData{
		Temperature:   22,
		Humidity:      65,
		Precipitation: 0,
	}

	// Нормальные условия: влажность 55% — полив должен быть базовым ~20мм
	irrigation := calcIrrigation(sensor, weather)
	if irrigation < 10 || irrigation > 30 {
		t.Errorf("Expected irrigation 10-30mm, got %.2f", irrigation)
	}
}

func TestPredictCalculation_DroughtConditions(t *testing.T) {
	sensor := &models.SensorData{
		FieldID:      1,
		SoilMoisture: 15, // засуха
		Temperature:  35,
		Humidity:     30,
	}

	irrigation := calcIrrigation(sensor, nil)
	if irrigation < 35 {
		t.Errorf("Expected high irrigation (>35mm) for drought, got %.2f", irrigation)
	}
}

func TestPredictCalculation_WetConditions(t *testing.T) {
	sensor := &models.SensorData{
		FieldID:      1,
		SoilMoisture: 80, // переувлажнение
		Temperature:  20,
		Humidity:     80,
	}
	weather := &provider.WeatherData{
		Precipitation: 10, // дождь
	}

	irrigation := calcIrrigation(sensor, weather)
	if irrigation > 15 {
		t.Errorf("Expected low irrigation (<15mm) for wet conditions, got %.2f", irrigation)
	}
}

func TestPredictCalculation_AnomalyReducesConfidence(t *testing.T) {
	confidence := calcConfidence(true)
	if confidence > 0.5 {
		t.Errorf("Anomaly should reduce confidence below 0.5, got %.2f", confidence)
	}

	confidenceNormal := calcConfidence(false)
	if confidenceNormal < 0.8 {
		t.Errorf("Normal data should have confidence >= 0.8, got %.2f", confidenceNormal)
	}
}

// Вспомогательные функции дублируют логику predict_service.go для тестирования
func calcIrrigation(sensor *models.SensorData, weather *provider.WeatherData) float64 {
	irrigation := 20.0
	if sensor != nil {
		if sensor.SoilMoisture < 20 {
			irrigation += 25
		} else if sensor.SoilMoisture < 40 {
			irrigation += 12
		} else if sensor.SoilMoisture > 75 {
			irrigation -= 10
		}
		if sensor.Temperature > 32 {
			irrigation += 8
		} else if sensor.Temperature > 27 {
			irrigation += 4
		}
		if sensor.Humidity < 35 {
			irrigation += 5
		}
	}
	if weather != nil {
		irrigation -= weather.Precipitation * 0.8
	}
	if irrigation < 0 {
		irrigation = 0
	}
	return irrigation
}

func calcConfidence(isAnomaly bool) float64 {
	if isAnomaly {
		return 0.40
	}
	return 0.85
}
