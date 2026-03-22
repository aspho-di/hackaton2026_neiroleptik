import { useState } from 'react'
import { validateSensorData, saveSensorData, fetchIrrigationRecommend } from '../api/client'
import AnomalyAlert from './AnomalyAlert'
import { IconCheck, IconX, IconWarning, IconDroplet } from './icons/Icons'
import { showToast } from './Toast'

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const MOCK_RESULT = {
  irrigate: true,
  when: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  amount_mm: 25,
  reason: 'Мок-данные: влажность ниже нормы.',
  rain_next_days_mm: 1.2,
}

function getMockResult(form) {
  const soil = Number(form.soil_moisture)
  const air  = Number(form.air_temperature)
  if (soil > 90 || soil < 10) {
    return {
      ...MOCK_RESULT,
      status: 'anomaly',
      is_anomaly: true,
      message: 'Аномальная влажность почвы — проверьте датчик.',
      anomalies: [`Влажность почвы ${soil}% вне диапазона [10–90%]`],
    }
  }
  if (air > 35) {
    return {
      ...MOCK_RESULT,
      amount_mm: 35,
      is_anomaly: false,
      reason: `Высокая температура воздуха (${air}°C) — усиленное испарение.`,
    }
  }
  return { ...MOCK_RESULT, anomalies: [], is_anomaly: false }
}

const FIELDS = [
  { name: 'humidity',         label: 'Влажность воздуха (%)',   min: 0,   max: 100, placeholder: 'напр. 65' },
  { name: 'soil_moisture',    label: 'Влажность почвы (%)',     min: 0,   max: 100, placeholder: 'напр. 45' },
  { name: 'soil_temperature', label: 'Температура почвы (°C)',  min: -20, max: 80,  placeholder: 'напр. 18' },
  { name: 'air_temperature',  label: 'Температура воздуха (°C)',min: -40, max: 60,  placeholder: 'напр. 25' },
  { name: 'wind_speed',       label: 'Скорость ветра (м/с)',    min: 0,   max: 50,  placeholder: 'напр. 3.5' },
]

const DEMO_SCENARIOS = [
  {
    label: 'Аномалия',
    hint: 'влажность почвы 98% — сбой датчика',
    color: 'var(--color-anomaly)',
    values: { humidity: '62', soil_moisture: '98', soil_temperature: '21', air_temperature: '28', wind_speed: '3.2' },
  },
  {
    label: 'Засуха',
    hint: 'критически сухо, высокая температура',
    color: 'var(--color-warning)',
    values: { humidity: '22', soil_moisture: '12', soil_temperature: '34', air_temperature: '38', wind_speed: '6.0' },
  },
  {
    label: 'Норма',
    hint: 'оптимальные условия для пшеницы',
    color: 'var(--color-normal)',
    values: { humidity: '65', soil_moisture: '48', soil_temperature: '18', air_temperature: '22', wind_speed: '2.5' },
  },
]

const EMPTY_FORM = { humidity: '', soil_moisture: '', soil_temperature: '', air_temperature: '', wind_speed: '' }

export default function SensorForm({ fieldId, crop = 'wheat', onResult }) {
  const [form, setForm]             = useState(EMPTY_FORM)
  const [result, setResult]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [validWarnings, setValidWarnings] = useState([])
  const [activeDemo, setActiveDemo] = useState(null)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setActiveDemo(null)
  }

  function applyDemo(scenario) {
    setForm(scenario.values)
    setResult(null)
    setError(null)
    setValidWarnings([])
    setActiveDemo(scenario.label)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setValidWarnings([])

    const humidity         = Number(form.humidity)
    const soil_moisture    = Number(form.soil_moisture)
    const soil_temperature = Number(form.soil_temperature)
    const air_temperature  = Number(form.air_temperature)
    const wind_speed       = Number(form.wind_speed)

    try {
      // Шаг 1: валидация (Python :8002 /validate)
      const validation = await validateSensorData({
        field_id:     fieldId,
        crop_type:    crop,
        soil_moisture,
        soil_temperature,
        air_temperature,
        humidity_air: humidity,
        wind_speed,
      })
      if (validation?.status === 'anomaly' && validation.anomalies?.length) {
        setValidWarnings(Array.isArray(validation.anomalies) ? validation.anomalies : [])
      }

      // Шаг 2: сохранить данные датчика (Go :8080)
      // Бэк принимает: { field_id, humidity, soil_moisture, temperature }
      // wind_speed и soil_temperature не хранятся в БД — только для ML
      const saveResp = await saveSensorData(fieldId, humidity, soil_moisture, air_temperature)
      if (saveResp?.anomaly_detected) {
        setValidWarnings(prev => [...prev, 'Бэкенд обнаружил аномалию в показаниях датчика'])
      }

      // Шаг 3: рекомендация полива (Python :8002 /recommend/irrigation)
      const irrigationData = await fetchIrrigationRecommend(
        fieldId, crop, soil_moisture, soil_temperature, air_temperature, humidity, wind_speed
      ) ?? getMockResult(form)

      setResult(irrigationData)
      onResult?.({ irrigation: irrigationData, soil_moisture, air_temperature, wind_speed })

      // Save to localStorage for History tab
      try {
        const key = `sensor_history_${fieldId}`
        const prev = JSON.parse(localStorage.getItem(key) || '[]')
        prev.push({
          ts: new Date().toISOString(),
          humidity,
          soil_moisture,
          soil_temperature,
          air_temperature,
          wind_speed,
          is_anomaly: irrigationData?.is_anomaly ?? false,
          irrigate:   irrigationData?.irrigate ?? false,
          amount_mm:  irrigationData?.amount_mm ?? null,
        })
        localStorage.setItem(key, JSON.stringify(prev.slice(-50)))
      } catch {}

      showToast('Данные датчика сохранены')

      if (irrigationData?.irrigate === true) {
        const prev = Number(localStorage.getItem('completed_recommendations') || 0)
        localStorage.setItem('completed_recommendations', String(prev + 1))
      }
    } catch {
      setError('Не удалось выполнить расчёт. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  const showAlert = result && (result.status === 'anomaly' || result.confidence === 'low')
  const isAnomaly = result?.is_anomaly === true || result?.status === 'anomaly'

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '20px 24px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontSize: '15px', color: 'var(--color-text)', margin: 0 }}>Данные датчика</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {DEMO_SCENARIOS.map(s => (
            <button
              key={s.label}
              type="button"
              onClick={() => applyDemo(s)}
              title={s.hint}
              style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                border: `1px solid ${s.color}`,
                background: activeDemo === s.label ? s.color + '22' : 'transparent',
                color: s.color, cursor: 'pointer', transition: 'background 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => e.currentTarget.style.background = s.color + '18'}
              onMouseLeave={e => e.currentTarget.style.background = activeDemo === s.label ? s.color + '22' : 'transparent'}
            >
              Демо: {s.label}
            </button>
          ))}
        </div>
      </div>

      {activeDemo && (
        <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          {DEMO_SCENARIOS.find(s => s.label === activeDemo)?.hint}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {FIELDS.map(f => (
            <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {f.label}
              <input
                style={inputStyle}
                name={f.name}
                type="number"
                min={f.min} max={f.max}
                step="any"
                placeholder={f.placeholder}
                value={form[f.name]}
                onChange={handleChange}
                onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
                required
              />
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? 'var(--color-text-muted)' : 'var(--color-accent)',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 28px', fontSize: '14px', fontWeight: 600,
            fontFamily: 'Montserrat, sans-serif',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--color-accent-hover)' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--color-accent)' }}
        >
          {loading ? 'Расчёт...' : 'Рассчитать'}
        </button>
      </form>

      {validWarnings.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-warning)', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {validWarnings.map((w, i) => <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><IconWarning size={12} color="var(--color-warning)" />{w}</span>)}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '14px', color: 'var(--color-anomaly)', fontSize: '13px' }}>{error}</div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          {showAlert && <AnomalyAlert message={result.message} anomalies={result.anomalies} />}

          {/* is_anomaly flag */}
          {isAnomaly && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', marginBottom: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8, fontSize: 13,
              color: 'var(--color-anomaly)', fontWeight: 600,
            }}>
              <IconWarning size={14} color="var(--color-anomaly)" />
              Запись помечена флагом is_anomaly — данные отправлены на проверку
            </div>
          )}

          {(() => {
            const cardBg     = isAnomaly ? '#fef2f2' : result.irrigate ? '#fffbeb' : '#f0fdf4'
            const cardBorder = isAnomaly ? '#fecaca' : result.irrigate ? '#fde68a' : '#bbf7d0'
            const cardAccent = isAnomaly ? 'var(--color-anomaly)' : result.irrigate ? 'var(--color-warning)' : 'var(--color-normal)'
            const cardIcon   = isAnomaly ? <IconWarning size={14} color={cardAccent} /> : result.irrigate ? <IconDroplet size={14} color={cardAccent} /> : <IconCheck size={14} color={cardAccent} />
            const cardText   = isAnomaly ? 'Аномалия' : result.irrigate ? 'Требуется полив' : 'Полив не нужен'
            return (
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderLeft: `4px solid ${cardAccent}`,
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
              {cardIcon}
              <div style={{ fontWeight: 700, color: cardAccent, fontFamily: 'Montserrat, sans-serif', fontSize: '14px' }}>
                {cardText}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <Stat label="Нужен полив" value={
                result.irrigate
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconCheck size={14} color="var(--color-normal)" /> Да</span>
                  : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconX size={14} color="var(--color-anomaly)" /> Нет</span>
              } />
              {result.irrigate && (
                <>
                  <Stat label="Рекомендуется" value={`${result.amount_mm} мм`} />
                  <Stat label="Дата" value={result.when ?? '—'} />
                </>
              )}
              {result.rain_next_days_mm != null && (
                <Stat label="Осадки 2–3 дня" value={`${result.rain_next_days_mm} мм`} />
              )}
              {result.irrigation_volume != null && result.amount_mm != null && (
                <Stat
                  label="Факт / Рекоменд."
                  value={
                    <span style={{ color: result.irrigation_volume < result.amount_mm ? 'var(--color-warning)' : 'var(--color-normal)' }}>
                      {result.irrigation_volume} / {result.amount_mm} мм
                    </span>
                  }
                />
              )}
            </div>
            {result.reason && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {result.reason}
              </div>
            )}

            {result.profile_used && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ fontSize: 11, color: 'var(--color-text-muted)', cursor: 'pointer', userSelect: 'none', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Профиль культуры: {result.profile_used.display_name ?? result.profile_used.crop_name}
                </summary>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px', marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {result.profile_used.moisture_threshold_low  != null && <span>Влажность min: <b style={{ color: 'var(--color-text)' }}>{result.profile_used.moisture_threshold_low}%</b></span>}
                  {result.profile_used.moisture_threshold_high != null && <span>Влажность max: <b style={{ color: 'var(--color-text)' }}>{result.profile_used.moisture_threshold_high}%</b></span>}
                  {result.profile_used.base_water_mm           != null && <span>Базовый полив: <b style={{ color: 'var(--color-text)' }}>{result.profile_used.base_water_mm} мм</b></span>}
                  {result.profile_used.heat_threshold          != null && <span>Порог жары: <b style={{ color: 'var(--color-text)' }}>{result.profile_used.heat_threshold}°C</b></span>}
                  {result.profile_used.rain_skip_mm            != null && <span>Пропуск при осадках: <b style={{ color: 'var(--color-text)' }}>{result.profile_used.rain_skip_mm} мм</b></span>}
                </div>
              </details>
            )}
          </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text)', fontFamily: 'Montserrat, sans-serif' }}>
        {value}
      </div>
    </div>
  )
}
