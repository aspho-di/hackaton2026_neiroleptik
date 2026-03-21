export const MOCK_AGRONOMIST = {
  id: 1,
  name: "Иванова Мария Сергеевна",
  role: "Главный агроном",
  organization: "АО Агрофирма Целина",
  district: "Зерноградский район",
  email: "ivanova.m@agro-celina.ru",
  phone: "+7 (863) 245-12-34",
  avatar: null,
  stats: {
    total_fields: 5,
    active_anomalies: 1,
    completed_recommendations: 14,
  },
}

export const MOCK_FIELDS = [
  { field_id: 45, name: "Участок 45 — Северный",    crop: "пшеница",      status: "normal",  temp: 22, precip: 5  },
  { field_id: 12, name: "Участок 12 — Западный",    crop: "подсолнечник", status: "warning", temp: 32, precip: 1  },
  { field_id: 7,  name: "Участок 7 — Южный",        crop: "кукуруза",     status: "anomaly", temp: 35, precip: 0  },
  { field_id: 23, name: "Участок 23 — Центральный", crop: "ячмень",       status: "normal",  temp: 20, precip: 8  },
  { field_id: 31, name: "Участок 31 — Восточный",   crop: "соя",          status: "warning", temp: 31, precip: 2  },
]

export const HISTORY_DATA = [
  { year: 2016, yield_ctha: 32.1, precip_mm: 210, avg_temp: 24.1, hot_days: 18, water_balance: -45 },
  { year: 2017, yield_ctha: 38.4, precip_mm: 285, avg_temp: 22.8, hot_days: 9,  water_balance: 12  },
  { year: 2018, yield_ctha: 29.7, precip_mm: 178, avg_temp: 26.3, hot_days: 24, water_balance: -82 },
  { year: 2019, yield_ctha: 41.2, precip_mm: 310, avg_temp: 21.9, hot_days: 6,  water_balance: 38  },
  { year: 2020, yield_ctha: 35.8, precip_mm: 241, avg_temp: 23.5, hot_days: 14, water_balance: -18 },
  { year: 2021, yield_ctha: 27.3, precip_mm: 156, avg_temp: 27.8, hot_days: 31, water_balance: -98 },
  { year: 2022, yield_ctha: 43.6, precip_mm: 298, avg_temp: 22.1, hot_days: 8,  water_balance: 24  },
  { year: 2023, yield_ctha: 39.1, precip_mm: 267, avg_temp: 23.2, hot_days: 12, water_balance: -5  },
  { year: 2024, yield_ctha: 44.8, precip_mm: 321, avg_temp: 21.7, hot_days: 5,  water_balance: 41  },
  { year: 2025, yield_ctha: 36.2, precip_mm: 198, avg_temp: 25.4, hot_days: 19, water_balance: -31 },
]

export const MOCK_ALERTS = [
  {
    id: "w1", type: "weather", severity: "critical",
    title: "Прогноз заморозков",
    message: "Ожидается понижение температуры до -3°C в ночь с 15 на 16 апреля. Рекомендуется полив для защиты культур.",
    action: "Полить участки №45, №23 сегодня до 20:00",
    district: "Зерноградский район", created_at: "2024-04-14T18:00:00Z",
  },
  {
    id: "w2", type: "weather", severity: "warning",
    title: "Длительная засуха",
    message: "Осадков не ожидается 14 дней. Водный баланс: -62 мм. Испаряемость превышает поступление влаги.",
    action: "Увеличить норму полива на 30%",
    district: "Зерноградский район", created_at: "2024-06-10T09:00:00Z",
  },
  {
    id: "s1", type: "anomaly", severity: "warning",
    title: "Аномалия датчика",
    message: "Влажность почвы 98% на участке №7 — значение выходит за физически допустимый предел (5–90%).",
    action: "Проверить оборудование на участке №7",
    district: "Зерноградский район", created_at: "2024-06-14T10:30:00Z",
  },
]

// Мок ответа GET /predict/forecast — структура точно совпадает с реальным API
export const MOCK_FORECAST = {
  field_id: 45,
  yield_ctha: 38.4,
  yield_min: 34.1,
  yield_max: 42.7,
  risk_factors: [
    { label: "Дефицит осадков", severity: "warning" },
    { label: "Жаркие дни >30°C", severity: "warning" },
  ],
  confidence: "high",
  status: "normal",
  message: null,
  precip_forecast_7days: [2.1, 0, 5.4, 0, 0, 12.3, 1.0],
  weather_summary: { avg_temp: 22.1, total_precip_mm: 18.0, hot_days: 2, water_balance: -10 },
}

// Мок ответа POST /recommend/irrigation — структура точно совпадает с реальным API
export const MOCK_IRRIGATION = {
  irrigation_needed: true,
  amount_mm: 25,
  next_date: "2024-06-15",
  confidence: "high",
  status: "normal",
  message: null,
  anomalies: [],
}

export const MOCK_FORECAST_ANOMALY = {
  field_id: 7,
  yield_ctha: 18.2,
  yield_min: 10.5,
  yield_max: 25.9,
  risk_factors: [
    { label: "Критическая засуха", severity: "critical" },
    { label: "Аномалия датчика влажности", severity: "critical" },
    { label: "Температура >35°C", severity: "warning" },
  ],
  confidence: "low",
  status: "anomaly",
  message: "Обнаружена аномалия: критически низкая влажность почвы. Требуется срочный полив.",
  precip_forecast_7days: [0, 0, 0, 0, 0, 0, 0.3],
  weather_summary: { avg_temp: 35.1, total_precip_mm: 0.3, hot_days: 7, water_balance: -82 },
}

export const MOCK_FORECAST_WARNING = {
  field_id: 12,
  yield_ctha: 29.1,
  yield_min: 23.4,
  yield_max: 34.8,
  risk_factors: [
    { label: "Высокая температура воздуха", severity: "warning" },
    { label: "Недостаточно осадков", severity: "warning" },
  ],
  confidence: "low",
  status: "normal",
  message: "Прогноз ненадёжен: недостаточно данных датчиков.",
  precip_forecast_7days: [0.5, 0, 1.2, 0, 3.1, 0, 0],
  weather_summary: { avg_temp: 31.8, total_precip_mm: 4.8, hot_days: 5, water_balance: -62 },
}

export function getMockForecastForField(fieldId) {
  if (fieldId === 7)  return MOCK_FORECAST_ANOMALY
  if (fieldId === 12) return { ...MOCK_FORECAST_WARNING, field_id: 12 }
  if (fieldId === 31) return {
    ...MOCK_FORECAST_WARNING,
    field_id: 31,
    weather_summary: { avg_temp: 31.0, total_precip_mm: 5.5, hot_days: 5, water_balance: -52 },
  }
  return { ...MOCK_FORECAST, field_id: fieldId }
}
