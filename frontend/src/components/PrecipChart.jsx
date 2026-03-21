import {
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

const DAY_LABELS = ['Сег', 'Зав', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '8px',
      padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontSize: '13px',
      color: 'var(--color-text)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: '2px' }}>{label}</div>
      <div style={{ color: '#2563eb' }}>{payload[0].value} мм</div>
    </div>
  )
}

export default function PrecipChart({ data, height = 180 }) {
  const vals = Array.isArray(data) ? data.filter(v => v != null) : []
  const chartData = vals.map((mm, i) => ({
    day: DAY_LABELS[i] ?? `День ${i + 1}`,
    mm,
  }))

  const total = vals.reduce((s, v) => s + v, 0).toFixed(1)
  const max   = vals.length ? Math.max(...vals).toFixed(1) : 0
  const min   = vals.length ? Math.min(...vals).toFixed(1) : 0

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <Chip label="Сумма" value={`${total} мм`} />
        <Chip label="Макс" value={`${max} мм`} color="#2563eb" />
        <Chip label="Мин"  value={`${min} мм`}  color="#93c5fd" />
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id="precipGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%"   stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: '#6b7c6e', fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.06)' }} />
          <Bar
            dataKey="mm"
            fill="url(#precipGradient)"
            radius={[6, 6, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function Chip({ label, value, color }) {
  return (
    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
      {label}:{' '}
      <span style={{ fontWeight: 600, color: color || 'var(--color-text)' }}>{value}</span>
    </div>
  )
}
