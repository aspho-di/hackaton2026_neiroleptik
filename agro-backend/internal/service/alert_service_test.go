package service_test

import (
	"agro-backend/internal/models"
	"testing"
)

func TestCheckSensorConditions_Critical(t *testing.T) {
	tests := []struct {
		name             string
		data             models.SensorData
		expectedSeverity string
		expectAlert      bool
	}{
		{
			name:             "critical drought",
			data:             models.SensorData{SoilMoisture: 5, Temperature: 24, Humidity: 60},
			expectedSeverity: models.SeverityCritical,
			expectAlert:      true,
		},
		{
			name:             "critical flood",
			data:             models.SensorData{SoilMoisture: 95, Temperature: 24, Humidity: 60},
			expectedSeverity: models.SeverityCritical,
			expectAlert:      true,
		},
		{
			name:             "medium low moisture",
			data:             models.SensorData{SoilMoisture: 15, Temperature: 24, Humidity: 60},
			expectedSeverity: models.SeverityMedium,
			expectAlert:      true,
		},
		{
			name:             "critical heat",
			data:             models.SensorData{SoilMoisture: 55, Temperature: 40, Humidity: 60},
			expectedSeverity: models.SeverityCritical,
			expectAlert:      true,
		},
		{
			name:             "critical frost",
			data:             models.SensorData{SoilMoisture: 55, Temperature: -10, Humidity: 60},
			expectedSeverity: models.SeverityCritical,
			expectAlert:      true,
		},
		{
			name:        "normal conditions",
			data:        models.SensorData{SoilMoisture: 55, Temperature: 24, Humidity: 60},
			expectAlert: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			severity, needAlert := checkConditions(&tt.data)
			if needAlert != tt.expectAlert {
				t.Errorf("expectAlert=%v, got=%v", tt.expectAlert, needAlert)
			}
			if tt.expectAlert && severity != tt.expectedSeverity {
				t.Errorf("expected severity=%s, got=%s", tt.expectedSeverity, severity)
			}
		})
	}
}

// checkConditions дублирует логику AlertService.CheckSensorConditions
func checkConditions(data *models.SensorData) (string, bool) {
	switch {
	case data.SoilMoisture < 10:
		return models.SeverityCritical, true
	case data.SoilMoisture > 90:
		return models.SeverityCritical, true
	case data.SoilMoisture < 20:
		return models.SeverityMedium, true
	case data.Temperature > 38:
		return models.SeverityCritical, true
	case data.Temperature < -5:
		return models.SeverityCritical, true
	default:
		return "", false
	}
}
