package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"agro-backend/internal/models"
)

// predictionRepository реализация PredictionRepository
type predictionRepository struct {
	db *sql.DB
}

// NewPredictionRepository создаёт новый экземпляр repository
func NewPredictionRepository(db *sql.DB) PredictionRepository {
	return &predictionRepository{db: db}
}

// Create сохраняет прогноз
func (r *predictionRepository) Create(ctx context.Context, prediction *models.Prediction) error {
	query := `
		INSERT INTO predictions (field_id, yield_prediction, irrigation_recommendation, confidence, is_anomaly, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`
	err := r.db.QueryRowContext(ctx, query,
		prediction.FieldID,
		prediction.YieldPrediction,
		prediction.IrrigationRecommendation,
		prediction.Confidence,
		prediction.IsAnomaly,
		time.Now(),
	).Scan(&prediction.ID)

	if err != nil {
		return fmt.Errorf("failed to save prediction: %w", err)
	}
	return nil
}

// GetByFieldID получает прогнозы для поля
func (r *predictionRepository) GetByFieldID(ctx context.Context, fieldID int64, limit int) ([]models.Prediction, error) {
	query := `
		SELECT id, field_id, yield_prediction, irrigation_recommendation, confidence, is_anomaly, created_at
		FROM predictions
		WHERE field_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.db.QueryContext(ctx, query, fieldID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query predictions: %w", err)
	}
	defer rows.Close()

	var predictions []models.Prediction
	for rows.Next() {
		var p models.Prediction
		err := rows.Scan(
			&p.ID,
			&p.FieldID,
			&p.YieldPrediction,
			&p.IrrigationRecommendation,
			&p.Confidence,
			&p.IsAnomaly,
			&p.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan prediction: %w", err)
		}
		predictions = append(predictions, p)
	}

	return predictions, nil
}

// GetLatest получает последний прогноз
func (r *predictionRepository) GetLatest(ctx context.Context, fieldID int64) (*models.Prediction, error) {
	query := `
		SELECT id, field_id, yield_prediction, irrigation_recommendation, confidence, is_anomaly, created_at
		FROM predictions
		WHERE field_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`
	var prediction models.Prediction
	err := r.db.QueryRowContext(ctx, query, fieldID).Scan(
		&prediction.ID,
		&prediction.FieldID,
		&prediction.YieldPrediction,
		&prediction.IrrigationRecommendation,
		&prediction.Confidence,
		&prediction.IsAnomaly,
		&prediction.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no prediction found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get prediction: %w", err)
	}
	return &prediction, nil
}
