package provider

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type openWeatherProvider struct {
	apiKey string
	client *http.Client
}

func NewOpenWeatherProvider(apiKey string) WeatherProvider {
	return &openWeatherProvider{
		apiKey: apiKey,
		client: &http.Client{},
	}
}

type owmCurrentResponse struct {
	Main struct {
		Temp     float64 `json:"temp"`
		Humidity float64 `json:"humidity"`
	} `json:"main"`
	Wind struct {
		Speed float64 `json:"speed"`
	} `json:"wind"`
	Rain struct {
		OneH float64 `json:"1h"`
	} `json:"rain"`
	Weather []struct {
		Description string `json:"description"`
	} `json:"weather"`
}

type owmForecastResponse struct {
	List []struct {
		Main struct {
			Temp     float64 `json:"temp"`
			Humidity float64 `json:"humidity"`
		} `json:"main"`
		Wind struct {
			Speed float64 `json:"speed"`
		} `json:"wind"`
		Rain struct {
			ThreeH float64 `json:"3h"`
		} `json:"rain"`
		Weather []struct {
			Description string `json:"description"`
		} `json:"weather"`
	} `json:"list"`
}

func (p *openWeatherProvider) GetCurrent(lat, lon float64) (*WeatherData, error) {
	url := fmt.Sprintf(
		"https://api.openweathermap.org/data/2.5/weather?lat=%f&lon=%f&appid=%s&units=metric",
		lat, lon, p.apiKey,
	)
	resp, err := p.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("openweather request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openweather API error: status %d", resp.StatusCode)
	}

	var data owmCurrentResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode weather response: %w", err)
	}

	desc := ""
	if len(data.Weather) > 0 {
		desc = data.Weather[0].Description
	}

	return &WeatherData{
		Temperature:   data.Main.Temp,
		Humidity:      data.Main.Humidity,
		Precipitation: data.Rain.OneH,
		WindSpeed:     data.Wind.Speed,
		Description:   desc,
	}, nil
}

func (p *openWeatherProvider) GetForecast(lat, lon float64, days int) ([]WeatherData, error) {
	// OpenWeather даёт прогноз по 3 часа, берём первые days*8 точек
	cnt := days * 8
	url := fmt.Sprintf(
		"https://api.openweathermap.org/data/2.5/forecast?lat=%f&lon=%f&appid=%s&units=metric&cnt=%d",
		lat, lon, p.apiKey, cnt,
	)
	resp, err := p.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("openweather forecast request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openweather API error: status %d", resp.StatusCode)
	}

	var data owmForecastResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode forecast response: %w", err)
	}

	// Агрегируем по дням (каждые 8 точек = 1 день)
	result := make([]WeatherData, 0, days)
	for i := 0; i < len(data.List) && i < days*8; i += 8 {
		item := data.List[i]
		desc := ""
		if len(item.Weather) > 0 {
			desc = item.Weather[0].Description
		}
		result = append(result, WeatherData{
			Temperature:   item.Main.Temp,
			Humidity:      item.Main.Humidity,
			Precipitation: item.Rain.ThreeH,
			WindSpeed:     item.Wind.Speed,
			Description:   desc,
		})
	}
	return result, nil
}
