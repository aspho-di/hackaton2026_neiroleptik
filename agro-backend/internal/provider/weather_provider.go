package provider

// WeatherData данные о погоде
type WeatherData struct {
	Temperature   float64 `json:"temperature"`
	Humidity      float64 `json:"humidity"`
	Precipitation float64 `json:"precipitation"`
	WindSpeed     float64 `json:"wind_speed"`
	Description   string  `json:"description"`
}

// WeatherProvider интерфейс для получения погоды
type WeatherProvider interface {
	GetCurrent(lat, lon float64) (*WeatherData, error)
	GetForecast(lat, lon float64, days int) ([]WeatherData, error)
}

// NewWeatherProvider фабрика — выбирает провайдер по имени
func NewWeatherProvider(name, apiKey string) WeatherProvider {
	switch name {
	case "openweather":
		return NewOpenWeatherProvider(apiKey)
	default:
		return NewMockWeatherProvider()
	}
}
