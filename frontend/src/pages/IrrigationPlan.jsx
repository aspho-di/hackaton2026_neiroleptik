import { useState, useEffect } from 'react'
import { loadSavedFields } from '../components/AddFieldModal'
import { fetchFields } from '../api/client'
import { CROP_LABEL } from '../constants/districts'
import Toast, { showToast } from '../components/Toast'
import { IconDroplets } from '../components/icons/Icons'

const STATUS_PRIORITY = { anomaly: 1, warning: 2, normal: 3 }
const STATUS_LABELS   = { anomaly: 'Аномалия', warning: 'Внимание', normal: 'Норма' }
const STATUS_COLORS   = { anomaly: 'var(--color-anomaly)', warning: 'var(--color-warning)', normal: 'var(--color-normal)' }
const AMOUNT_BY_STATUS = { anomaly: 45, warning: 25, normal: 10 }

const card = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '24px',
}

export default function IrrigationPlan() {
  const [allFields, setAllFields] = useState(loadSavedFields)
  const [waterLimit, setWaterLimit] = useState('')
  const [plan, setPlan] = useState(null)

  useEffect(() => {
    fetchFields().then(data => {
      if (!Array.isArray(data) || !data.length) return
      const backendFields = data.map(f => ({
        field_id:  f.id,
        name:      f.name,
        crop:      f.crop_type ?? 'wheat',
        status:    'normal',
        area:      f.area_hectares,
        latitude:  f.latitude,
        longitude: f.longitude,
      }))
      const localFields = loadSavedFields()
      const backendIds  = new Set(backendFields.map(f => f.field_id))
      setAllFields([...backendFields, ...localFields.filter(f => !backendIds.has(f.field_id))])
    }).catch(() => {})
  }, [])

  const sorted = [...allFields].sort((a, b) =>
    (STATUS_PRIORITY[a.status] || 3) - (STATUS_PRIORITY[b.status] || 3)
  )

  function distribute() {
    const limit = Number(waterLimit)
    if (!limit || limit <= 0) return
    let remaining = limit
    const result = []

    for (const f of sorted) {
      const mm   = AMOUNT_BY_STATUS[f.status] || 10
      const area = f.area ?? 100
      const vol  = mm * area * 10  // 1 mm × 1 ha = 10 m³

      if (remaining <= 0) {
        result.push({ ...f, mm: 0, vol: 0, skipped: true, partial: false })
        continue
      }
      if (vol <= remaining) {
        result.push({ ...f, mm, vol, skipped: false, partial: false })
        remaining -= vol
      } else {
        const availMm = +(remaining / (area * 10)).toFixed(1)
        result.push({ ...f, mm: availMm, vol: remaining, skipped: false, partial: true })
        remaining = 0
      }
    }
    setPlan({ fields: result, used: limit - remaining, remaining: Math.max(0, remaining) })
    showToast('План полива распределён')
  }

  return (
    <>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 48px' }}>

        <h1 className="page-title">
          Оптимизация полива
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 28 }}>
          Распределение водного ресурса по участкам с учётом приоритетов
        </p>

        {/* Сводка по участкам */}
        {sorted.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Всего участков', value: sorted.length, color: 'var(--color-text)' },
              { label: 'Критических', value: sorted.filter(f => f.status === 'anomaly').length, color: 'var(--color-anomaly)' },
              { label: 'Требуют внимания', value: sorted.filter(f => f.status === 'warning').length, color: 'var(--color-warning)' },
              { label: 'Норма', value: sorted.filter(f => f.status === 'normal').length, color: 'var(--color-normal)' },
              {
                label: 'Нужно воды всего',
                value: sorted.reduce((s, f) => s + ((AMOUNT_BY_STATUS[f.status] || 10) * (f.area ?? 100) * 10), 0).toLocaleString('ru-RU') + ' м³',
                color: 'var(--color-text)',
              },
            ].map(c => (
              <div key={c.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '14px 16px' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        {sorted.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '72px 24px', textAlign: 'center',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)',
            animation: 'fadeIn 0.4s ease',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--color-accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <IconDroplets size={36} color="var(--color-accent)" />
            </div>
            <div style={{
              fontSize: 18, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
              color: 'var(--color-text)', marginBottom: 10,
            }}>
              Участки не найдены
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 300, lineHeight: 1.7 }}>
              Добавьте участки на главной странице, чтобы составить план полива
            </p>
          </div>
        )}

        {/* Форма ввода */}
        {sorted.length > 0 && <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 16 }}>
            Параметры распределения
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 24 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
              Общий ресурс воды (м³)
              <input
                type="number" min="0" placeholder="напр. 5000"
                value={waterLimit}
                onChange={e => { setWaterLimit(e.target.value); setPlan(null) }}
                onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
                style={{
                  padding: '9px 14px', border: '1px solid var(--color-border)',
                  borderRadius: 8, fontSize: 14, outline: 'none', width: 220,
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              />
            </label>
            <button
              onClick={distribute}
              disabled={!waterLimit}
              style={{
                background: waterLimit ? 'var(--color-accent)' : 'var(--color-text-muted)',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 28px', fontSize: 14, fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif',
                cursor: waterLimit ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (waterLimit) e.currentTarget.style.background = 'var(--color-accent-hover)' }}
              onMouseLeave={e => { if (waterLimit) e.currentTarget.style.background = 'var(--color-accent)' }}
            >
              Распределить
            </button>
          </div>

          {/* Таблица участков */}
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--color-text)', marginBottom: 10 }}>
            Участки (отсортированы по приоритету)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  {['Участок', 'Культура', 'Статус', 'Приоритет', 'Площадь (га)', 'Норма (мм)', 'Объём (м³)'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((f, idx) => {
                  const mm   = AMOUNT_BY_STATUS[f.status] || 10
                  const area = f.area ?? 100
                  const vol  = mm * area * 10
                  const priorityLabel = STATUS_PRIORITY[f.status] === 1 ? 'Критический' : STATUS_PRIORITY[f.status] === 2 ? 'Высокий' : 'Плановый'
                  return (
                    <tr key={f.field_id} style={{ borderBottom: '1px solid var(--color-border)', background: idx === 0 ? '#fff1f0' : 'transparent' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{f.name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)' }}>{CROP_LABEL[f.crop] ?? f.crop ?? '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: STATUS_COLORS[f.status], fontWeight: 600, fontSize: 12 }}>
                          ● {STATUS_LABELS[f.status]}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--color-text-muted)' }}>{priorityLabel}</td>
                      <td style={{ padding: '10px 14px' }}>{area}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 500 }}>{mm} мм</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{vol.toLocaleString('ru-RU')} м³</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>}

        {/* Результат распределения */}
        {sorted.length > 0 && plan && (
          <div style={{ ...card, animation: 'fadeIn 0.25s ease' }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--color-text)', marginBottom: 6 }}>
              План распределения
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <span>Использовано: <strong style={{ color: 'var(--color-text)' }}>{plan.used.toLocaleString('ru-RU')} м³</strong></span>
              <span>Остаток: <strong style={{ color: plan.remaining > 0 ? 'var(--color-normal)' : 'var(--color-text-muted)' }}>{plan.remaining.toLocaleString('ru-RU')} м³</strong></span>
              <span>Покрыто участков: <strong>{plan.fields.filter(f => !f.skipped).length}</strong> из {plan.fields.length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {plan.fields.map(f => {
                const maxVol = Math.max(...plan.fields.map(x => x.vol), 1)
                const pct    = (f.vol / maxVol) * 100
                return (
                  <div key={f.field_id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                        <span style={{ color: STATUS_COLORS[f.status], fontSize: 10 }}>●</span>
                        {f.name}
                        {f.partial && <span style={{ fontSize: 11, color: 'var(--color-warning)', fontWeight: 600 }}>(частичный)</span>}
                      </span>
                      <span style={{ color: f.skipped ? 'var(--color-text-muted)' : 'var(--color-text)', fontWeight: 600 }}>
                        {f.skipped
                          ? 'Пропущен — недостаточно ресурса'
                          : `${f.mm} мм · ${f.vol.toLocaleString('ru-RU')} м³`
                        }
                      </span>
                    </div>
                    <div style={{ height: 14, background: 'var(--color-border)', borderRadius: 7, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: f.skipped ? '#d1d5db' : STATUS_COLORS[f.status],
                        borderRadius: 7,
                        transition: 'width 0.6s ease',
                        opacity: 1,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {plan.remaining > 0 && (
              <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--color-accent-light)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, color: 'var(--color-text)' }}>
                Остаток <strong>{plan.remaining.toLocaleString('ru-RU')} м³</strong> — все участки обеспечены по норме.
              </div>
            )}
          </div>
        )}

      </div>
      <Toast />
    </>
  )
}
