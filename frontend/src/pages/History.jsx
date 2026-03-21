import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, CartesianGrid, Legend,
} from 'recharts'
import Navbar from '../components/Navbar'
import { HISTORY_DATA } from '../mockData'
import { fetchPredictions } from '../api/client'
import { useFields } from '../hooks/useFields'

const card = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '24px',
  marginBottom: '20px',
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
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#1d4ed8' }}>Урожайность: <b>{d?.yield_ctha} ц/га</b></div>
      <div style={{ color: '#3b82f6' }}>Осадки: {d?.precip_mm} мм</div>
      <div style={{ color: d?.hot_days > 20 ? '#ef4444' : '#6b7c6e' }}>Жарких дней: {d?.hot_days}</div>
    </div>
  )
}

function PrecipTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, marginBottom: 6 }}>{label}</div>
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
    fetchPredictions(selectedFieldId).then(data => {
      if (data && Array.isArray(data)) setPredictions(data)
      else setPredictions([])
    })
  }, [selectedFieldId])

  const avgYield = useMemo(() =>
    +(HISTORY_DATA.reduce((s, d) => s + d.yield_ctha, 0) / HISTORY_DATA.length).toFixed(1),
  [])
  const best  = useMemo(() => HISTORY_DATA.reduce((a, b) => a.yield_ctha > b.yield_ctha ? a : b), [])
  const worst = useMemo(() => HISTORY_DATA.reduce((a, b) => a.yield_ctha < b.yield_ctha ? a : b), [])

  const analysis = selectedYear ? HISTORY_DATA.find(d => d.year === selectedYear) : null

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 48px' }}>

        <h1 style={{ fontSize: 22, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: 4 }}>
          Исторический анализ
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 28 }}>
          Урожайность и погодные условия 2016–2025 · Ростовская область
        </p>

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
                stroke="#1d4ed8" strokeWidth={2.5}
                dot={{ r: 5, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
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
                        {new Date(p.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1d4ed8' }}>{p.yield_prediction} ц/га</td>
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

      </div>
    </>
  )
}
