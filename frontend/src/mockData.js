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

// Мок ответа GET /predict/forecast — структура точно совпадает с реальным API
export const MOCK_FORECAST = {
  field_id: 45,
  yield_ctha: 38.4,
  confidence: "high",
  status: "normal",
  message: null,
  precip_forecast_7days: [2.1, 0, 5.4, 0, 0, 12.3, 1.0],
}

// Мок ответа POST /recommend/irrigation — структура точно совпадает с реальным API
export const MOCK_IRRIGATION = {
  irrigation_needed: true,
  amount_mm: 25,
  next_date: "2024-06-15",
  confidence: "high",
  status: "normal",
  message: null,
}

export const MOCK_FORECAST_ANOMALY = {
  field_id: 7,
  yield_ctha: 18.2,
  confidence: "low",
  status: "anomaly",
  message: "Обнаружена аномалия: критически низкая влажность почвы. Требуется срочный полив.",
  precip_forecast_7days: [0, 0, 0, 0, 0, 0, 0.3],
}

export const MOCK_FORECAST_WARNING = {
  field_id: 12,
  yield_ctha: 29.1,
  confidence: "low",
  status: "normal",
  message: "Прогноз ненадёжен: недостаточно данных датчиков.",
  precip_forecast_7days: [0.5, 0, 1.2, 0, 3.1, 0, 0],
}

export function getMockForecastForField(fieldId) {
  if (fieldId === 7)  return MOCK_FORECAST_ANOMALY
  if (fieldId === 12 || fieldId === 31) return { ...MOCK_FORECAST_WARNING, field_id: fieldId }
  return { ...MOCK_FORECAST, field_id: fieldId }
}
