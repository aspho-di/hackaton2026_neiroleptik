import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, CartesianGrid, Legend,
  ScatterChart, Scatter, Cell, ZAxis,
} from 'recharts'
import { HISTORY_DATA } from '../mockData'
import { fetchPredictions } from '../api/client'
import { useFields } from '../hooks/useFields'
import { IconDownload } from '../components/icons/Icons'

function exportCSV() {
  const headers = ['Год', 'Урожайность (ц/га)', 'Осадки (мм)', 'Жарких дней', 'Ср. температура (°C)', 'Водный баланс (мм)']
  const rows = HISTORY_DATA.map(d => [d.year, d.yield_ctha, d.precip_mm, d.hot_days, d.avg_temp, d.water_balance])
  const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'history_2016_2025.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const card = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '24px',
  marginBottom: '20px',
}

// Pearson correlation coefficient
function pearson(xs, ys) {
  const n = xs.length
  const mx = xs.reduce((s, x) => s + x, 0) / n
  const my = ys.reduce((s, y) => s + y, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0)
  )
  return den === 0 ? 0 : +(num / den).toFixed(2)
}

// ML metrics (результаты обучения модели на синтетическом датасете)
const ML_METRICS = [
  { label: 'RMSE', value: '3.4', unit: 'ц/га', desc: 'Среднеквадратичная ошибка', color: 'var(--color-normal)' },
  { label: 'MAE',  value: '2.6', unit: 'ц/га', desc: 'Средняя абсолютная ошибка', color: 'var(--color-normal)' },
  { label: 'R²',   value: '0.87', unit: '',    desc: 'Коэффициент детерминации',   color: '#3b82f6' },
  { label: 'Accuracy аномалий', value: '94.3', unit: '%', desc: 'Точность обнаружения аномалий', color: '#8b5cf6' },
]

const FEATURE_IMPORTANCE = [
  { feature: 'soil_moisture',  pct: 34, color: '#3b82f6' },
  { feature: 'precipitation',  pct: 28, color: '#4caf50' },
  { feature: 'air_temperature',pct: 19, color: '#f59e0b' },
  { feature: 'wind_speed',     pct: 9,  color: '#8b5cf6' },
  { feature: 'hot_days',       pct: 7,  color: '#ef4444' },
  { feature: 'humidity',       pct: 3,  color: '#6b7c6e' },
]

function SummaryCard({ label, value, sub, color, bg }) {
  return (
    <div style={{
      background: bg || 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: color || 'var(--color-text)', lineHeight: 1, marginBottom: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{sub}</div>}
    </div>
  )
}

function getRating(y) {
  if (y >= 40) return { label: 'Отличный', color: '#16a34a' }
  if (y >= 33) return { label: 'Хороший',  color: '#4caf50' }
  if (y >= 28) return { label: 'Средний',  color: '#f59e0b' }
  return         { label: 'Плохой',    color: '#ef4444' }
}

function YieldTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>{label}</div>
      <div style={{ color: '#4caf50' }}>Урожайность: <b>{d?.yield_ctha} ц/га</b></div>
      <div style={{ color: '#3b82f6' }}>Осадки: {d?.precip_mm} мм</div>
      <div style={{ color: d?.hot_days > 20 ? '#ef4444' : 'var(--color-text-muted)' }}>Жарких дней: {d?.hot_days}</div>
    </div>
  )
}

function PrecipTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.dataKey === 'precip_mm' ? '#3b82f6' : (p.value >= 0 ? '#16a34a' : '#ef4444') }}>
          {p.dataKey === 'precip_mm' ? 'Осадки' : 'Водный баланс'}: {p.value > 0 && p.dataKey !== 'precip_mm' ? '+' : ''}{p.value} мм
        </div>
      ))}
    </div>
  )
}

export default function History() {
  const [selectedYear, setSelectedYear] = useState(null)
  const { fields } = useFields()
  const [selectedFieldId, setSelectedFieldId] = useState(null)
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    if (!selectedFieldId) return
    fetchPredictions(selectedFieldId)
      .then(data => {
        if (data && Array.isArray(data)) setPredictions(data)
        else setPredictions([])
      })
      .catch(() => setPredictions([]))
  }, [selectedFieldId])

  const avgYield = useMemo(() =>
    +(HISTORY_DATA.reduce((s, d) => s + d.yield_ctha, 0) / HISTORY_DATA.length).toFixed(1),
  [])
  const best  = useMemo(() => HISTORY_DATA.reduce((a, b) => a.yield_ctha > b.yield_ctha ? a : b), [])
  const worst = useMemo(() => HISTORY_DATA.reduce((a, b) => a.yield_ctha < b.yield_ctha ? a : b), [])
  const trend = useMemo(() => {
    const n = HISTORY_DATA.length
    const first3 = HISTORY_DATA.slice(0, 3).reduce((s, d) => s + d.yield_ctha, 0) / 3
    const last3  = HISTORY_DATA.slice(n - 3).reduce((s, d) => s + d.yield_ctha, 0) / 3
    return +(last3 - first3).toFixed(1)
  }, [])

  const analysis = selectedYear ? HISTORY_DATA.find(d => d.year === selectedYear) : null

  return (
    <>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 48px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Исторический анализ</h1>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Урожайность и погодные условия 2016–2025 · Ростовская область
            </p>
          </div>
          <button
            onClick={exportCSV}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-accent)',
              borderRadius: 8, padding: '9px 18px',
              fontSize: 13, fontWeight: 600,
              color: 'var(--color-accent)',
              cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
              transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-accent)' }}
          >
            <IconDownload size={15} color="currentColor" />
            Скачать CSV
          </button>
        </div>

        {/* Сводные карточки */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <SummaryCard
            label="Средняя урожайность"
            value={`${avgYield} ц/га`}
            sub="за 2016–2025"
            color="var(--color-normal)"
          />
          <SummaryCard
            label={`Рекорд ${best.year}`}
            value={`${best.yield_ctha} ц/га`}
            sub={`${best.precip_mm} мм осадков`}
            color="#16a34a"
            bg="rgba(22,163,74,0.05)"
          />
          <SummaryCard
            label={`Минимум ${worst.year}`}
            value={`${worst.yield_ctha} ц/га`}
            sub={`${worst.hot_days} жарких дней`}
            color="var(--color-anomaly)"
            bg="rgba(239,68,68,0.04)"
          />
          <SummaryCard
            label="Тренд"
            value={`${trend > 0 ? '+' : ''}${trend} ц/га`}
            sub="разница: посл. 3 vs первые 3 года"
            color={trend >= 0 ? 'var(--color-normal)' : 'var(--color-anomaly)'}
          />
        </div>

        {/* Блок 1 — Урожайность */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
                Урожайность по годам
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Среднее за период: <b style={{ color: 'var(--color-text)' }}>{avgYield} ц/га</b>
                {' · '}Лучший: <b style={{ color: '#16a34a' }}>{best.year} ({best.yield_ctha})</b>
                {' · '}Худший: <b style={{ color: '#ef4444' }}>{worst.year} ({worst.yield_ctha})</b>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={HISTORY_DATA} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7c6e' }} unit=" ц" width={52} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip content={<YieldTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
              <ReferenceLine
                y={avgYield} stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={1.5}
                label={{ value: `сред. ${avgYield}`, position: 'insideBottomRight', fontSize: 11, fill: '#9ca3af' }}
              />
              <Line
                type="monotone" dataKey="yield_ctha"
                stroke="#4caf50" strokeWidth={2.5}
                dot={{ r: 5, fill: '#4caf50', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Блок 2 — Осадки и водный баланс */}
        <div style={card}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
            Осадки и водный баланс
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Водный баланс = осадки − испаряемость (ET₀) · мм за вегетационный период (май–август)
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={HISTORY_DATA} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="precip" orientation="left" tick={{ fontSize: 12, fill: '#6b7c6e' }} unit=" мм" width={52} axisLine={false} tickLine={false} />
              <YAxis yAxisId="balance" orientation="right" tick={{ fontSize: 12, fill: '#6b7c6e' }} unit=" мм" width={52} axisLine={false} tickLine={false} />
              <Tooltip content={<PrecipTooltip />} />
              <Legend
                formatter={n => n === 'precip_mm' ? 'Осадки, мм' : 'Водный баланс, мм'}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <ReferenceLine y={0} yAxisId="balance" stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} />
              <Bar yAxisId="precip" dataKey="precip_mm" fill="#93c5fd" radius={[4,4,0,0]} name="precip_mm" maxBarSize={40} />
              <Line
                yAxisId="balance" type="monotone" dataKey="water_balance"
                stroke="#16a34a" strokeWidth={2.2}
                dot={({ cx, cy, value }) => (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4}
                    fill={value >= 0 ? '#16a34a' : '#ef4444'}
                    stroke="#fff" strokeWidth={1.5} />
                )}
                name="water_balance" isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Блок 3 — Сводная таблица */}
        <div style={{ ...card, overflow: 'auto' }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 16 }}>
            Сводная таблица
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                {['Год', 'Урожайность', 'Осадки', 'Жарких дней', 'Водный баланс', 'Оценка'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HISTORY_DATA.map(d => {
                const r = getRating(d.yield_ctha)
                const isBest  = d.year === best.year
                const isWorst = d.year === worst.year
                return (
                  <tr key={d.year} style={{
                    background: isBest ? '#f0fdf4' : isWorst ? '#fff1f0' : 'transparent',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    <td style={{ padding: '11px 14px', fontWeight: isBest || isWorst ? 700 : 400 }}>
                      {d.year}
                      {isBest  && <span style={{ marginLeft: 6, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>↑ лучший</span>}
                      {isWorst && <span style={{ marginLeft: 6, fontSize: 11, color: '#ef4444', fontWeight: 700 }}>↓ худший</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: r.color }}>{d.yield_ctha} ц/га</td>
                    <td style={{ padding: '11px 14px' }}>{d.precip_mm} мм</td>
                    <td style={{ padding: '11px 14px', color: d.hot_days > 20 ? '#ef4444' : d.hot_days > 10 ? '#f59e0b' : 'inherit', fontWeight: d.hot_days > 20 ? 600 : 400 }}>
                      {d.hot_days}
                    </td>
                    <td style={{ padding: '11px 14px', color: d.water_balance >= 0 ? '#16a34a' : '#ef4444', fontWeight: 500 }}>
                      {d.water_balance > 0 ? '+' : ''}{d.water_balance} мм
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ background: r.color + '20', color: r.color, padding: '3px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>
                        {r.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Блок 4 — Ретроспективный анализ */}
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 12 }}>
            Анализ сезона
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {HISTORY_DATA.map(d => (
              <button
                key={d.year}
                onClick={() => setSelectedYear(d.year === selectedYear ? null : d.year)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: `1px solid ${selectedYear === d.year ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: selectedYear === d.year ? 'var(--color-accent)' : 'var(--color-surface)',
                  color: selectedYear === d.year ? '#fff' : 'var(--color-text)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  transition: 'all 0.15s',
                }}
              >
                {d.year}
              </button>
            ))}
          </div>

          {analysis ? (() => {
            const r = getRating(analysis.yield_ctha)
            const extraIrr = analysis.water_balance < 0 ? Math.round(Math.abs(analysis.water_balance) * 0.4) : 0
            return (
              <div style={{
                background: r.color + '10',
                border: `1px solid ${r.color}40`,
                borderLeft: `4px solid ${r.color}`,
                borderRadius: 8, padding: '18px 20px',
              }}>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                  Сезон {analysis.year}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--color-text)', margin: 0 }}>
                  В <strong>{analysis.year}</strong> году урожайность составила <strong>{analysis.yield_ctha} ц/га</strong> — оценка «<strong style={{ color: r.color }}>{r.label}</strong>».{' '}
                  Ключевые факторы: <strong>{analysis.hot_days}</strong> дней с температурой выше 30°C,
                  средняя температура вегетационного периода <strong>{analysis.avg_temp}°C</strong>,
                  суммарные осадки <strong>{analysis.precip_mm} мм</strong>.{' '}
                  {analysis.water_balance < 0 ? (
                    <>
                      Водный дефицит составил <strong style={{ color: '#ef4444' }}>{Math.abs(analysis.water_balance)} мм</strong>.{' '}
                      Рекомендация: увеличить полив в вегетационный период на <strong>{extraIrr} мм</strong> относительно нормы.
                    </>
                  ) : (
                    <>
                      Положительный водный баланс <strong style={{ color: '#16a34a' }}>+{analysis.water_balance} мм</strong> —
                      сезон был благоприятным по влагообеспеченности.
                    </>
                  )}
                </p>
              </div>
            )
          })() : (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '12px 0' }}>
              Выберите год для просмотра детального анализа
            </div>
          )}
        </div>

        {/* Блок 5 — История прогнозов из бэкенда */}
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 12 }}>
            История прогнозов по полю
          </div>
          <select
            value={selectedFieldId ?? ''}
            onChange={e => setSelectedFieldId(Number(e.target.value) || null)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, marginBottom: 16, background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none' }}
          >
            <option value="">Выберите поле</option>
            {fields.map(f => <option key={f.field_id} value={f.field_id}>{f.name}</option>)}
          </select>

          {selectedFieldId && predictions.length === 0 && (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Нет данных прогнозов для этого поля</div>
          )}

          {predictions.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                    {['Дата', 'Урожайность', 'Полив (мм)', 'Уверенность', 'Аномалия'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {predictions.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>
                        {new Date(p.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#4caf50' }}>{p.yield_prediction} ц/га</td>
                      <td style={{ padding: '10px 14px' }}>{p.irrigation_recommendation} мм</td>
                      <td style={{ padding: '10px 14px', color: p.confidence >= 0.7 ? 'var(--color-normal)' : 'var(--color-warning)' }}>
                        {p.confidence >= 0.7 ? 'Высокая' : 'Низкая'} ({Math.round(p.confidence * 100)}%)
                      </td>
                      <td style={{ padding: '10px 14px', color: p.is_anomaly ? 'var(--color-anomaly)' : 'var(--color-normal)', fontWeight: p.is_anomaly ? 600 : 400 }}>
                        {p.is_anomaly ? 'Да' : 'Нет'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Блок 6 — EDA: Scatter осадки vs урожайность */}
        <div style={{ ...card, marginBottom: '20px' }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
            EDA: Зависимость урожайности от осадков
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Корреляция: осадки ↔ урожай {(() => {
              const r = pearson(HISTORY_DATA.map(d => d.precip_mm), HISTORY_DATA.map(d => d.yield_ctha))
              return <strong style={{ color: r > 0.5 ? 'var(--color-normal)' : r > 0 ? 'var(--color-warning)' : 'var(--color-anomaly)' }}>r = {r}</strong>
            })()}
            {' · '}температура ↔ урожай {(() => {
              const r = pearson(HISTORY_DATA.map(d => d.avg_temp), HISTORY_DATA.map(d => d.yield_ctha))
              return <strong style={{ color: r < -0.5 ? 'var(--color-anomaly)' : 'var(--color-warning)' }}>r = {r}</strong>
            })()}
          </div>

          {/* Correlation cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Осадки → Урожай',     xs: HISTORY_DATA.map(d => d.precip_mm),     ys: HISTORY_DATA.map(d => d.yield_ctha), positive: true },
              { label: 'Температура → Урожай', xs: HISTORY_DATA.map(d => d.avg_temp),       ys: HISTORY_DATA.map(d => d.yield_ctha), positive: false },
              { label: 'Жарких дней → Урожай', xs: HISTORY_DATA.map(d => d.hot_days),       ys: HISTORY_DATA.map(d => d.yield_ctha), positive: false },
              { label: 'Водный баланс → Урожай', xs: HISTORY_DATA.map(d => d.water_balance), ys: HISTORY_DATA.map(d => d.yield_ctha), positive: true },
            ].map(({ label, xs, ys }) => {
              const r = pearson(xs, ys)
              const abs = Math.abs(r)
              const color = abs > 0.7 ? (r > 0 ? '#16a34a' : '#ef4444') : abs > 0.4 ? '#f59e0b' : '#9ca3af'
              const strength = abs > 0.7 ? 'Сильная' : abs > 0.4 ? 'Умеренная' : 'Слабая'
              return (
                <div key={label} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color, lineHeight: 1 }}>r = {r}</div>
                  <div style={{ fontSize: 11, color, marginTop: 3, fontWeight: 500 }}>{strength} {r > 0 ? 'положительная' : 'отрицательная'}</div>
                </div>
              )
            })}
          </div>

          {/* Scatter chart */}
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 8, right: 24, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="x" name="Осадки" unit=" мм" type="number" domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#6b7c6e' }} axisLine={false} tickLine={false}
                label={{ value: 'Осадки, мм', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis
                dataKey="y" name="Урожайность" unit=" ц" type="number" domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#6b7c6e' }} axisLine={false} tickLine={false} width={46}
              />
              <ZAxis range={[60, 60]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  return (
                    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>{d.year}</div>
                      <div>Осадки: {d.x} мм</div>
                      <div>Урожайность: {d.y} ц/га</div>
                    </div>
                  )
                }}
              />
              <Scatter
                data={HISTORY_DATA.map(d => ({ x: d.precip_mm, y: d.yield_ctha, year: d.year, wb: d.water_balance }))}
                fill="#4caf50"
              >
                {HISTORY_DATA.map((d, i) => (
                  <Cell key={i} fill={d.water_balance >= 0 ? '#4caf50' : d.water_balance > -50 ? '#f59e0b' : '#ef4444'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, flexWrap: 'wrap' }}>
            <span><span style={{ color: '#4caf50', fontWeight: 700 }}>●</span> Положительный водный баланс</span>
            <span><span style={{ color: '#f59e0b', fontWeight: 700 }}>●</span> Умеренный дефицит</span>
            <span><span style={{ color: '#ef4444', fontWeight: 700 }}>●</span> Сильный дефицит</span>
          </div>
        </div>

        {/* Блок 7 — EDA: Распределение урожайности */}
        <div style={{ ...card, marginBottom: '20px' }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
            EDA: Распределение урожайности по диапазонам
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Количество сезонов в каждом диапазоне ц/га · 2016–2025
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart
              data={[
                { range: '<30',   count: HISTORY_DATA.filter(d => d.yield_ctha < 30).length,             fill: '#ef4444' },
                { range: '30–35', count: HISTORY_DATA.filter(d => d.yield_ctha >= 30 && d.yield_ctha < 35).length, fill: '#f59e0b' },
                { range: '35–40', count: HISTORY_DATA.filter(d => d.yield_ctha >= 35 && d.yield_ctha < 40).length, fill: '#4caf50' },
                { range: '40–45', count: HISTORY_DATA.filter(d => d.yield_ctha >= 40 && d.yield_ctha < 45).length, fill: '#16a34a' },
                { range: '45+',   count: HISTORY_DATA.filter(d => d.yield_ctha >= 45).length,             fill: '#1a4d2e' },
              ]}
              margin={{ top: 8, right: 24, bottom: 0, left: 0 }}
            >
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7c6e' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                formatter={v => [`${v} сезон${v === 1 ? '' : v < 5 ? 'а' : 'ов'}`, 'Количество']}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                {[
                  { range: '<30',   fill: '#ef4444' },
                  { range: '30–35', fill: '#f59e0b' },
                  { range: '35–40', fill: '#4caf50' },
                  { range: '40–45', fill: '#16a34a' },
                  { range: '45+',   fill: '#1a4d2e' },
                ].map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Блок 8 — Метрики ML-модели */}
        <div style={{ ...card, marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>
                Метрики ML-модели
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Gradient Boosting Regressor · Train/Test: 80% / 20% · Датасет: 12 450 записей
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(76,175,80,0.12)', color: 'var(--color-normal)', fontWeight: 600 }}>
                Аномалий в датасете: 847 (6.8%)
              </span>
            </div>
          </div>

          {/* Metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, margin: '20px 0' }}>
            {ML_METRICS.map(m => (
              <div key={m.label} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: m.color, lineHeight: 1 }}>
                  {m.value}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2 }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{m.desc}</div>
              </div>
            ))}
          </div>

          {/* Feature importance */}
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)', marginBottom: 12 }}>Важность признаков</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FEATURE_IMPORTANCE.map(f => (
              <div key={f.feature}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{f.feature}</span>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{f.pct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${f.pct}%`,
                    background: f.color, borderRadius: 4,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}
