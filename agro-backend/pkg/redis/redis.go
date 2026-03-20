package redis

import (
	"context"
	"fmt"

	"github.com/go-redis/redis/v8"
)

// RedisConfig конфигурация подключения к Redis
type RedisConfig struct {
	Addr     string
	Password string
	DB       int
	PoolSize int
}

// DefaultRedisConfig возвращает конфигурацию по умолчанию
func DefaultRedisConfig(addr string) *RedisConfig {
	return &RedisConfig{
		Addr:     addr,
		Password: "",
		DB:       0,
		PoolSize: 10,
	}
}

// NewRedis создаёт новое подключение к Redis
func NewRedis(cfg *RedisConfig) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr,
		Password: cfg.Password,
		DB:       cfg.DB,
		PoolSize: cfg.PoolSize,
	})

	// Проверяем подключение
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping Redis: %w", err)
	}

	fmt.Println("✅ Redis connected successfully")
	return client, nil
}

// Close закрывает подключение к Redis
func Close(client *redis.Client) error {
	if client != nil {
		return client.Close()
	}
	return nil
}
