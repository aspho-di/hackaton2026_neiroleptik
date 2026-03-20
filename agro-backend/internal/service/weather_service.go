package service

import (
	"agro-backend/internal/provider"
	"fmt"
)

type WeatherService struct {
	provider provider.WeatherProvider
}

func NewWeatherService(p provider.WeatherProvider) *WeatherService {
	return &WeatherService{provider: p}
}

func (s *WeatherService) GetCurrent(lat, lon float64) (*provider.WeatherData, error) {
	data, err := s.provider.GetCurrent(lat, lon)
	if err != nil {
		return nil, fmt.Errorf("weather service: %w", err)
	}
	return data, nil
}

func (s *WeatherService) GetForecast(lat, lon float64, days int) ([]provider.WeatherData, error) {
	if days <= 0 || days > 7 {
		days = 5
	}
	data, err := s.provider.GetForecast(lat, lon, days)
	if err != nil {
		return nil, fmt.Errorf("weather service forecast: %w", err)
	}
	return data, nil
}
