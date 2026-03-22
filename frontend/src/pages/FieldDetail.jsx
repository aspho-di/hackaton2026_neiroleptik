import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { getMockForecastForField } from '../mockData'
import { fetchForecast, fetchCurrentWeather, deleteField, updateField, fetchSensorData, validateSensorData, fetchIrrigationRecommend, saveSensorData } from '../api/client'

import { useFields } from '../hooks/useFields'
import { IconDroplet, IconThermometer, IconSun, IconTrendingUp, IconWarning, IconCheck, IconX, IconArrowLeft, IconChevronDown, IconZap, IconPencil } from '../components/icons/Icons'
import Toast from '../components/Toast'
import WheatEmoji from '../components/icons/WheatEmoji'
import AnomalyAlert from '../components/AnomalyAlert'
import PrecipChart from '../components/PrecipChart'
import StatusBadge from '../components/StatusBadge'
import SensorForm from '../components/SensorForm'
import CropSVG from '../components/CropSVG'
import { CROP_LABEL, CROPS } from '../constants/districts'
import { saveFields, loadSavedFields } from '../components/AddFieldModal'
import { getUser } from '../auth'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const DEFAULT_ET0 = 4.0

const STATUS_BG = {
  normal:  'var(--color-surface)',
  warning: 'var(--color-surface)',
  anomaly: 'var(--color-surface)',
}

// ── Water balance ─────────────────────────────────────────────────────────────
function BalanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: 'var(--color-text)' }}>{label}</div>
      <div style={{ color: v >= 0 ? '#16a34a' : '#dc2626' }}>{v > 0 ? '+' : ''}{v} мм</div>
    </div>
  )
}

function BalanceDot({ cx, cy, value }) {
  if (cx == null || cy == null) return null
  return <circle cx={cx} cy={cy} r={4} fill={value >= 0 ? '#22c55e' : '#ef4444'} stroke="#fff" strokeWidth={1.5} />
}

function WaterBalanceChart({ precip, et0, irrigation }) {
  const data = precip.slice(0, 7).map((p, i) => ({
    day: DAYS[i],
    balance: +(p - (et0?.[i] ?? DEFAULT_ET0)).toFixed(1),
  }))
  const avgEt0 = et0 ? (et0.slice(0, 7).reduce((s, v) => s + v, 0) / Math.min(et0.length, 7)) : DEFAULT_ET0
  const avg  = data.reduce((s, d) => s + d.balance, 0) / data.length
  const lineColor = avg >= 0 ? '#22c55e' : '#ef4444'

  const needsWater = irrigation?.irrigate === true
  const irrColor   = needsWater ? '#f59e0b' : '#22c55e'
  const irrBg      = needsWater ? '#fffbeb' : '#f0fdf4'
  const irrBorder  = needsWater ? '#fde68a' : '#bbf7d0'

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '20px 20px 16px',
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
    }}>
      <div style={{ marginBottom: 14, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: 2 }}>Водный баланс</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Осадки − ET₀ ({avgEt0.toFixed(1)} мм/день ср.) по дням</div>
      </div>

      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7c6e' }} unit=" мм" width={46} axisLine={false} tickLine={false} />
          <Tooltip content={<BalanceTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} />
          <Line type="monotone" dataKey="balance" stroke={lineColor} strokeWidth={2.5} dot={<BalanceDot />} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>

      {/* Рекомендация по поливу */}
      {irrigation && (
        <div style={{
          marginTop: 14, padding: '12px 14px',
          background: irrBg, border: `1px solid ${irrBorder}`,
          borderRadius: 10, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: needsWater ? 8 : 0 }}>
            <IconDroplet size={15} color={irrColor} />
            <span style={{ fontSize: 13, fontWeight: 700, color: irrColor, fontFamily: 'Montserrat, sans-serif' }}>
              {needsWater ? 'Требуется полив' : 'Полив не нужен'}
            </span>
          </div>
          {needsWater && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px' }}>
              {irrigation.amount_mm != null && (
                <div style={{ fontSize: 12, color: 'var(--color-text)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Объём: </span>
                  <b style={{ fontFamily: 'Montserrat, sans-serif' }}>{irrigation.amount_mm} мм</b>
                </div>
              )}
              {irrigation.when && (
                <div style={{ fontSize: 12, color: 'var(--color-text)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Дата: </span>
                  <b style={{ fontFamily: 'Montserrat, sans-serif' }}>{irrigation.when}</b>
                </div>
              )}
              {irrigation.rain_next_days_mm != null && (
                <div style={{ fontSize: 12, color: 'var(--color-text)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Осадки 2–3 дня: </span>
                  <b>{irrigation.rain_next_days_mm} мм</b>
                </div>
              )}
            </div>
          )}
          {irrigation.reason && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.5 }}>
              {irrigation.reason}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── WeatherSummary ────────────────────────────────────────────────────────────
function WeatherSummaryRow({ summary }) {
  const { avg_temp, total_precip_mm, hot_days, water_balance } = summary
  const wbColor = water_balance >= 0 ? 'var(--color-normal)' : 'var(--color-anomaly)'
  const items = [
    avg_temp        != null && { icon: <IconThermometer size={16} color="#c2410c" />, label: 'Средняя темп.', value: `${avg_temp}°C`, color: avg_temp > 30 ? '#c2410c' : 'var(--color-text)' },
    total_precip_mm != null && { icon: <IconDroplet     size={16} color="#1d4ed8" />, label: 'Осадки (7 дн)', value: `${total_precip_mm} мм`, color: 'var(--color-text)' },
    hot_days        != null && { icon: <IconSun         size={16} color="#f59e0b" />, label: 'Жарких дней',   value: hot_days, color: hot_days > 5 ? '#f59e0b' : 'var(--color-text)' },
    water_balance   != null && { icon: <IconTrendingUp  size={16} color={wbColor} />, label: 'Водный баланс', value: `${water_balance > 0 ? '+' : ''}${water_balance} мм`, color: wbColor },
  ].filter(Boolean)
  const cols = items.length
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 20 }}>
      {items.map(({ icon, label, value, color }) => (
        <div key={label} style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flexShrink: 0 }}>{icon}</div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color }}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, hint }) {
  return (
    <div style={{ background: bg || 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '14px 16px' }}>
      <div style={{ marginBottom: 4, display: 'flex' }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: color || 'var(--color-text)' }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{hint}</div>}
    </div>
  )
}

// ── YieldCard ─────────────────────────────────────────────────────────────────
function YieldCard({ forecast }) {
  const { yield_ctha, yield_ctha_float, yield_label, yield_threshold, model_cv_accuracy, confidence } = forecast

  // yield_ctha — бинарный результат ML: 0 (низкий) или 1 (хороший)
  // Если числовое значение недоступно — выводим из yield_label
  const hasML   = yield_ctha === 0 || yield_ctha === 1
  const isGood  = hasML
    ? yield_ctha === 1
    : yield_label === 'хороший' ? true : yield_label === 'низкий' ? false : null
  const confNum = typeof confidence === 'number' ? confidence : null
  const isMock  = forecast._source !== 'ml'

  const accentColor = isGood === false ? 'var(--color-anomaly)' : isGood === true ? 'var(--color-normal)' : 'var(--color-text-muted)'
  const bgColor     = isGood === false ? '#fef2f2' : 'var(--color-accent-light)'
  const borderColor = isGood === false ? '#fca5a5' : 'var(--color-border)'

  // Вердикт
  const verdict = yield_label
    ? (yield_label === 'хороший' ? 'Хороший урожай' : 'Низкий урожай')
    : isGood === true ? 'Хороший урожай' : isGood === false ? 'Низкий урожай' : 'Нет данных'

  // Ожидаемая урожайность: реальный float от ML или диапазон из порога
  const thr = yield_threshold ?? 35
  const spread = confNum != null ? Math.round((confNum - 0.5) * 24) : 5
  const yieldDisplay = yield_ctha_float != null
    ? `${yield_ctha_float} ц/га`
    : isGood === true
    ? `${thr}–${thr + spread} ц/га`
    : isGood === false
    ? `${Math.max(0, thr - spread)}–${thr} ц/га`
    : null

  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '16px 18px' }}>

      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <WheatEmoji size={18} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>
            Прогноз урожайности
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {isGood !== null && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: '2px 9px', borderRadius: 12,
              background: isGood ? '#dcfce7' : '#fee2e2',
              color: isGood ? '#15803d' : '#b91c1c',
              border: `1px solid ${isGood ? '#86efac' : '#fca5a5'}`,
            }}>
              {isGood ? '1 — хороший' : '0 — низкий'}
            </span>
          )}
          {isMock && (
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: '#fffbeb', color: '#92400e', fontWeight: 600 }}>
              демо-данные
            </span>
          )}
        </div>
      </div>

      {/* Главный вердикт */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: accentColor, marginBottom: 3 }}>
          {verdict}
        </div>
        {yieldDisplay && (
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            ожидается{' '}
            <b style={{ color: accentColor, fontFamily: 'Montserrat, sans-serif' }}>{yieldDisplay}</b>
          </div>
        )}
        {yield_threshold != null && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
            порог бинаризации: {isGood ? '≥' : '<'} {yield_threshold} ц/га
          </div>
        )}
      </div>

      {/* Уверенность модели */}
      {confNum != null && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 4 }}>
            <span>Уверенность прогноза</span>
            <span style={{ fontWeight: 700, color: accentColor }}>
              {Math.round(confNum * 100)}%
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: `${Math.round(confNum * 100)}%`,
              background: accentColor,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* Точность CV */}
      {model_cv_accuracy != null && (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          Точность модели (CV): <b style={{ color: 'var(--color-text)' }}>{Math.round(model_cv_accuracy * 100)}%</b>
        </div>
      )}
    </div>
  )
}

// ── WhatIfSection ─────────────────────────────────────────────────────────────
function WhatIfSection({ baseYield }) {
  const [open, setOpen]               = useState(false)
  const [precipChange, setPrecipChange] = useState(0)
  const [tempChange,   setTempChange]   = useState(0)

  const precipEffect   = (precipChange / 100) * 8
  const tempEffect     = tempChange * (-1.2)
  const base           = baseYield ?? 0
  const adjustedYield  = +(base + precipEffect + tempEffect).toFixed(1)
  const delta          = +(adjustedYield - base).toFixed(1)
  const deltaColor     = delta >= 0 ? 'var(--color-normal)' : 'var(--color-anomaly)'

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', textAlign: 'left',
          background: 'none', border: 'none',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', fontSize: 14, fontWeight: 600,
          fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)',
        }}
      >
        <span>Сценарий: что если?</span>
        <span style={{ transition: 'transform 0.2s', display: 'inline-flex', transform: open ? 'rotate(180deg)' : 'none' }}><IconChevronDown size={14} color="var(--color-text-muted)" /></span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Precip slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 8 }}>
                <span>Осадки июля</span>
                <span style={{ color: precipChange >= 0 ? 'var(--color-normal)' : 'var(--color-anomaly)', fontWeight: 700 }}>
                  {precipChange > 0 ? '+' : ''}{precipChange}% от нормы (45 мм)
                </span>
              </div>
              <input type="range" min="-50" max="50" step="5" value={precipChange}
                onChange={e => setPrecipChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                <span>−50%</span><span>0%</span><span>+50%</span>
              </div>
            </div>

            {/* Temp slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 8 }}>
                <span>Температура июля</span>
                <span style={{ color: tempChange > 0 ? 'var(--color-anomaly)' : tempChange < 0 ? 'var(--color-normal)' : 'var(--color-text)', fontWeight: 700 }}>
                  {tempChange > 0 ? '+' : ''}{tempChange}°C от нормы
                </span>
              </div>
              <input type="range" min="-5" max="5" step="0.5" value={tempChange}
                onChange={e => setTempChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                <span>−5°C</span><span>0°C</span><span>+5°C</span>
              </div>
            </div>

            {/* Result */}
            <div style={{
              background: delta >= 0 ? '#f0fdf4' : '#fff1f0',
              border: `1px solid ${delta >= 0 ? '#bbf7d0' : '#fca5a5'}`,
              borderRadius: 8, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontSize: 13, color: 'var(--color-text)' }}>
                При осадках <b>{precipChange > 0 ? '+' : ''}{precipChange}%</b> и температуре <b>{tempChange > 0 ? '+' : ''}{tempChange}°C</b>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: deltaColor }}>
                  {adjustedYield} ц/га
                </div>
                <div style={{ fontSize: 11, color: deltaColor, fontWeight: 600 }}>
                  {delta >= 0 ? '+' : ''}{delta} ц/га
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ApiSensorPanel ────────────────────────────────────────────────────────────
const API_FIELDS = [
  { key: 'humidity',         label: 'Влажность воздуха', unit: '%' },
  { key: 'soil_moisture',    label: 'Влажность почвы',   unit: '%' },
  { key: 'soil_temperature', label: 'Темп. почвы',       unit: '°C' },
  { key: 'temperature',      label: 'Темп. воздуха',     unit: '°C' },
  { key: 'wind_speed',       label: 'Ветер',             unit: 'м/с' },
]

const DEFAULT_CONFIG = {
  url: '',
  method: 'GET',
  token: '',
  mapping: { humidity: '', soil_moisture: '', soil_temperature: '', temperature: '', wind_speed: '' },
}

function resolvePath(obj, path) {
  if (!path) return undefined
  return path.split('.').reduce((cur, key) => cur?.[key], obj)
}

function loadApiConfig(fieldId) {
  try { return JSON.parse(localStorage.getItem(`sensor_api_config_${fieldId}`)) || DEFAULT_CONFIG } catch { return DEFAULT_CONFIG }
}

function saveApiConfig(fieldId, cfg) {
  try { localStorage.setItem(`sensor_api_config_${fieldId}`, JSON.stringify(cfg)) } catch {}
}

const cfgInputStyle = {
  width: '100%', padding: '7px 10px', border: '1px solid var(--color-border)',
  borderRadius: 6, fontSize: 12, background: 'var(--color-bg)',
  color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
}

function ApiSensorPanel({ fieldId, crop, onResult }) {
  const [data,        setData]        = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [calcLoading, setCalcLoading] = useState(false)
  const [error,       setError]       = useState(null)
  const [result,      setResult]      = useState(null)
  const [fetchedAt,   setFetchedAt]   = useState(null)
  const [showCfg,     setShowCfg]     = useState(false)
  const [cfg,         setCfg]         = useState(() => loadApiConfig(fieldId))
  const [cfgDraft,    setCfgDraft]    = useState(() => loadApiConfig(fieldId))

  const hasCustomUrl = Boolean(cfg.url?.trim())

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let record
      if (hasCustomUrl) {
        const headers = { 'Content-Type': 'application/json' }
        if (cfg.token?.trim()) headers['Authorization'] = `Bearer ${cfg.token.trim()}`
        const res  = await fetch(cfg.url.trim(), { method: cfg.method || 'GET', headers })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const raw  = Array.isArray(json) ? json[json.length - 1] : json
        // Apply field mapping
        const mapped = {}
        for (const key of Object.keys(DEFAULT_CONFIG.mapping)) {
          const path = cfg.mapping?.[key]
          mapped[key] = path?.trim() ? resolvePath(raw, path.trim()) : raw[key]
        }
        record = mapped
      } else {
        const res = await fetchSensorData(fieldId)
        record = Array.isArray(res) ? res[res.length - 1] : res
      }
      if (!record) throw new Error('empty')
      setData(record)
      setFetchedAt(new Date())
    } catch {
      setError(hasCustomUrl
        ? 'Не удалось получить данные с вашего API. Проверьте URL и настройки.'
        : 'Нет данных с датчика. Проверьте подключение к API (:8080).')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [fieldId, hasCustomUrl, cfg])

  useEffect(() => { fetchData() }, [fetchData])

  function openCfg() {
    setCfgDraft({ ...cfg, mapping: { ...cfg.mapping } })
    setShowCfg(true)
  }

  function saveCfg() {
    setCfg(cfgDraft)
    saveApiConfig(fieldId, cfgDraft)
    setShowCfg(false)
  }

  function resetCfg() {
    const blank = { ...DEFAULT_CONFIG, mapping: { ...DEFAULT_CONFIG.mapping } }
    setCfg(blank)
    setCfgDraft(blank)
    saveApiConfig(fieldId, blank)
    setShowCfg(false)
  }

  async function handleCalc() {
    if (!data) return
    setCalcLoading(true)
    setResult(null)
    try {
      const soil_moisture    = data.soil_moisture ?? 0
      const soil_temperature = data.soil_temperature ?? data.temperature ?? 20
      const air_temperature  = data.temperature ?? 20
      const wind_speed       = data.wind_speed ?? 0
      const humidity         = data.humidity ?? 0

      await validateSensorData({ field_id: fieldId, crop_type: crop, soil_moisture, soil_temperature, air_temperature, humidity_air: humidity, wind_speed })
      const irrigation = await fetchIrrigationRecommend(fieldId, crop, soil_moisture, soil_temperature, air_temperature, humidity, wind_speed)
      setResult(irrigation)
      onResult?.({ irrigation, soil_moisture, air_temperature, wind_speed })

      try {
        const key  = `sensor_history_${fieldId}`
        const prev = JSON.parse(localStorage.getItem(key) || '[]')
        prev.push({ ts: new Date().toISOString(), humidity, soil_moisture, soil_temperature, air_temperature, wind_speed, is_anomaly: irrigation?.is_anomaly ?? false, irrigate: irrigation?.irrigate ?? false, amount_mm: irrigation?.amount_mm ?? null })
        localStorage.setItem(key, JSON.stringify(prev.slice(-50)))
      } catch {}
    } catch {
      setError('Не удалось выполнить расчёт.')
    } finally {
      setCalcLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '20px 24px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)' }}>
            Данные с датчика
          </span>
          {hasCustomUrl && (
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600, background: '#eff6ff', color: '#3b82f6' }}>
              свой API
            </span>
          )}
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600,
            background: data ? '#f0fdf4' : error ? '#fef2f2' : '#fffbeb',
            color: data ? 'var(--color-normal)' : error ? 'var(--color-anomaly)' : 'var(--color-warning)',
          }}>
            {loading ? 'Загрузка...' : data ? 'Получены' : error ? 'Нет связи' : '—'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {fetchedAt && !loading && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              обновлено в {fetchedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {/* Settings button */}
          <button
            onClick={() => showCfg ? setShowCfg(false) : openCfg()}
            title="Настроить источник данных"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              border: `1px solid ${showCfg ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: showCfg ? 'var(--color-accent-light)' : 'var(--color-surface)',
              color: showCfg ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            API
          </button>
          <button
            onClick={fetchData} disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              border: '1px solid var(--color-border)', background: 'var(--color-surface)',
              color: 'var(--color-text-muted)', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)' } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}>
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Обновить
          </button>
        </div>
      </div>

      {/* Config panel */}
      {showCfg && (
        <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', marginBottom: 14, fontFamily: 'Montserrat, sans-serif' }}>
            Настройка источника данных датчика
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>URL датчика</label>
              <input
                style={cfgInputStyle}
                placeholder="https://my-sensor.example.com/api/data"
                value={cfgDraft.url}
                onChange={e => setCfgDraft(p => ({ ...p, url: e.target.value }))}
                onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Метод</label>
              <select
                style={{ ...cfgInputStyle, cursor: 'pointer' }}
                value={cfgDraft.method}
                onChange={e => setCfgDraft(p => ({ ...p, method: e.target.value }))}
              >
                <option>GET</option>
                <option>POST</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, display: 'block', marginBottom: 4 }}>Bearer-токен (опционально)</label>
            <input
              style={cfgInputStyle}
              type="password"
              placeholder="eyJhbGciOi..."
              value={cfgDraft.token}
              onChange={e => setCfgDraft(p => ({ ...p, token: e.target.value }))}
              onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
            />
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Маппинг полей (JSON-путь, напр. data.sensors.moisture)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 14 }}>
            {API_FIELDS.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500, display: 'block', marginBottom: 3 }}>
                  {f.label}
                </label>
                <input
                  style={cfgInputStyle}
                  placeholder={f.key}
                  value={cfgDraft.mapping?.[f.key] ?? ''}
                  onChange={e => setCfgDraft(p => ({ ...p, mapping: { ...p.mapping, [f.key]: e.target.value } }))}
                  onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={saveCfg}
              style={{
                padding: '7px 18px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: 'var(--color-accent)', color: '#fff', border: 'none',
                cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
              }}
            >
              Сохранить
            </button>
            <button
              onClick={() => setShowCfg(false)}
              style={{
                padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                background: 'var(--color-surface)', color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)', cursor: 'pointer',
              }}
            >
              Отмена
            </button>
            {hasCustomUrl && (
              <button
                onClick={resetCfg}
                style={{
                  padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                  background: '#fef2f2', color: 'var(--color-anomaly)',
                  border: '1px solid #fecaca', cursor: 'pointer', marginLeft: 'auto',
                }}
              >
                Сбросить к умолчанию
              </button>
            )}
          </div>
        </div>
      )}

      {/* Values grid */}
      {data ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
          {API_FIELDS.map(f => {
            const val = data[f.key]
            return (
              <div key={f.key} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: val != null ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
                  {val != null ? `${val}${f.unit}` : '—'}
                </div>
              </div>
            )
          })}
        </div>
      ) : error ? (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: 'var(--color-anomaly)', marginBottom: 16 }}>
          {error}
        </div>
      ) : (
        <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16, textAlign: 'center' }}>
          Загрузка данных датчика...
        </div>
      )}

      {/* Calc button */}
      {data && (
        <button
          onClick={handleCalc} disabled={calcLoading}
          style={{
            background: calcLoading ? 'var(--color-text-muted)' : 'var(--color-accent)',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 28px', fontSize: 14, fontWeight: 600,
            fontFamily: 'Montserrat, sans-serif',
            cursor: calcLoading ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (!calcLoading) e.currentTarget.style.background = 'var(--color-accent-hover)' }}
          onMouseLeave={e => { if (!calcLoading) e.currentTarget.style.background = 'var(--color-accent)' }}
        >
          {calcLoading ? 'Расчёт...' : 'Рассчитать'}
        </button>
      )}

      {/* Result */}
      {result && (() => {
        const isAnomaly  = result.is_anomaly === true || result.status === 'anomaly'
        const showAlert  = result.status === 'anomaly' || result.confidence === 'low'
        const cardBg     = isAnomaly ? '#fef2f2' : result.irrigate ? '#fffbeb' : '#f0fdf4'
        const cardBorder = isAnomaly ? '#fecaca' : result.irrigate ? '#fde68a' : '#bbf7d0'
        const cardAccent = isAnomaly ? 'var(--color-anomaly)' : result.irrigate ? 'var(--color-warning)' : 'var(--color-normal)'
        const cardIcon   = isAnomaly ? <IconWarning size={14} color={cardAccent} /> : result.irrigate ? <IconDroplet size={14} color={cardAccent} /> : <IconCheck size={14} color={cardAccent} />
        const cardText   = isAnomaly ? 'Аномалия' : result.irrigate ? 'Требуется полив' : 'Полив не нужен'
        return (
          <div style={{ marginTop: 20 }}>
            {showAlert && <AnomalyAlert message={result.message} anomalies={result.anomalies} />}
            {isAnomaly && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', marginBottom: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: 'var(--color-anomaly)', fontWeight: 600 }}>
                <IconWarning size={14} color="var(--color-anomaly)" />
                Запись помечена флагом is_anomaly — данные отправлены на проверку
              </div>
            )}
            <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderLeft: `4px solid ${cardAccent}`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                {cardIcon}
                <div style={{ fontWeight: 700, color: cardAccent, fontFamily: 'Montserrat, sans-serif', fontSize: 14 }}>{cardText}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                <MiniStat label="Нужен полив" value={
                  result.irrigate
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconCheck size={13} color="var(--color-normal)" /> Да</span>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconX size={13} color="var(--color-anomaly)" /> Нет</span>
                } color={result.irrigate ? 'var(--color-normal)' : 'var(--color-anomaly)'} />
                {result.irrigate && result.amount_mm != null && <MiniStat label="Рекомендуется" value={`${result.amount_mm} мм`} />}
                {result.when && <MiniStat label="Дата" value={result.when} />}
                {result.rain_next_days_mm != null && <MiniStat label="Осадки 2–3 дня" value={`${result.rain_next_days_mm} мм`} />}
                {result.irrigation_volume != null && result.amount_mm != null && (
                  <MiniStat label="Факт / Рекоменд." value={
                    <span style={{ color: result.irrigation_volume < result.amount_mm ? 'var(--color-warning)' : 'var(--color-normal)' }}>
                      {result.irrigation_volume} / {result.amount_mm} мм
                    </span>
                  } />
                )}
              </div>
              {result.reason && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{result.reason}</div>}
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
          </div>
        )
      })()}
    </div>
  )
}

function MiniStat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, fontWeight: 500 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'Montserrat, sans-serif', color: color || 'var(--color-text)' }}>{value}</div>
    </div>
  )
}

// ── EditFieldModal ─────────────────────────────────────────────────────────────
function EditFieldModal({ field, onClose, onSaved }) {
  const titlePart = field.name.replace(/^Участок\s+\d+\s*[—-]\s*/i, '')
  const [form, setForm] = useState({
    title: titlePart,
    crop:  field.crop ?? 'wheat',
    area:  field.area != null ? String(field.area) : '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setError('Введите название'); return }
    setSaving(true)
    setError('')
    const newName = `Участок ${field.field_id} — ${form.title.trim()}`
    const payload = {
      name:          newName,
      crop_type:     form.crop,
      area_hectares: form.area !== '' ? Number(form.area) : (field.area ?? 100),
      latitude:      field.latitude  ?? 46.85,
      longitude:     field.longitude ?? 40.31,
      user_id:       getUser()?.id ?? 1,
    }
    try {
      await updateField(field.field_id, payload)
    } catch { /* backend unavailable — still update localStorage */ }

    // Update localStorage regardless of backend result
    const updated = { ...field, name: newName, crop: form.crop, area: form.area !== '' ? Number(form.area) : field.area }
    const allFields = loadSavedFields()
    saveFields(allFields.map(f => f.field_id === field.field_id ? updated : f))

    setSaving(false)
    onSaved(updated)
    onClose()
  }

  const inp = {
    width: '100%', padding: '9px 12px', border: '1px solid var(--color-border)',
    borderRadius: 8, fontSize: 14, outline: 'none',
    background: 'var(--color-surface)', color: 'var(--color-text)',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const focus = {
    onFocus: e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.12)' },
    onBlur:  e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' },
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-surface)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxWidth: 460, width: '100%', padding: '28px 28px 24px', animation: 'fadeIn 0.2s ease' }}>
        <h2 style={{ fontSize: 17, color: 'var(--color-text)', marginBottom: 20 }}>Редактировать участок</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
              Название <span style={{ color: 'var(--color-anomaly)' }}>*</span>
              <input style={inp} {...focus} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Северный" />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                Культура
                <select style={{ ...inp, cursor: 'pointer' }} {...focus} value={form.crop} onChange={e => setForm(p => ({ ...p, crop: e.target.value }))}>
                  {CROPS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>
                Площадь, га
                <input style={inp} {...focus} type="number" min="0" step="0.1" placeholder="250" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} />
              </label>
            </div>
          </div>

          {error && <div style={{ color: 'var(--color-anomaly)', fontSize: 13, marginTop: 10 }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
              Отмена
            </button>
            <button type="submit" disabled={saving} style={{ background: 'var(--color-accent)', border: 'none', borderRadius: 8, padding: '9px 24px', fontSize: 14, fontWeight: 600, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'Montserrat, sans-serif', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FieldDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fieldId  = Number(id)

  const { fields: allFields, loading: fieldsLoading } = useFields()
  const [forecast,        setForecast]        = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [sensorResult,    setSensorResult]    = useState(null)
  const [weatherData,     setWeatherData]     = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError,     setDeleteError]     = useState('')
  const [showEditModal,   setShowEditModal]   = useState(false)
  const [editedField,     setEditedField]     = useState(null)
  const [dataMode,        setDataMode]        = useState('manual')
  const field = editedField ?? allFields.find(f => f.field_id === fieldId) // 'manual' | 'api'

  async function handleDelete() {
    await deleteField(field.field_id)
    const saved   = JSON.parse(localStorage.getItem('fields') || '[]')
    const updated = saved.filter(f => f.field_id !== field.field_id)
    localStorage.setItem('fields', JSON.stringify(updated))
    navigate('/dashboard')
  }

  useEffect(() => {
    if (fieldsLoading) return
    let cancelled = false
    setLoading(true)
    setSensorResult(null)

    const lat = field?.latitude  ?? 46.85
    const lon = field?.longitude ?? 40.31

    async function load() {
      // Прогноз и погода загружаются независимо.
      // fetchForecast уже имеет таймаут 8с внутри.
      // fetchCurrentWeather может зависнуть — даём ей 10с, после чего null.
      const weatherPromise = Promise.race([
        fetchCurrentWeather(lat, lon),
        new Promise(resolve => setTimeout(() => resolve(null), 10000)),
      ])

      // Сначала грузим прогноз — он критичен для отображения
      let forecastData = null
      try {
        forecastData = await fetchForecast(fieldId, lat, lon, field?.district)
      } catch { /* ignore */ }

      if (!cancelled) {
        const fd = forecastData ?? getMockForecastForField(fieldId)
        setForecast(fd)
        setLoading(false)

        // Сохраняем статус и урожайность в поле — чтобы Dashboard и IrrigationPlan видели актуальные данные
        if (fd) {
          const isAnom = fd.status === 'anomaly' || fd.anomaly_flag === true
          const isLow  = typeof fd.confidence === 'number' ? fd.confidence < 0.7 : fd.confidence === 'low'
          const computedStatus = isAnom ? 'anomaly' : isLow ? 'warning' : 'normal'
          const allFields = loadSavedFields()
          const updated = allFields.map(f =>
            f.field_id === fieldId
              ? { ...f, status: computedStatus }
              : f
          )
          saveFields(updated)
        }
      }

      // Погода догружается в фоне
      try {
        const weather = await weatherPromise
        if (!cancelled) setWeatherData(weather)
      } catch { /* погода не критична */ }
    }

    load()
    return () => { cancelled = true }
  }, [fieldId, fieldsLoading])

  if (fieldsLoading) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 24px 48px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[48, 300, 160].map((h, i) => (
            <div key={i} style={{
              height: h, borderRadius: 'var(--radius-card)',
              background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-accent-light) 50%, var(--color-border) 75%)',
              backgroundSize: '400% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      </div>
    )
  }

  if (!field) {
    return (
      <div style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Поле не найдено.{' '}
        <button onClick={() => navigate('/dashboard')} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          На главную
        </button>
      </div>
    )
  }

  const isAnomaly   = forecast?.status === 'anomaly' || forecast?.anomaly_flag === true
  const isLowConf   = typeof forecast?.confidence === 'number' ? forecast.confidence < 0.7 : forecast?.confidence === 'low'
  const fieldStatus = isAnomaly ? 'anomaly' : isLowConf ? 'warning' : 'normal'
  const cardGradient = STATUS_BG[fieldStatus] ?? STATUS_BG.normal
  const showAlert    = sensorResult && (sensorResult.irrigation?.confidence === 'low' || sensorResult.irrigation?.status === 'anomaly')

  return (
    <>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Back */}
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: 'inherit' }}>
          <IconArrowLeft size={14} color="var(--color-accent)" /> Все поля
        </button>

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 20, color: 'var(--color-text)', marginBottom: 3 }}>{field.name}</h1>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>ID поля: {field.field_id} · {CROP_LABEL[field.crop] ?? field.crop}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {forecast && <StatusBadge status={forecast.status} confidence={forecast.confidence} />}
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                background: 'none', border: '1px solid var(--color-border)', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                color: 'var(--color-text-muted)', cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif', transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-light)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
            >
              <IconPencil size={13} color="currentColor" /> Редактировать
            </button>
            <button
              onClick={() => { setDeleteError(''); setShowDeleteModal(true) }}
              style={{
                background: 'none', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                color: 'var(--color-anomaly)', cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              Удалить участок
            </button>
          </div>
        </div>

        {/* Delete modal */}
        {showDeleteModal && (
          <div
            onClick={() => setShowDeleteModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--color-surface)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', maxWidth: 440, width: '100%', padding: '28px 28px 24px' }}
            >
              <h2 style={{ fontSize: 17, color: 'var(--color-text)', marginBottom: 12 }}>Удалить участок?</h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Вы уверены, что хотите удалить <strong style={{ color: 'var(--color-text)' }}>{field.name}</strong>?{' '}
                Это действие необратимо.
              </p>
              {deleteError && (
                <div style={{ fontSize: 13, color: 'var(--color-anomaly)', marginBottom: 16 }}>{deleteError}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleDelete}
                  style={{ background: '#ef4444', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#dc2626' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ef4444' }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && field && (
          <EditFieldModal
            field={field}
            onClose={() => setShowEditModal(false)}
            onSaved={updated => setEditedField(updated)}
          />
        )}

        {showAlert && <AnomalyAlert message={sensorResult.irrigation?.message} anomalies={sensorResult.irrigation?.anomalies} />}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>
            {[260, 140, 180].map((h, i) => (
              <div key={i} style={{
                height: h, borderRadius: 'var(--radius-card)',
                background: 'linear-gradient(90deg, var(--color-border) 25%, var(--color-accent-light) 50%, var(--color-border) 75%)',
                backgroundSize: '400% 100%',
                animation: 'shimmer 1.4s infinite',
                opacity: 1 - i * 0.15,
              }} />
            ))}
          </div>
        ) : (
          <>
            {/* Условия сезона */}
            {forecast?.weather_summary && (
              <WeatherSummaryRow summary={forecast.weather_summary} />
            )}

            <div className="field-detail-grid">

              {/* ── ЛЕВАЯ КОЛОНКА ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Yield */}
                <YieldCard forecast={forecast} status={fieldStatus} />

                {/* Sensor quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <StatCard
                    icon={<IconDroplet size={18} color="#3b82f6" />}
                    label="Влажность почвы"
                    value={sensorResult?.soil_moisture != null ? `${sensorResult.soil_moisture}%` : '—'}
                    hint={sensorResult?.soil_moisture != null ? null : 'Введите данные'}
                    color="#3b82f6"
                  />
                  <StatCard
                    icon={<IconThermometer size={18} color="#f97316" />}
                    label="Темп. воздуха"
                    value={sensorResult?.air_temperature != null ? `${sensorResult.air_temperature}°C` : '—'}
                    hint={sensorResult?.air_temperature != null ? null : 'Введите данные'}
                    color="#f97316"
                  />
                </div>

                {/* Data mode toggle + sensor panel */}
                <div>
                  {/* Toggle */}
                  <div style={{
                    display: 'inline-flex', borderRadius: 8, overflow: 'hidden',
                    border: '1px solid var(--color-border)', marginBottom: 12,
                  }}>
                    {[
                      { key: 'manual', label: <><IconPencil size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Вручную</> },
                      { key: 'api',    label: <><IconZap size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> С датчика (API)</> },
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setDataMode(opt.key)}
                        style={{
                          padding: '7px 16px', fontSize: 12, fontWeight: 600,
                          border: 'none', cursor: 'pointer',
                          background: dataMode === opt.key ? 'var(--color-accent)' : 'var(--color-surface)',
                          color: dataMode === opt.key ? '#fff' : 'var(--color-text-muted)',
                          transition: 'all 0.15s',
                          fontFamily: 'inherit',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {dataMode === 'manual'
                    ? <SensorForm fieldId={fieldId} crop={field?.crop ?? 'wheat'} onResult={setSensorResult} />
                    : <ApiSensorPanel fieldId={fieldId} crop={field?.crop ?? 'wheat'} onResult={setSensorResult} />
                  }
                </div>

                {/* What-if: скрыт, т.к. ML-модель бинарная (0/1), числовой сценарий неприменим */}

              </div>

              {/* ── ПРАВАЯ КОЛОНКА ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

                {/* CropSVG + PrecipChart */}
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  background: cardGradient,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-card)',
                  padding: '20px 20px 16px', flexShrink: 0,
                }}>
                  <div style={{ position: 'absolute', top: 16, right: 16, opacity: 0.85 }}>
                    <CropSVG crop={field.crop} status={fieldStatus} temp={field.temp} precip={field.precip} width={80} height={80} />
                  </div>
                  <div style={{ marginBottom: 14, paddingRight: 96 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: 2 }}>Осадки на 7 дней</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{CROP_LABEL[field.crop] ?? field.crop}</div>
                  </div>
                  <PrecipChart data={weatherData?.precip_forecast_7days} height={240} />
                  {weatherData && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, textAlign: 'right' }}>
                      Данные: {weatherData.source} · обновлено в {new Date(weatherData.updated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                {/* Водный баланс — после расчёта */}
                {sensorResult && <WaterBalanceChart precip={sensorResult.precip ?? weatherData?.precip_forecast_7days ?? forecast?.precip_forecast_7days ?? []} et0={forecast?.et0_forecast_7days ?? null} irrigation={sensorResult.irrigation} />}


              </div>
            </div>
          </>
        )}
      </div>
      <Toast />
    </>
  )
}