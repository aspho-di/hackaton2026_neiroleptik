package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"agro-backend/internal/models"
)

// alertRepository реализация AlertRepository
type alertRepository struct {
	db *sql.DB
}

// NewAlertRepository создаёт новый экземпляр repository
func NewAlertRepository(db *sql.DB) AlertRepository {
	return &alertRepository{db: db}
}

// Create создаёт уведомление
func (r *alertRepository) Create(ctx context.Context, alert *models.Alert) error {
	query := `
		INSERT INTO alerts (user_id, field_id, message, severity, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`
	err := r.db.QueryRowContext(ctx, query,
		alert.UserID,
		alert.FieldID,
		alert.Message,
		alert.Severity,
		false,
		time.Now(),
	).Scan(&alert.ID)

	if err != nil {
		return fmt.Errorf("failed to create alert: %w", err)
	}
	return nil
}

// GetByUserID получает уведомления пользователя
func (r *alertRepository) GetByUserID(ctx context.Context, userID int64, limit int) ([]models.Alert, error) {
	query := `
		SELECT id, user_id, field_id, message, severity, is_read, created_at
		FROM alerts
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`
	rows, err := r.db.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query alerts: %w", err)
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		err := rows.Scan(
			&a.ID,
			&a.UserID,
			&a.FieldID,
			&a.Message,
			&a.Severity,
			&a.IsRead,
			&a.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert: %w", err)
		}
		alerts = append(alerts, a)
	}

	return alerts, nil
}

// GetUnread получает непрочитанные уведомления
func (r *alertRepository) GetUnread(ctx context.Context, userID int64) ([]models.Alert, error) {
	query := `
		SELECT id, user_id, field_id, message, severity, is_read, created_at
		FROM alerts
		WHERE user_id = $1 AND is_read = false
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query unread alerts: %w", err)
	}
	defer rows.Close()

	var alerts []models.Alert
	for rows.Next() {
		var a models.Alert
		err := rows.Scan(
			&a.ID,
			&a.UserID,
			&a.FieldID,
			&a.Message,
			&a.Severity,
			&a.IsRead,
			&a.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan alert: %w", err)
		}
		alerts = append(alerts, a)
	}

	return alerts, nil
}

// MarkAsRead помечает уведомление как прочитанное
func (r *alertRepository) MarkAsRead(ctx context.Context, id int64) error {
	query := `UPDATE alerts SET is_read = true WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to mark alert as read: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("alert not found")
	}

	return nil
}
