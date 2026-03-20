package provider

import "math/rand"

type mockWeatherProvider struct{}

func NewMockWeatherProvider() WeatherProvider {
	return &mockWeatherProvider{}
}

func (p *mockWeatherProvider) GetCurrent(lat, lon float64) (*WeatherData, error) {
	return &WeatherData{
		Temperature:   20.0 + rand.Float64()*10,
		Humidity:      55.0 + rand.Float64()*20,
		Precipitation: rand.Float64() * 5,
		WindSpeed:     rand.Float64() * 15,
		Description:   "partly cloudy",
	}, nil
}

func (p *mockWeatherProvider) GetForecast(lat, lon float64, days int) ([]WeatherData, error) {
	forecast := make([]WeatherData, days)
	for i := range forecast {
		forecast[i] = WeatherData{
			Temperature:   18.0 + rand.Float64()*12,
			Humidity:      50.0 + rand.Float64()*30,
			Precipitation: rand.Float64() * 8,
			WindSpeed:     rand.Float64() * 20,
			Description:   "variable",
		}
	}
	return forecast, nil
}
