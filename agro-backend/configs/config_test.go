package configs_test

import (
	"agro-backend/configs"
	"os"
	"testing"
)

func TestLoadConfig_Defaults(t *testing.T) {
	// Сбрасываем env
	os.Unsetenv("PORT")
	os.Unsetenv("DB_HOST")
	os.Unsetenv("REDIS_HOST")

	cfg := configs.LoadConfig()

	if cfg.Server.Port != "8080" {
		t.Errorf("expected port 8080, got %s", cfg.Server.Port)
	}
	if cfg.Database.Host != "localhost" {
		t.Errorf("expected db host localhost, got %s", cfg.Database.Host)
	}
	if cfg.Redis.Host != "localhost" {
		t.Errorf("expected redis host localhost, got %s", cfg.Redis.Host)
	}
}

func TestLoadConfig_FromEnv(t *testing.T) {
	os.Setenv("PORT", "9090")
	os.Setenv("DB_HOST", "mydb")
	os.Setenv("REDIS_HOST", "myredis")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("DB_HOST")
		os.Unsetenv("REDIS_HOST")
	}()

	cfg := configs.LoadConfig()

	if cfg.Server.Port != "9090" {
		t.Errorf("expected port 9090, got %s", cfg.Server.Port)
	}
	if cfg.Database.Host != "mydb" {
		t.Errorf("expected db host mydb, got %s", cfg.Database.Host)
	}
	if cfg.Redis.Host != "myredis" {
		t.Errorf("expected redis host myredis, got %s", cfg.Redis.Host)
	}
}

func TestGetDatabaseDSN_WithDatabaseURL(t *testing.T) {
	os.Setenv("DATABASE_URL", "postgres://user:pass@host:5432/db?sslmode=disable")
	defer os.Unsetenv("DATABASE_URL")

	cfg := configs.LoadConfig()
	dsn := cfg.GetDatabaseDSN()

	if dsn != "postgres://user:pass@host:5432/db?sslmode=disable" {
		t.Errorf("unexpected DSN: %s", dsn)
	}
}

func TestGetRedisAddress(t *testing.T) {
	os.Setenv("REDIS_HOST", "redis")
	os.Setenv("REDIS_PORT", "6379")
	defer func() {
		os.Unsetenv("REDIS_HOST")
		os.Unsetenv("REDIS_PORT")
	}()

	cfg := configs.LoadConfig()
	addr := cfg.GetRedisAddress()

	if addr != "redis:6379" {
		t.Errorf("expected redis:6379, got %s", addr)
	}
}
