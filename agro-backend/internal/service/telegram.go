package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type TelegramService struct {
	token  string
	chatID string
	client *http.Client
}

func NewTelegramService() *TelegramService {
	return &TelegramService{
		token:  os.Getenv("TELEGRAM_BOT_TOKEN"),
		chatID: os.Getenv("TELEGRAM_CHAT_ID"),
		client: &http.Client{},
	}
}

func (t *TelegramService) Enabled() bool {
	return t.token != "" && t.chatID != ""
}

func (t *TelegramService) Send(message string) error {
	if !t.Enabled() {
		return nil
	}

	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", t.token)

	body, _ := json.Marshal(map[string]string{
		"chat_id":    t.chatID,
		"text":       message,
		"parse_mode": "HTML",
	})

	resp, err := t.client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("telegram send failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("telegram API error: status %d", resp.StatusCode)
	}
	return nil
}

func (t *TelegramService) SendAlert(fieldName, message, severity string) error {
	icon := "ℹ️"
	switch severity {
	case "critical":
		icon = "🚨"
	case "medium":
		icon = "⚠️"
	case "low":
		icon = "📋"
	}

	text := fmt.Sprintf(
		"%s <b>Agro Alert</b>\n\n<b>Поле:</b> %s\n<b>Уровень:</b> %s\n\n%s",
		icon, fieldName, severity, message,
	)
	return t.Send(text)
}
