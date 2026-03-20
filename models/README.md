# ML Model — Прогноз урожайности

## Порядок запуска

```bash
pip install -r requirements.txt

cd src

# 1. Качаем данные
python fetch_weather.py

# 2. Готовим датасет
python preprocess.py

# 3. Обучаем модель
python train.py

# 4. Тестируем прогноз
python predict.py
```

## Что отдаёт predict.py бэкендеру

```json
{
  "yield_prediction_centner_per_ha": 42.5,
  "confidence": "high",
  "weather_summary": {
    "avg_temp": 27.3,
    "total_precip_mm": 18.0,
    "hot_days": 2
  },
  "precip_forecast_7days": [...]
}
```

## Важно для бэкендера

Подключать через `predict.py`:
- `predict_from_forecast()` — автоматически с Open-Meteo
- `predict_from_manual_input(weather_data)` — вручную от фронта, включает валидацию аномалий
