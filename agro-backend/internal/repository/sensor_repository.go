package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"agro-backend/internal/models"
)

// sensorRepository реализация SensorDataRepository
type sensorRepository struct {
	db *sql.DB
}

// NewSensorRepository создаёт новый экземпляр repository
func NewSensorRepository(db *sql.DB) SensorDataRepository {
	return &sensorRepository{db: db}
}

// Create сохраняет данные с датчиков
func (r *sensorRepository) Create(ctx context.Context, data *models.SensorData) error {
	query := `
		INSERT INTO sensor_data (field_id, soil_moisture, temperature, humidity, timestamp)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`
	err := r.db.QueryRowContext(ctx, query,
		data.FieldID,
		data.SoilMoisture,
		data.Temperature,
		data.Humidity,
		time.Now(),
	).Scan(&data.ID)

	if err != nil {
		return fmt.Errorf("failed to save sensor data: %w", err)
	}
	return nil
}

// GetByFieldID получает данные датчиков для поля
func (r *sensorRepository) GetByFieldID(ctx context.Context, fieldID int64, limit int) ([]models.SensorData, error) {
	query := `
		SELECT id, field_id, soil_moisture, temperature, humidity, timestamp
		FROM sensor_data
		WHERE field_id = $1
		ORDER BY timestamp DESC
		LIMIT $2
	`
	rows, err := r.db.QueryContext(ctx, query, fieldID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query sensor data: %w", err)
	}
	defer rows.Close()

	var dataList []models.SensorData
	for rows.Next() {
		var d models.SensorData
		err := rows.Scan(
			&d.ID,
			&d.FieldID,
			&d.SoilMoisture,
			&d.Temperature,
			&d.Humidity,
			&d.Timestamp,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan sensor data: %w", err)
		}
		dataList = append(dataList, d)
	}

	return dataList, nil
}

// GetLatest получает последние данные с датчиков
func (r *sensorRepository) GetLatest(ctx context.Context, fieldID int64) (*models.SensorData, error) {
	query := `
		SELECT id, field_id, soil_moisture, temperature, humidity, timestamp
		FROM sensor_data
		WHERE field_id = $1
		ORDER BY timestamp DESC
		LIMIT 1
	`
	var data models.SensorData
	err := r.db.QueryRowContext(ctx, query, fieldID).Scan(
		&data.ID,
		&data.FieldID,
		&data.SoilMoisture,
		&data.Temperature,
		&data.Humidity,
		&data.Timestamp,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no sensor data found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get sensor data: %w", err)
	}
	return &data, nil
}
