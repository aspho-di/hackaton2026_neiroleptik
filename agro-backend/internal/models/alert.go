package models

import "time"

// Alert представляет уведомление для пользователя
type Alert struct {
	ID        int64     `json:"id"`
	UserID    int64     `json:"user_id"`
	FieldID   int64     `json:"field_id"`
	Message   string    `json:"message"`
	Severity  string    `json:"severity"` // low, medium, critical
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateAlertRequest запрос на создание уведомления
type CreateAlertRequest struct {
	UserID   int64  `json:"user_id"`
	FieldID  int64  `json:"field_id"`
	Message  string `json:"message"`
	Severity string `json:"severity"`
}

// Severity уровни важности уведомлений
const (
	SeverityLow      = "low"
	SeverityMedium   = "medium"
	SeverityCritical = "critical"
)
