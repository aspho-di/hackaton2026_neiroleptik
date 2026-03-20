package service

import (
	"agro-backend/internal/models"
	"agro-backend/internal/provider"
	"agro-backend/internal/repository"
	"context"
	"math"
)

type PredictService struct {
	sensorRepo repository.SensorDataRepository
	predRepo   repository.PredictionRepository
	alertRepo  repository.AlertRepository
	weather    *WeatherService
}

func NewPredictService(
	sensorRepo repository.SensorDataRepository,
	predRepo repository.PredictionRepository,
	alertRepo repository.AlertRepository,
	weather *WeatherService,
) *PredictService {
	return &PredictService{
		sensorRepo: sensorRepo,
		predRepo:   predRepo,
		alertRepo:  alertRepo,
		weather:    weather,
	}
}

type PredictInput struct {
	FieldID   int64
	Latitude  float64
	Longitude float64
	UserID    int64
}

type PredictResult struct {
	Prediction *models.Prediction
	Warning    string
	Status     string
}

func (s *PredictService) Predict(ctx context.Context, input PredictInput) (*PredictResult, error) {
	// Берём последние данные датчиков
	sensor, _ := s.sensorRepo.GetLatest(ctx, input.FieldID)

	// Получаем погоду
	var weather *provider.WeatherData
	if input.Latitude != 0 && input.Longitude != 0 {
		weather, _ = s.weather.GetCurrent(input.Latitude, input.Longitude)
	}

	// Проверяем аномалию
	isAnomaly := false
	warning := ""
	if sensor != nil {
		req := &models.CreateSensorDataRequest{
			FieldID:      sensor.FieldID,
			SoilMoisture: sensor.SoilMoisture,
			Temperature:  sensor.Temperature,
			Humidity:     sensor.Humidity,
		}
		isAnomaly = req.IsAnomaly()
		if isAnomaly {
			warning = "Внимание: данные содержат аномалии. Прогноз может быть неточным. Рекомендуется проверить оборудование."
		}
	} else {
		warning = "Нет данных датчиков. Прогноз основан на исторических данных."
	}

	// Вычисляем прогноз
	prediction := s.calculate(sensor, weather, isAnomaly)
	prediction.FieldID = input.FieldID
	prediction.IsAnomaly = isAnomaly

	// Сохраняем
	if err := s.predRepo.Create(ctx, prediction); err != nil {
		return nil, err
	}

	// Создаём алерт при аномалии
	if isAnomaly && input.UserID > 0 {
		alert := &models.Alert{
			UserID:   input.UserID,
			FieldID:  input.FieldID,
			Message:  warning,
			Severity: models.SeverityMedium,
		}
		_ = s.alertRepo.Create(ctx, alert)
	}

	return &PredictResult{
		Prediction: prediction,
		Warning:    warning,
		Status:     "success",
	}, nil
}

func (s *PredictService) calculate(sensor *models.SensorData, weather *provider.WeatherData, isAnomaly bool) *models.Prediction {
	irrigation := 20.0
	yield := 4.0
	confidence := 0.85

	if sensor != nil {
		// Корректируем полив по влажности почвы
		if sensor.SoilMoisture < 20 {
			irrigation += 25
		} else if sensor.SoilMoisture < 40 {
			irrigation += 12
		} else if sensor.SoilMoisture > 75 {
			irrigation -= 10
		}

		// Корректируем по температуре
		if sensor.Temperature > 32 {
			irrigation += 8
		} else if sensor.Temperature > 27 {
			irrigation += 4
		}

		// Корректируем по влажности воздуха
		if sensor.Humidity < 35 {
			irrigation += 5
		}

		// Урожайность по состоянию почвы
		optimal := math.Abs(sensor.SoilMoisture-55) / 55
		yield = 5.5 * (1 - optimal*0.6)
	}

	// Учитываем погоду
	if weather != nil {
		// Если ожидаются осадки — меньше поливаем
		irrigation -= weather.Precipitation * 0.8

		// Жара снижает урожайность
		if weather.Temperature > 35 {
			yield *= 0.85
		}
	}

	// Аномальные данные снижают уверенность
	if isAnomaly {
		confidence = 0.40
		yield *= 0.7
	}

	// Защита от отрицательных значений
	if irrigation < 0 {
		irrigation = 0
	}
	if yield < 0 {
		yield = 0
	}

	return &models.Prediction{
		YieldPrediction:          round2(yield),
		IrrigationRecommendation: round2(irrigation),
		Confidence:               confidence,
	}
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
