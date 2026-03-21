package handlers

import (
	"agro-backend/internal/models"
	"agro-backend/internal/repository"
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"
)

// FrontendAlert структура алерта для фронтенда
type FrontendAlert struct {
	ID        string `json:"id"`
	Type      string `json:"type"`
	Severity  string `json:"severity"`
	Title     string `json:"message"`
	Message   string `json:"description"`
	Action    string `json:"action,omitempty"`
	District  string `json:"district,omitempty"`
	CreatedAt string `json:"created_at"`
}

// GetAlertsForFrontend godoc
// @Summary      Уведомления для фронтенда
// @Description  Возвращает уведомления в формате который ожидает фронтенд
// @Tags         alerts
// @Produce      json
// @Success      200  {array}   FrontendAlert
// @Router       /api/alerts [get]
func GetAlertsForFrontend(db *sql.DB) http.HandlerFunc {
	repo := repository.NewAlertRepository(db)
	return func(w http.ResponseWriter, r *http.Request) {
		alerts, err := repo.GetByUserID(context.Background(), 1, 100)
		if err != nil {
			respondError(w, http.StatusInternalServerError, err.Error())
			return
		}

		result := make([]FrontendAlert, 0, len(alerts))
		for _, a := range alerts {
			result = append(result, transformAlert(a))
		}

		respondJSON(w, http.StatusOK, result)
	}
}

// transformAlert конвертирует внутренний Alert в формат для фронтенда
func transformAlert(a models.Alert) FrontendAlert {
	// Определяем тип по содержимому сообщения
	alertType := detectAlertType(a.Message)

	// Конвертируем severity (critical→critical, medium→warning, low→info)
	severity := convertSeverity(a.Severity)

	// Генерируем заголовок по типу и severity
	title := generateTitle(alertType, severity, a.Message)

	// Генерируем рекомендуемое действие
	action := generateAction(alertType, severity, a.FieldID)

	return FrontendAlert{
		ID:        fmt.Sprintf("%s%d", alertType[:1], a.ID),
		Type:      alertType,
		Severity:  severity,
		Title:     title,
		Message:   a.Message,
		Action:    action,
		CreatedAt: a.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func detectAlertType(message string) string {
	msg := strings.ToLower(message)
	switch {
	case strings.Contains(msg, "заморозк") ||
		strings.Contains(msg, "жара") ||
		strings.Contains(msg, "температур") ||
		strings.Contains(msg, "погод"):
		return "weather"
	case strings.Contains(msg, "аномал") ||
		strings.Contains(msg, "датчик") ||
		strings.Contains(msg, "оборудовани"):
		return "anomaly"
	case strings.Contains(msg, "полив") ||
		strings.Contains(msg, "влажност") ||
		strings.Contains(msg, "засух") ||
		strings.Contains(msg, "переувлажнени"):
		return "irrigation"
	default:
		return "irrigation"
	}
}

func convertSeverity(severity string) string {
	switch severity {
	case models.SeverityCritical:
		return "critical"
	case models.SeverityMedium:
		return "warning"
	case models.SeverityLow:
		return "info"
	default:
		return "info"
	}
}

func generateTitle(alertType, severity, message string) string {
	switch alertType {
	case "weather":
		if severity == "critical" {
			return "Критические погодные условия"
		}
		return "Погодное предупреждение"
	case "anomaly":
		return "Аномалия датчиков"
	case "irrigation":
		if strings.Contains(strings.ToLower(message), "засух") {
			return "Критическая засуха"
		}
		if strings.Contains(strings.ToLower(message), "переувлажн") {
			return "Переувлажнение почвы"
		}
		return "Рекомендация по поливу"
	default:
		return "Системное уведомление"
	}
}

func generateAction(alertType, severity string, fieldID int64) string {
	switch alertType {
	case "irrigation":
		if severity == "critical" {
			return fmt.Sprintf("Срочно полейте поле №%d", fieldID)
		}
		return fmt.Sprintf("Запланируйте полив поля №%d", fieldID)
	case "weather":
		if severity == "critical" {
			return "Примите защитные меры для посевов"
		}
		return "Следите за погодными условиями"
	case "anomaly":
		return "Проверьте оборудование датчиков"
	default:
		return ""
	}
}
