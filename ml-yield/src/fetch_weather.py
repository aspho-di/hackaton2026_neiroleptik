import requests
import pandas as pd
from datetime import datetime, timedelta

# Координаты районов Ростовской области
DISTRICTS = {
    "rostov":        {"lat": 47.2357, "lon": 39.7015, "name": "Ростов-на-Дону"},
    "taganrog":      {"lat": 47.2090, "lon": 38.9360, "name": "Таганрог"},
    "shakhty":       {"lat": 47.7086, "lon": 40.2150, "name": "Шахты"},
    "novocherkassk": {"lat": 47.4226, "lon": 40.0966, "name": "Новочеркасск"},
    "salsk":         {"lat": 46.4800, "lon": 41.5400, "name": "Сальск"},
    "millerovo":     {"lat": 48.9167, "lon": 40.3833, "name": "Миллерово"},
    "morozovsk":     {"lat": 48.3500, "lon": 41.8333, "name": "Морозовск"},
    "volgodonsk":    {"lat": 47.5167, "lon": 42.1500, "name": "Волгодонск"},
    "azov":          {"lat": 47.1000, "lon": 39.4167, "name": "Азов"},
    "aksay":         {"lat": 47.2667, "lon": 39.8667, "name": "Аксай"},
}

DEFAULT_DISTRICT = "rostov"


def get_coords(district: str = DEFAULT_DISTRICT):
    """Возвращает (lat, lon) для района. Если не найден — Ростов."""
    d = DISTRICTS.get(district.lower(), DISTRICTS[DEFAULT_DISTRICT])
    return d["lat"], d["lon"]

def fetch_historical_weather(start_date: str, end_date: str, district: str = DEFAULT_DISTRICT) -> pd.DataFrame:
    """
    Качает исторические данные по дням с Open-Meteo.
    start_date, end_date — строки формата 'YYYY-MM-DD'
    district — ключ из DISTRICTS (например 'salsk', 'taganrog')
    """
    lat, lon = get_coords(district)
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "temperature_2m_mean",
            "precipitation_sum",
            "windspeed_10m_max",
            "et0_fao_evapotranspiration",  # испаряемость — важно для полива
        ],
        "timezone": "Europe/Moscow"
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    df = pd.DataFrame(data["daily"])
    df["date"] = pd.to_datetime(df["time"])
    df = df.drop(columns=["time"])
    return df


def fetch_forecast_weather(days: int = 7, district: str = DEFAULT_DISTRICT) -> pd.DataFrame:
    """
    Качает прогноз погоды на N дней вперёд.
    district — ключ из DISTRICTS
    """
    lat, lon = get_coords(district)
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "temperature_2m_mean",
            "precipitation_sum",
            "windspeed_10m_max",
            "et0_fao_evapotranspiration",
        ],
        "forecast_days": days,
        "timezone": "Europe/Moscow"
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    df = pd.DataFrame(data["daily"])
    df["date"] = pd.to_datetime(df["time"])
    df = df.drop(columns=["time"])
    return df


if __name__ == "__main__":
    # Тест — качаем данные за последние 3 года
    end = datetime.today().strftime("%Y-%m-%d")
    start = (datetime.today() - timedelta(days=365 * 10)).strftime("%Y-%m-%d")

    print(f"Качаем исторические данные с {start} по {end}...")
    df_hist = fetch_historical_weather(start, end)
    df_hist.to_csv("../data/raw/weather_historical.csv", index=False)
    print(f"Сохранено {len(df_hist)} строк → data/raw/weather_historical.csv")

    print("Качаем прогноз на 7 дней...")
    df_forecast = fetch_forecast_weather(7)
    df_forecast.to_csv("../data/raw/weather_forecast.csv", index=False)
    print(f"Сохранено {len(df_forecast)} строк → data/raw/weather_forecast.csv")