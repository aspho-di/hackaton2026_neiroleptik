import { useState } from 'react'
import { validateSensorData, saveSensorData, fetchIrrigationRecommend } from '../api/client'
import AnomalyAlert from './AnomalyAlert'
import { IconCheck, IconX } from './icons/Icons'

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
      message: 'Аномальная влажность почвы — проверьте датчик.',
      anomalies: [`Влажность почвы ${soil}% вне диапазона [10–90%]`],
    }
  }
  if (air > 35) {
    return {
      ...MOCK_RESULT,
      amount_mm: 35,
      reason: `Высокая температура воздуха (${air}°C) — усиленное испарение.`,
    }
  }
  return { ...MOCK_RESULT, anomalies: [] }
}

const FIELDS = [
  { name: 'humidity',        label: 'Влажность воздуха (%)',  min: 0,   max: 100, placeholder: 'напр. 65' },
  { name: 'soil_moisture',   label: 'Влажность почвы (%)',    min: 0,   max: 100, placeholder: 'напр. 45' },
  { name: 'soil_temperature',label: 'Температура почвы (°C)', min: -20, max: 80,  placeholder: 'напр. 18' },
  { name: 'air_temperature', label: 'Температура воздуха (°C)', min: -40, max: 60, placeholder: 'напр. 25' },
]

export default function SensorForm({ fieldId, crop = 'wheat', onResult }) {
  const [form, setForm] = useState({
    humidity: '', soil_moisture: '', soil_temperature: '', air_temperature: '',
  })
  const [result,        setResult]        = useState(null)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [validWarnings, setValidWarnings] = useState([])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
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

    try {
      // Шаг 1: валидация (Python :8002 /validate)
      const validation = await validateSensorData({
        field_id: fieldId,
        crop,
        soil_moisture_percent: soil_moisture,
        soil_temperature,
        air_temperature,
      })
      if (validation?.status === 'anomaly' && validation.anomalies?.length) {
        setValidWarnings(validation.anomalies)
      }

      // Шаг 2: сохранить данные датчика (Go :8080)
      await saveSensorData(fieldId, humidity, soil_moisture, air_temperature)

      // Шаг 3: рекомендация полива (Python :8002 /recommend/irrigation)
      const irrigationData = await fetchIrrigationRecommend(
        fieldId, crop, soil_moisture, soil_temperature, air_temperature
      ) ?? getMockResult(form)

      setResult(irrigationData)
      onResult?.({ irrigation: irrigationData })
    } catch {
      setError('Не удалось выполнить расчёт. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  const showAlert = result && (result.status === 'anomaly' || result.confidence === 'low')

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '20px 24px',
    }}>
      <h3 style={{ fontSize: '15px', color: 'var(--color-text)', marginBottom: '16px' }}>
        Данные датчика
      </h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {FIELDS.map(f => (
            <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {f.label}
              <input
                style={inputStyle}
                name={f.name}
                type="number"
                min={f.min} max={f.max}
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
          {validWarnings.map((w, i) => <span key={i}>⚠ {w}</span>)}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '14px', color: 'var(--color-anomaly)', fontSize: '13px' }}>{error}</div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          {showAlert && <AnomalyAlert message={result.message} anomalies={result.anomalies} />}
          <div style={{
            background: 'var(--color-accent-light)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            padding: '16px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)', fontFamily: 'Montserrat, sans-serif', fontSize: '14px' }}>
              Рекомендация по поливу
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
              <Stat label="Нужен полив" value={
                result.irrigate
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconCheck size={14} color="var(--color-normal)" /> Да</span>
                  : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconX size={14} color="var(--color-anomaly)" /> Нет</span>
              } />
              {result.irrigate && (
                <>
                  <Stat label="Объём"  value={`${result.amount_mm} мм`} />
                  <Stat label="Дата"   value={result.when ?? '—'} />
                </>
              )}
              {result.rain_next_days_mm != null && (
                <Stat label="Осадки 2–3 дня" value={`${result.rain_next_days_mm} мм`} />
              )}
            </div>
            {result.reason && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                {result.reason}
              </div>
            )}
          </div>
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
