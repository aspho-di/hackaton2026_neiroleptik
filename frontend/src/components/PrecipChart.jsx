import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const DAY_LABELS = ['Сег', 'Зав', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function PrecipChart({ data }) {
  const chartData = (data || []).map((mm, i) => ({
    day: DAY_LABELS[i] ?? `День ${i + 1}`,
    mm,
  }))

  return (
    <div>
      <div style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 600,
        fontSize: '14px',
        marginBottom: '10px',
        color: 'var(--color-text)',
      }}>
        Осадки на 7 дней, мм
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7c6e', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#6b7c6e', fontFamily: 'Inter' }} unit=" мм" axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => [`${v} мм`, 'Осадки']}
            contentStyle={{ borderRadius: '8px', fontSize: '13px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-card)' }}
            cursor={{ fill: 'rgba(76,175,80,0.06)' }}
          />
          <Bar dataKey="mm" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
