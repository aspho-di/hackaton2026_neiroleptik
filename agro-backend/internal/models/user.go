package models

import (
	"fmt"
	"time"
)

// User представляет пользователя системы (фермера/агронома)
type User struct {
	ID        int64     `json:"id"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// CreateUserRequest запрос на создание пользователя
type CreateUserRequest struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

// Validate валидирует данные пользователя
func (r *CreateUserRequest) Validate() error {
	if r.Email == "" {
		return fmt.Errorf("email is required")
	}
	if r.Name == "" {
		return fmt.Errorf("name is required")
	}
	return nil
}
