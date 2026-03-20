package service

import (
	"agro-backend/internal/models"
	"agro-backend/internal/repository"
	"context"
	"fmt"
	"log"
)

type AlertService struct {
	repo     repository.AlertRepository
	telegram *TelegramService
}

func NewAlertService(repo repository.AlertRepository, telegram *TelegramService) *AlertService {
	return &AlertService{repo: repo, telegram: telegram}
}

func (s *AlertService) Create(ctx context.Context, userID, fieldID int64, message, severity string) error {
	alert := &models.Alert{
		UserID:   userID,
		FieldID:  fieldID,
		Message:  message,
		Severity: severity,
	}
	if err := s.repo.Create(ctx, alert); err != nil {
		return err
	}

	// Отправляем в Telegram критические и средние алерты
	if severity == models.SeverityCritical || severity == models.SeverityMedium {
		fieldName := fmt.Sprintf("ID:%d", fieldID)
		if err := s.telegram.SendAlert(fieldName, message, severity); err != nil {
			// Не фейлим запрос если Telegram недоступен — просто логируем
			log.Printf("⚠️ Telegram send failed: %v", err)
		}
	}

	return nil
}

func (s *AlertService) GetForUser(ctx context.Context, userID int64, limit int) ([]models.Alert, error) {
	return s.repo.GetByUserID(ctx, userID, limit)
}

func (s *AlertService) GetUnread(ctx context.Context, userID int64) ([]models.Alert, error) {
	return s.repo.GetUnread(ctx, userID)
}

func (s *AlertService) MarkRead(ctx context.Context, id int64) error {
	return s.repo.MarkAsRead(ctx, id)
}

// CheckSensorConditions проверяет критические условия и создаёт алерты автоматически
func (s *AlertService) CheckSensorConditions(ctx context.Context, userID, fieldID int64, data *models.SensorData) error {
	var message string
	var severity string

	switch {
	case data.SoilMoisture < 10:
		message = fmt.Sprintf("Критическая засуха! Влажность почвы %.1f%% — срочно требуется полив.", data.SoilMoisture)
		severity = models.SeverityCritical
	case data.SoilMoisture > 90:
		message = fmt.Sprintf("Переувлажнение почвы! Влажность %.1f%% — риск гниения корней.", data.SoilMoisture)
		severity = models.SeverityCritical
	case data.SoilMoisture < 20:
		message = fmt.Sprintf("Низкая влажность почвы %.1f%% — рекомендуется полив.", data.SoilMoisture)
		severity = models.SeverityMedium
	case data.Temperature > 38:
		message = fmt.Sprintf("Экстремальная жара: %.1f°C — риск теплового стресса растений.", data.Temperature)
		severity = models.SeverityCritical
	case data.Temperature < -5:
		message = fmt.Sprintf("Заморозки: %.1f°C — риск повреждения посевов.", data.Temperature)
		severity = models.SeverityCritical
	default:
		return nil
	}

	return s.Create(ctx, userID, fieldID, message, severity)
}
