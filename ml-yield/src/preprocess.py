import pandas as pd
import numpy as np

def aggregate_season(df: pd.DataFrame) -> pd.DataFrame:
    """
    Агрегирует дневные данные в сезонные фичи по годам.
    Сезон = май-август (вегетационный период для Ростовской области).
    Возвращает одну строку на год.
    """
    df = df.copy()
    df["date"] = pd.to_datetime(df["date"])
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month

    # Берём только вегетационный период
    season = df[df["month"].between(5, 8)]

    agg = season.groupby("year").agg(
        temp_mean=("temperature_2m_mean", "mean"),
        temp_max=("temperature_2m_max", "max"),
        temp_min=("temperature_2m_min", "min"),
        precip_total=("precipitation_sum", "sum"),
        precip_days=("precipitation_sum", lambda x: (x > 1).sum()),  # дней с осадками > 1мм
        wind_max=("windspeed_10m_max", "max"),
        evapotranspiration=("et0_fao_evapotranspiration", "sum"),
        hot_days=("temperature_2m_max", lambda x: (x > 35).sum()),  # жарких дней
        dry_days=("precipitation_sum", lambda x: (x == 0).sum()),   # сухих дней
    ).reset_index()

    # Водный баланс = осадки - испаряемость
    agg["water_balance"] = agg["precip_total"] - agg["evapotranspiration"]

    return agg


def add_yield_data(weather_agg: pd.DataFrame, yield_csv: str = None) -> pd.DataFrame:
    """
    Подклеивает данные по урожайности к погодным фичам.
    Если yield_csv не передан — генерируем синтетические данные для демо.
    """
    if yield_csv:
        yield_df = pd.read_csv(yield_csv)
        df = weather_agg.merge(yield_df, on="year", how="inner")
    else:
        # Синтетические данные урожайности пшеницы (ц/га)
        # Логика: базовая урожайность + зависимость от осадков и жары
        print("⚠️  Реальных данных урожайности нет — генерируем синтетику для демо")
        df = weather_agg.copy()
        np.random.seed(42)
        base_yield = 35
        df["yield_centner_per_ha"] = (
            base_yield
            + df["precip_total"] * 0.05
            - df["hot_days"] * 0.8
            + df["water_balance"] * 0.03
            + np.random.normal(0, 2, len(df))
        ).clip(10, 65)

    return df


def prepare_features(df: pd.DataFrame):
    """
    Разбивает датафрейм на X (фичи) и y (таргет).
    """
    feature_cols = [
        "temp_mean", "temp_max", "temp_min",
        "precip_total", "precip_days",
        "wind_max", "evapotranspiration",
        "hot_days", "dry_days", "water_balance"
    ]
    X = df[feature_cols]
    y = df["yield_centner_per_ha"]
    return X, y


    if __name__ == "__main__":
        df_raw = pd.read_csv("../data/raw/weather_historical.csv")
        df_agg = aggregate_season(df_raw)
        df_full = add_yield_data(df_agg, yield_csv="../data/raw/yield_rostov.csv")
        df_full.to_csv("../data/processed/dataset.csv", index=False)
        print(f"Датасет готов: {len(df_full)} строк")
        print(df_full.head())
