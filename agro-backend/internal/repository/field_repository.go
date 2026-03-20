package repository

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"agro-backend/internal/models"
)

// fieldRepository реализация FieldRepository
type fieldRepository struct {
	db *sql.DB
}

// NewFieldRepository создаёт новый экземпляр repository
func NewFieldRepository(db *sql.DB) FieldRepository {
	return &fieldRepository{db: db}
}

// Create создаёт новое поле
func (r *fieldRepository) Create(ctx context.Context, field *models.Field) error {
	query := `
		INSERT INTO fields (user_id, name, area_hectares, crop_type, latitude, longitude, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`
	err := r.db.QueryRowContext(ctx, query,
		field.UserID,
		field.Name,
		field.AreaHectares,
		field.CropType,
		field.Latitude,
		field.Longitude,
		time.Now(),
	).Scan(&field.ID)

	if err != nil {
		return fmt.Errorf("failed to create field: %w", err)
	}
	return nil
}

// GetByID получает поле по ID
func (r *fieldRepository) GetByID(ctx context.Context, id int64) (*models.Field, error) {
	query := `
		SELECT id, user_id, name, area_hectares, crop_type, latitude, longitude, created_at
		FROM fields
		WHERE id = $1
	`
	var field models.Field
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&field.ID,
		&field.UserID,
		&field.Name,
		&field.AreaHectares,
		&field.CropType,
		&field.Latitude,
		&field.Longitude,
		&field.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("field not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get field: %w", err)
	}
	return &field, nil
}

// GetByUserID получает все поля пользователя
func (r *fieldRepository) GetByUserID(ctx context.Context, userID int64) ([]models.Field, error) {
	query := `
		SELECT id, user_id, name, area_hectares, crop_type, latitude, longitude, created_at
		FROM fields
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to query fields: %w", err)
	}
	defer rows.Close()

	var fields []models.Field
	for rows.Next() {
		var f models.Field
		err := rows.Scan(
			&f.ID,
			&f.UserID,
			&f.Name,
			&f.AreaHectares,
			&f.CropType,
			&f.Latitude,
			&f.Longitude,
			&f.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan field: %w", err)
		}
		fields = append(fields, f)
	}

	return fields, nil
}

// GetAll получает все поля
func (r *fieldRepository) GetAll(ctx context.Context) ([]models.Field, error) {
	query := `
		SELECT id, user_id, name, area_hectares, crop_type, latitude, longitude, created_at
		FROM fields
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query fields: %w", err)
	}
	defer rows.Close()

	var fields []models.Field
	for rows.Next() {
		var f models.Field
		err := rows.Scan(
			&f.ID,
			&f.UserID,
			&f.Name,
			&f.AreaHectares,
			&f.CropType,
			&f.Latitude,
			&f.Longitude,
			&f.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan field: %w", err)
		}
		fields = append(fields, f)
	}

	return fields, nil
}

// Update обновляет поле
func (r *fieldRepository) Update(ctx context.Context, field *models.Field) error {
	query := `
		UPDATE fields
		SET name = $1, area_hectares = $2, crop_type = $3, latitude = $4, longitude = $5
		WHERE id = $6
	`
	result, err := r.db.ExecContext(ctx, query,
		field.Name,
		field.AreaHectares,
		field.CropType,
		field.Latitude,
		field.Longitude,
		field.ID,
	)
	if err != nil {
		return fmt.Errorf("failed to update field: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("field not found")
	}

	return nil
}

// Delete удаляет поле
func (r *fieldRepository) Delete(ctx context.Context, id int64) error {
	query := `DELETE FROM fields WHERE id = $1`
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete field: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("field not found")
	}

	return nil
}
