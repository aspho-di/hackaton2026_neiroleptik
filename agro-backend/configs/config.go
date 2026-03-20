package configs

import (
	"os"
)

// Config хранит все конфигурационные параметры приложения
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
}

// ServerConfig настройки HTTP сервера
type ServerConfig struct {
	Port string
}

// DatabaseConfig настройки подключения к PostgreSQL
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
	DSN      string // Полный connection string
}

// RedisConfig настройки подключения к Redis
type RedisConfig struct {
	Host string
	Port string
}

// LoadConfig загружает конфигурацию из переменных окружения
func LoadConfig() *Config {
	return &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "user"),
			Password: getEnv("DB_PASSWORD", "password"),
			DBName:   getEnv("DB_NAME", "agro"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
			DSN:      getEnv("DATABASE_URL", ""),
		},
		Redis: RedisConfig{
			Host: getEnv("REDIS_HOST", "localhost"),
			Port: getEnv("REDIS_PORT", "6379"),
		},
	}
}

// getEnv получает переменную окружения или возвращает значение по умолчанию
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// GetDatabaseDSN возвращает полный DSN для подключения к БД
func (c *Config) GetDatabaseDSN() string {
	if c.Database.DSN != "" {
		return c.Database.DSN
	}
	return "postgres://" + c.Database.User + ":" + c.Database.Password + "@" +
		c.Database.Host + ":" + c.Database.Port + "/" + c.Database.DBName + "?sslmode=" + c.Database.SSLMode
}

// GetRedisAddress возвращает адрес Redis в формате host:port
func (c *Config) GetRedisAddress() string {
	return c.Redis.Host + ":" + c.Redis.Port
}
