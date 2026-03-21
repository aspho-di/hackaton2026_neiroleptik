import { useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { useFields } from '../hooks/useFields'
import { getMockForecastForField } from '../mockData'
import { IconWarning } from '../components/icons/Icons'
import { CROP_LABEL } from '../constants/districts'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend, Tooltip,
} from 'recharts'

const FIELD_COLORS = ['#4caf50', '#3b82f6', '#f59e0b', '#ef4444']

// Мок данных датчиков по участкам
const FIELD_SENSORS = {
  45: { soil_moisture: 45, air_temp: 22 },
  12: { soil_moisture: 32, air_temp: 32 },
  7:  { soil_moisture: 98, air_temp: 35 },
  23: { soil_moisture: 55, air_temp: 20 },
  31: { soil_moisture: 38, air_temp: 31 },
}

const STATUS_ORDER = { anomaly: 0, warning: 1, normal: 2 }

function getEffectiveStatus(forecast) {
  if (forecast.status === 'anomaly') return 'anomaly'
  if (forecast.confidence === 'low') return 'warning'
  return 'normal'
}

function buildRadarData(items) {
  const axes = ['Урожайность', 'Влажность', 'Осадки', 'Температура', 'Статус']
  return axes.map(ax => {
    const entry = { subject: ax }
    items.forEach(({ field, forecast, sensors, precip }, i) => {
      let val = 0
      if (ax === 'Урожайность') val = forecast?.yield_ctha != null ? Math.min((forecast.yield_ctha / 50) * 100, 100) : 0
      if (ax === 'Влажность')   val = Math.max(0, 100 - Math.abs(sensors.soil_moisture - 50) * 2)
      if (ax === 'Осадки')      val = Math.min((precip / 25) * 100, 100)
      if (ax === 'Температура') val = Math.max(0, ((40 - sensors.air_temp) / 25) * 100)
      if (ax === 'Статус') {
        const s = getEffectiveStatus(forecast)
        val = s === 'normal' ? 100 : s === 'warning' ? 50 : 10
      }
      entry[`field_${field.field_id}`] = Math.round(val)
    })
    return entry
  })
}

// Ячейка с подсветкой best/worst
function Cell({ value, isBest, isWorst, children }) {
  const bg = isBest ? 'rgba(76,175,80,0.12)' : isWorst ? 'rgba(239,68,68,0.10)' : 'transparent'
  return (
    <td style={{
      padding: '10px 16px', textAlign: 'center', fontSize: 13,
      color: 'var(--color-text)', background: bg,
      borderBottom: '1px solid var(--color-border)',
    }}>
      {children ?? value}
    </td>
  )
}

function CompareTable({ items }) {
  // Строки таблицы: [label, getter, higherIsBetter]
  const rows = [
    {
      label: 'Статус', render: (item) => (
        <StatusBadge status={item.forecast.status} confidence={item.forecast.confidence} />
      ), numeric: false,
    },
    {
      label: 'Прогноз ц/га',
      get: (item) => item.forecast.yield_ctha,
      higherIsBetter: true, numeric: true,
      render: (item) => `${item.forecast.yield_ctha} ц/га`,
    },
    {
      label: 'Влажность почвы',
      get: (item) => item.sensors.soil_moisture,
      // Лучшее — ближе к 50
      score: (item) => -Math.abs(item.sensors.soil_moisture - 50),
      higherIsBetter: false, numeric: true,
      render: (item) => {
        const m = item.sensors.soil_moisture
        const warn = m > 90 || m < 20
        return (
          <span style={{ color: warn ? 'var(--color-anomaly)' : 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {m}%{warn && <IconWarning size={13} color="var(--color-anomaly)" />}
          </span>
        )
      },
    },
    {
      label: 'Темп. воздуха',
      get: (item) => item.sensors.air_temp,
      higherIsBetter: false, numeric: true,
      render: (item) => `${item.sensors.air_temp}°C`,
    },
    {
      label: 'Осадки 7 дней',
      get: (item) => item.precip,
      higherIsBetter: true, numeric: true,
      render: (item) => `${item.precip} мм`,
    },
  ]

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--color-surface)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <thead>
          <tr style={{ background: 'var(--color-accent-light)' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border)' }}>
              Показатель
            </th>
            {items.map(({ field }, i) => (
              <th key={field.field_id} style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: FIELD_COLORS[i], borderBottom: '1px solid var(--color-border)' }}>
                <div>{field.name.split('—')[0].trim()}</div>
                <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)' }}>{CROP_LABEL[field.crop] ?? field.crop}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const scores = row.numeric
              ? items.map(item => (row.score ? row.score(item) : (row.higherIsBetter ? 1 : -1) * row.get(item)))
              : null
            const maxScore = scores?.length ? Math.max(...scores) : null
            const minScore = scores?.length ? Math.min(...scores) : null

            return (
              <tr key={row.label}>
                <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
                  {row.label}
                </td>
                {items.map((item, i) => {
                  const score  = scores ? scores[i] : null
                  const isBest  = score != null && score === maxScore && maxScore !== minScore
                  const isWorst = score != null && score === minScore && maxScore !== minScore
                  return (
                    <Cell key={item.field.field_id} isBest={isBest} isWorst={isWorst}>
                      {row.render(item)}
                    </Cell>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Recommendations({ items }) {
  const sorted = [...items].sort((a, b) =>
    STATUS_ORDER[getEffectiveStatus(a.forecast)] - STATUS_ORDER[getEffectiveStatus(b.forecast)]
  )
  const recs = sorted.flatMap(({ field, forecast, sensors }) => {
    const status = getEffectiveStatus(forecast)
    const res = []
    if (status === 'anomaly') {
      res.push({
        color: 'var(--color-anomaly)',
        text: `Приоритет: ${field.name.split('—')[0].trim()} (Аномалия) — ${sensors.soil_moisture > 90 ? 'проверить датчик влажности' : 'требуется срочный полив'}`,
      })
    } else if (status === 'warning') {
      res.push({
        color: 'var(--color-warning)',
        text: `${field.name.split('—')[0].trim()} требует внимания — низкая уверенность прогноза`,
      })
    }
    if (forecast.risk_factors?.some(rf => rf.label.toLowerCase().includes('осадк') || rf.label.toLowerCase().includes('засух'))) {
      res.push({
        color: 'var(--color-normal)',
        text: `${field.name.split('—')[0].trim()}: рекомендован превентивный полив из-за дефицита осадков`,
      })
    }
    return res
  })

  if (!recs.length) return null
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: 12 }}>Рекомендации</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recs.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13 }}>
            <IconWarning size={15} color={r.color} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ color: 'var(--color-text)', lineHeight: 1.5 }}>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Compare() {
  const { fields: allFields } = useFields()
  const [selected, setSelected] = useState([])
  const [compared, setCompared] = useState(null)

  function toggle(fieldId) {
    setSelected(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : prev.length < 4 ? [...prev, fieldId] : prev
    )
  }

  function compare() {
    const result = selected.map(id => {
      const field    = allFields.find(f => f.field_id === id)
      const forecast = getMockForecastForField(id)
      const sensors  = FIELD_SENSORS[id] || { soil_moisture: 45, air_temp: 22 }
      const precip   = +(forecast?.precip_forecast_7days ?? []).reduce((s, v) => s + v, 0).toFixed(1)
      return { field, forecast, sensors, precip }
    })
    setCompared(result)
  }

  const radarData = compared ? buildRadarData(compared) : null

  return (
    <>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 24px 48px' }}>

        <h1 className="page-title">
          Сравнение участков
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
          Выберите 2–4 участка для сравнения
        </p>

        {/* Выбор участков */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Участки
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {allFields.map((field, i) => {
              const isSelected = selected.includes(field.field_id)
              const disabled   = !isSelected && selected.length >= 4
              const statusColor = field.status === 'anomaly' ? 'var(--color-anomaly)' : field.status === 'warning' ? 'var(--color-warning)' : 'var(--color-normal)'
              return (
                <button
                  key={field.field_id}
                  onClick={() => !disabled && toggle(field.field_id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 8,
                    border: `2px solid ${isSelected ? FIELD_COLORS[selected.indexOf(field.field_id)] : 'var(--color-border)'}`,
                    background: isSelected ? `${FIELD_COLORS[selected.indexOf(field.field_id)]}18` : 'var(--color-bg)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    fontSize: 13, fontWeight: isSelected ? 600 : 400,
                    color: 'var(--color-text)', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
                  {field.name}
                </button>
              )
            })}
          </div>
          <button
            onClick={compare}
            disabled={selected.length < 2}
            style={{
              padding: '10px 28px', borderRadius: 8, border: 'none',
              background: selected.length < 2 ? 'var(--color-text-muted)' : 'var(--color-accent)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              fontFamily: 'Montserrat, sans-serif',
              cursor: selected.length < 2 ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Сравнить {selected.length >= 2 ? `(${selected.length})` : ''}
          </button>
        </div>

        {/* Результаты */}
        {compared && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Таблица */}
            <CompareTable items={compared} />

            {/* RadarChart */}
            <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '20px 24px', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: 4 }}>
                Радарная диаграмма
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                Нормализованные показатели (0–100)
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12, color: 'var(--color-text)' }}
                  />
                  {compared.map(({ field }, i) => (
                    <Radar
                      key={field.field_id}
                      name={field.name.split('—')[0].trim()}
                      dataKey={`field_${field.field_id}`}
                      stroke={FIELD_COLORS[i]}
                      fill={FIELD_COLORS[i]}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    formatter={(value) => <span style={{ color: 'var(--color-text)' }}>{value}</span>}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Рекомендации */}
            <Recommendations items={compared} />

          </div>
        )}
      </div>
    </>
  )
}
