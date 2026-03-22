const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function getUserId() {
  try { return JSON.parse(localStorage.getItem('agronomist'))?.id ?? 1 } catch { return 1 }
}

// ── Поля ──────────────────────────────────────────────────────────────────────
export async function fetchFields() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/fields`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return null
  }
}

export async function createField(data) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

export async function updateField(id, data) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/fields/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

export async function deleteField(id) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/fields/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

// ── Прогноз урожайности (ML-сервис) ──────────────────────────────────────────
// Вызывает реальную ML-модель через Go-прокси /api/v1/predict/forecast
// Ответ ML: { yield_actual: 0|1, yield_label, confidence_proba, precip_forecast_7days: [{date,precipitation_sum},...] }
export async function fetchForecast(field_id, latitude, longitude) {
  try {
    const district = 'rostov'
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 8000)
    const res = await fetch(`${BASE_URL}/api/v1/predict/forecast?district=${district}`, { signal: ctrl.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()

    // yield_actual может быть 0 (не null!) — используем явную проверку
    const yieldActual = (data.yield_actual === 0 || data.yield_actual === 1)
      ? data.yield_actual
      : null

    const yieldLabel    = data.yield_label ?? null
    const confidenceRaw = typeof data.confidence_proba === 'number' ? data.confidence_proba : 0.5

    // Нормализуем precip_forecast_7days: ML возвращает [{date, precipitation_sum}, ...]
    let precipArr = null
    if (Array.isArray(data.precip_forecast_7days) && data.precip_forecast_7days.length > 0) {
      const first = data.precip_forecast_7days[0]
      if (first !== null && typeof first === 'object') {
        precipArr = data.precip_forecast_7days.map(d => Number(d.precipitation_sum ?? 0))
      } else {
        precipArr = data.precip_forecast_7days.map(Number)
      }
    }

    const ws = data.weather_summary ?? null

    return {
      yield_ctha:                yieldActual,
      yield_label:               yieldLabel,
      yield_threshold:           data.yield_threshold_centner_per_ha ?? null,
      model_cv_accuracy:         data.model_cv_accuracy ?? null,
      confidence:                confidenceRaw,
      confidence_label:          confidenceRaw >= 0.7 ? 'Высокая' : 'Низкая',
      anomaly_flag:              false,
      irrigation_recommendation: null,
      warning:                   null,
      status:                    confidenceRaw < 0.6 ? 'warning' : 'normal',
      precip_forecast_7days:     precipArr,
      weather_summary:           ws ? {
        avg_temp:        ws.avg_temp ?? null,
        total_precip_mm: ws.total_precip_mm ?? null,
        hot_days:        ws.hot_days ?? null,
        water_balance:   null,
      } : null,
      _source: 'ml',
    }
  } catch {
    // ML недоступен — возвращаем null, FieldDetail подставит мок
    return null
  }
}

// ── Датчики ───────────────────────────────────────────────────────────────────
// Backend model: { field_id, soil_moisture, temperature, humidity }
// wind_speed и soil_temperature не хранятся на бэке — используются только ML-сервисом
export async function saveSensorData(field_id, humidity, soil_moisture, temperature) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/sensors/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_id, humidity, soil_moisture, temperature }),
    })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

export async function fetchSensorData(field_id) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/sensors/${field_id}`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return null
  }
}

// ── Рекомендация полива — через Go-прокси → Python :8002 ─────────────────────
// ML SensorPayload ожидает: crop_type, soil_moisture, humidity_air (не crop/soil_moisture_percent)
// Ответ ML: irrigation_recommended / irrigation_volume → нормализуем в irrigate / amount_mm
export async function fetchIrrigationRecommend(field_id, crop_type, soil_moisture, soil_temperature, air_temperature, humidity_air, wind_speed, precip_forecast_7days = []) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/recommend/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_id, crop_type, soil_moisture, soil_temperature,
        air_temperature, humidity_air, wind_speed, precip_forecast_7days,
      }),
    })
    if (!res.ok) throw new Error()
    const data = await res.json()

    // Аномалия: ML возвращает validation-объект напрямую { status:'anomaly', anomalies, message }
    if (data.status === 'anomaly') {
      return {
        irrigate:         false,
        amount_mm:        null,
        when:             null,
        reason:           data.message ?? null,
        rain_next_days_mm: null,
        is_anomaly:       true,
        status:           'anomaly',
        message:          data.message ?? null,
        anomalies:        data.anomalies ?? [],
      }
    }

    // Норма: нормализуем имена полей ML → внутренний формат фронта
    return {
      irrigate:          data.irrigation_recommended ?? false,
      amount_mm:         data.irrigation_volume      ?? null,
      when:              data.when                   ?? null,
      reason:            data.reason                 ?? null,
      rain_next_days_mm: data.rain_next_days_mm      ?? null,
      is_anomaly:        data.is_anomaly             ?? false,
      status:            data.is_anomaly ? 'anomaly' : 'normal',
      message:           null,
      anomalies:         [],
      irrigation_volume: data.irrigation_volume      ?? null,
      profile_used:      data.profile_used           ?? null,
    }
  } catch {
    return null
  }
}

// ── Уведомления ───────────────────────────────────────────────────────────────
const SEV_MAP = { low: 'info', medium: 'warning', critical: 'critical' }

export async function fetchAlerts() {
  try {
    const res = await fetch(`${BASE_URL}/api/alerts`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    return data.map(a => ({
      id:         String(a.id),
      type:       a.type      ?? 'weather',
      severity:   SEV_MAP[a.severity] ?? a.severity ?? 'info',
      title:      a.message   ?? 'Уведомление',
      message:    a.description ?? a.message ?? '',
      action:     a.action    ?? null,
      district:   a.district  ?? '',
      created_at: a.created_at,
      is_read:    a.is_read   ?? false,
      field_id:   a.field_id  ?? null,
    }))
  } catch {
    try {
      const res2 = await fetch(`${BASE_URL}/api/v1/alerts`)
      if (!res2.ok) throw new Error()
      const data2 = await res2.json()
      return data2.map(a => ({
        id:         String(a.id),
        type:       'weather',
        severity:   SEV_MAP[a.severity] ?? 'info',
        title:      a.message  ?? 'Уведомление',
        message:    a.message  ?? '',
        action:     null,
        district:   '',
        created_at: a.created_at,
        is_read:    a.is_read  ?? false,
        field_id:   a.field_id ?? null,
      }))
    } catch {
      return null
    }
  }
}

export async function markAlertRead(id) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/alerts/${id}/read`, { method: 'PUT' })
    return res.ok
  } catch {
    return false
  }
}

// ── История прогнозов ─────────────────────────────────────────────────────────
// Ответ бэка: [{ id, field_id, yield_prediction, irrigation_recommendation, confidence, is_anomaly, created_at }]
export async function fetchPredictions(field_id) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/predictions/${field_id}`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return null
  }
}

// ── Районы ───────────────────────────────────────────────────────────────────
export async function fetchDistricts() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/districts`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return [
      'Азовский', 'Аксайский', 'Багаевский', 'Белокалитвинский',
      'Боковский', 'Верхнедонской', 'Веселовский', 'Волгодонской',
      'Дубовский', 'Егорлыкский', 'Заветинский', 'Зерноградский',
      'Зимовниковский', 'Кагальницкий', 'Каменский', 'Кашарский',
      'Константиновский', 'Красносулинский', 'Куйбышевский',
      'Мартыновский', 'Матвеево-Курганский', 'Миллеровский',
      'Милютинский', 'Морозовский', 'Мясниковский', 'Неклиновский',
      'Новочеркасский', 'Обливский', 'Октябрьский', 'Орловский',
      'Песчанокопский', 'Пролетарский', 'Ремонтненский',
      'Родионово-Несветайский', 'Ростовский', 'Сальский',
      'Семикаракорский', 'Советский', 'Тарасовский', 'Тацинский',
      'Усть-Донецкий', 'Целинский', 'Чертковский', 'Шолоховский',
    ]
  }
}

// ── Валидация данных датчика — через Go-прокси → Python :8002 ─────────────────
export async function validateSensorData(data) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

// ── Профили культур — через Go-прокси → Python :8002 ─────────────────────────
// Ответ: [{ crop_name, display_name, moisture_threshold_high, moisture_threshold_low, ... }]
export async function fetchCropProfiles() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/config/profiles`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return null
  }
}

// ── Статус ML-сервисов — через Go-прокси ─────────────────────────────────────
// Ответ: { status, ml_yield_service, ml_irrigation_service }
export async function fetchMLHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/ml/health`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return null
  }
}

// ── Погода (Open-Meteo) ───────────────────────────────────────────────────────
export async function fetchCurrentWeather(lat = 46.85, lon = 40.31) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,et0_fao_evapotranspiration&timezone=Europe%2FMoscow&forecast_days=7`
    const res = await fetch(url)
    if (!res.ok) throw new Error()
    const data = await res.json()
    if (!data?.daily?.temperature_2m_max?.length) throw new Error('no daily data')
    return {
      temp_max:              data.daily.temperature_2m_max[0],
      temp_min:              data.daily.temperature_2m_min[0],
      temp_mean:             data.daily.temperature_2m_mean[0],
      precip_today:          data.daily.precipitation_sum[0],
      et0_today:             data.daily.et0_fao_evapotranspiration[0],
      precip_forecast_7days: data.daily.precipitation_sum,
      source:                'Open-Meteo ERA5',
      updated_at:            new Date().toISOString(),
    }
  } catch {
    return null
  }
}