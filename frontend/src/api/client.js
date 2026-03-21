const BASE_URL = 'http://localhost:8080'

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

export async function deleteField(id) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/fields/${id}`, { method: 'DELETE' })
    return res.ok
  } catch {
    return false
  }
}

// ── Прогноз урожайности ───────────────────────────────────────────────────────
export async function fetchForecast(field_id, latitude, longitude) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_id, latitude, longitude, user_id: 1 }),
    })
    if (!res.ok) throw new Error()
    const data = await res.json()
    return {
      yield_ctha:               data.prediction?.yield_prediction ?? null,
      confidence:               data.prediction?.confidence ?? 0,
      confidence_label:         (data.prediction?.confidence ?? 0) > 0.7 ? 'Высокая' : 'Низкая',
      anomaly_flag:             data.prediction?.is_anomaly ?? false,
      irrigation_recommendation: data.prediction?.irrigation_recommendation ?? null,
      warning:                  data.warning ?? null,
      status:                   data.status ?? 'normal',
    }
  } catch {
    return null
  }
}

// ── Датчики ───────────────────────────────────────────────────────────────────
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

// ── Рекомендация полива ───────────────────────────────────────────────────────
export async function fetchIrrigationRecommend(field_id, humidity, soil_moisture, temperature) {
  try {
    const res = await fetch(`${BASE_URL}/api/v1/recommend/irrigation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_id, humidity, soil_moisture, temperature }),
    })
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return null
  }
}

// ── Уведомления ───────────────────────────────────────────────────────────────
export async function fetchAlerts() {
  try {
    const res = await fetch(`${BASE_URL}/api/alerts`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    try {
      const res2 = await fetch(`${BASE_URL}/api/v1/alerts`)
      if (!res2.ok) throw new Error()
      const data = await res2.json()
      return data.map(a => ({
        id:         String(a.id),
        type:       a.type       ?? 'weather',
        severity:   a.severity   ?? 'info',
        title:      a.message    ?? 'Уведомление',
        message:    a.description ?? a.message,
        action:     a.action     ?? null,
        district:   a.district   ?? '',
        created_at: a.created_at,
        is_read:    a.is_read    ?? false,
      }))
    } catch {
      return null
    }
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

// ── Валидация данных датчика ───────────────────────────────────────────────────
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

// ── Погода (Open-Meteo) ───────────────────────────────────────────────────────
export async function fetchCurrentWeather(lat = 46.85, lon = 40.31) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,et0_fao_evapotranspiration&timezone=Europe%2FMoscow&forecast_days=7`
    const res = await fetch(url)
    if (!res.ok) throw new Error()
    const data = await res.json()
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
