// Package main Agro Backend API
//
// Сервис предиктивной аналитики для сельского хозяйства.
// Прогнозирование урожайности и рекомендации по поливу на основе данных датчиков и погоды.
//
//	Schemes: http
//	Host: localhost:8080
//	BasePath: /
//	Version: 1.0.0
//
//	Consumes:
//	- application/json
//
//	Produces:
//	- application/json
//
// swagger:meta
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"agro-backend/configs"
	internalapi "agro-backend/internal/api"
	"agro-backend/pkg/database"
	redispkg "agro-backend/pkg/redis"
)

func main() {
	_ = godotenv.Load()
	log.Printf("REDIS_PASSWORD = %q", os.Getenv("REDIS_PASSWORD"))

	cfg := configs.LoadConfig()

	db, err := database.NewPostgres(database.DefaultPostgresConfig(cfg.GetDatabaseDSN()))
	if err != nil {
		log.Fatalf("❌ PostgreSQL connection failed: %v", err)
	}
	defer database.Close(db)

	rdb, err := redispkg.NewRedis(&redispkg.RedisConfig{
		Addr:     cfg.GetRedisAddress(),
		Password: cfg.Redis.Password,
		DB:       0,
		PoolSize: 10,
	})
	if err != nil {
		log.Fatalf("❌ Redis connection failed: %v", err)
	}
	defer redispkg.Close(rdb)

	router := internalapi.NewRouter(db, rdb)

	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		fmt.Printf("🚀 Server starting on :%s\n", cfg.Server.Port)
		fmt.Printf("📖 Swagger UI: http://localhost:%s/swagger/index.html\n", cfg.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("❌ Server error: %v", err)
		}
	}()

	<-quit
	fmt.Println("⏳ Shutting down gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("❌ Forced shutdown: %v", err)
	}
	fmt.Println("✅ Server stopped")
}
