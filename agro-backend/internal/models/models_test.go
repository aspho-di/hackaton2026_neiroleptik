package models_test

import (
	"agro-backend/internal/models"
	"testing"
)

func TestCreateFieldRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     models.CreateFieldRequest
		wantErr bool
	}{
		{
			name: "valid request",
			req: models.CreateFieldRequest{
				UserID:       1,
				Name:         "Поле №1",
				AreaHectares: 10.5,
				CropType:     "wheat",
				Latitude:     47.2,
				Longitude:    39.7,
			},
			wantErr: false,
		},
		{
			name: "empty name",
			req: models.CreateFieldRequest{
				UserID:       1,
				AreaHectares: 10.5,
			},
			wantErr: true,
		},
		{
			name: "zero user_id",
			req: models.CreateFieldRequest{
				UserID:       0,
				Name:         "Поле",
				AreaHectares: 10.5,
			},
			wantErr: true,
		},
		{
			name: "negative area",
			req: models.CreateFieldRequest{
				UserID:       1,
				Name:         "Поле",
				AreaHectares: -1,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestCreateSensorDataRequest_Validate(t *testing.T) {
	tests := []struct {
		name    string
		req     models.CreateSensorDataRequest
		wantErr bool
	}{
		{
			name:    "valid",
			req:     models.CreateSensorDataRequest{FieldID: 1, SoilMoisture: 55, Temperature: 24, Humidity: 60},
			wantErr: false,
		},
		{
			name:    "zero field_id",
			req:     models.CreateSensorDataRequest{FieldID: 0, SoilMoisture: 55, Temperature: 24, Humidity: 60},
			wantErr: true,
		},
		{
			name:    "moisture over 100",
			req:     models.CreateSensorDataRequest{FieldID: 1, SoilMoisture: 101, Temperature: 24, Humidity: 60},
			wantErr: true,
		},
		{
			name:    "temperature too high",
			req:     models.CreateSensorDataRequest{FieldID: 1, SoilMoisture: 55, Temperature: 70, Humidity: 60},
			wantErr: true,
		},
		{
			name:    "negative humidity",
			req:     models.CreateSensorDataRequest{FieldID: 1, SoilMoisture: 55, Temperature: 24, Humidity: -1},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.req.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestCreateSensorDataRequest_IsAnomaly(t *testing.T) {
	tests := []struct {
		name     string
		moisture float64
		want     bool
	}{
		{"normal", 55, false},
		{"low anomaly", 5, true},
		{"high anomaly", 95, true},
		{"border low", 10, false},
		{"border high", 90, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := &models.CreateSensorDataRequest{
				FieldID:      1,
				SoilMoisture: tt.moisture,
				Temperature:  24,
				Humidity:     60,
			}
			if got := req.IsAnomaly(); got != tt.want {
				t.Errorf("IsAnomaly() = %v, want %v (moisture=%.1f)", got, tt.want, tt.moisture)
			}
		})
	}
}
