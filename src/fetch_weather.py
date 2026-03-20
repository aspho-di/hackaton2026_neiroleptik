import requests
import pandas as pd
from datetime import datetime, timedelta

# Координаты Ростова-на-Дону
LATITUDE = 47.2357
LONGITUDE = 39.7015

def fetch_historical_weather(start_date: str, end_date: str) -> pd.DataFrame:
    """
    Качает исторические данные по дням с Open-Meteo.
    start_date, end_date — строки формата 'YYYY-MM-DD'
    """
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
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


def fetch_forecast_weather(days: int = 7) -> pd.DataFrame:
    """
    Качает прогноз погоды на N дней вперёд.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
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