import { useState } from 'react'
import { MOCK_IRRIGATION } from '../mockData'
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

function getMockIrrigation(form) {
  const humidity     = Number(form.humidity)
  const temperature  = Number(form.temperature)

  if (humidity > 90) {
    return {
      ...MOCK_IRRIGATION,
      confidence: 'low', status: 'anomaly',
      message: 'Аномально высокая влажность — вероятна ошибка датчика.',
      anomalies: [
        `Влажность ${humidity}% выходит за норму (5–90%)`,
        'Проверьте датчик влажности',
      ],
    }
  }
  if (humidity < 20) {
    return {
      ...MOCK_IRRIGATION,
      amount_mm: 45, confidence: 'low', status: 'anomaly',
      message: 'Критически низкая влажность. Требуется срочный полив.',
      anomalies: [
        'Влажность ниже критического порога (< 20%)',
        'Риск засыхания корневой системы',
      ],
    }
  }
  if (temperature > 35) {
    return {
      ...MOCK_IRRIGATION,
      amount_mm: 35, confidence: 'low', status: 'anomaly',
      message: 'Аномально высокая температура. Усиленное испарение.',
      anomalies: [
        `Температура воздуха ${temperature}°C — аномально высокая`,
        'Усиленное испарение влаги из почвы',
      ],
    }
  }
  return { ...MOCK_IRRIGATION, anomalies: [] }
}

export default function SensorForm({ fieldId, onResult }) {
  const [form, setForm] = useState({
    humidity:     '',
    soil_moisture: '',
    temperature:  '',
  })
  const [result,       setResult]       = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)
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

    const humidity      = Number(form.humidity)
    const soil_moisture = Number(form.soil_moisture)
    const temperature   = Number(form.temperature)

    try {
      // Шаг 1: валидация данных датчика
      const validation = await validateSensorData({ field_id: fieldId, humidity, soil_moisture, temperature })
      if (validation?.warnings?.length) {
        setValidWarnings(validation.warnings)
      }

      // Шаг 2: сохранить данные датчика
      await saveSensorData(fieldId, humidity, soil_moisture, temperature)

      // Шаг 3: получить рекомендацию по поливу
      const irrigationData = await fetchIrrigationRecommend(fieldId, humidity, soil_moisture, temperature)
        ?? getMockIrrigation(form)

      setResult(irrigationData)
      onResult?.({ irrigation: irrigationData })
    } catch {
      setError('Не удалось выполнить расчёт. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  const showAlert = result && (result.confidence === 'low' || result.status === 'anomaly')

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {[
            { name: 'humidity',      label: 'Влажность воздуха (%)',    min: 0,   max: 100, placeholder: 'напр. 65' },
            { name: 'soil_moisture', label: 'Температура почвы (°C)',   min: -20, max: 80,  placeholder: 'напр. 18' },
            { name: 'temperature',   label: 'Температура воздуха (°C)', min: -40, max: 60,  placeholder: 'напр. 25' },
          ].map(f => (
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
                result.irrigation_needed
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconCheck size={14} color="var(--color-normal)" /> Да</span>
                  : <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><IconX size={14} color="var(--color-anomaly)" /> Нет</span>
              } />
              {result.irrigation_needed && (
                <>
                  <Stat label="Объём"  value={`${result.amount_mm} мм`} />
                  <Stat label="Дата"   value={result.next_date} />
                </>
              )}
              <Stat label="Уверенность" value={
                typeof result.confidence === 'number'
                  ? (result.confidence > 0.7 ? 'Высокая' : 'Низкая')
                  : (result.confidence === 'high' ? 'Высокая' : 'Низкая')
              } />
            </div>
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
