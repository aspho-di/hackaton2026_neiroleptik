import { useState, useEffect } from 'react'
import { CROPS } from '../constants/districts'
import { fetchDistricts, createField } from '../api/client'
import WheatEmoji from './icons/WheatEmoji'
import { IconX } from './icons/Icons'

const DISTRICT_COORDS = {
  'Азовский':              { lat: 47.11, lon: 39.42 },
  'Аксайский':             { lat: 47.31, lon: 39.87 },
  'Багаевский':            { lat: 47.38, lon: 40.44 },
  'Белокалитвинский':      { lat: 48.17, lon: 40.77 },
  'Боковский':             { lat: 49.27, lon: 41.79 },
  'Верхнедонской':         { lat: 49.62, lon: 40.99 },
  'Веселовский':           { lat: 47.25, lon: 41.22 },
  'Волгодонской':          { lat: 47.52, lon: 42.17 },
  'Дубовский':             { lat: 47.42, lon: 42.77 },
  'Егорлыкский':           { lat: 46.57, lon: 40.70 },
  'Заветинский':           { lat: 47.12, lon: 43.88 },
  'Зерноградский':         { lat: 46.85, lon: 40.31 },
  'Зимовниковский':        { lat: 47.14, lon: 42.99 },
  'Кагальницкий':          { lat: 46.88, lon: 40.19 },
  'Каменский':             { lat: 48.45, lon: 40.27 },
  'Кашарский':             { lat: 49.10, lon: 40.43 },
  'Константиновский':      { lat: 47.58, lon: 41.09 },
  'Красносулинский':       { lat: 47.89, lon: 40.06 },
  'Куйбышевский':          { lat: 48.56, lon: 39.36 },
  'Мартыновский':          { lat: 47.52, lon: 41.62 },
  'Матвеево-Курганский':   { lat: 47.56, lon: 38.85 },
  'Миллеровский':          { lat: 48.92, lon: 40.41 },
  'Милютинский':           { lat: 48.64, lon: 42.18 },
  'Морозовский':           { lat: 48.35, lon: 41.83 },
  'Мясниковский':          { lat: 47.26, lon: 39.80 },
  'Неклиновский':          { lat: 47.17, lon: 38.65 },
  'Новочеркасский':        { lat: 47.42, lon: 40.10 },
  'Обливский':             { lat: 48.54, lon: 42.52 },
  'Октябрьский':           { lat: 47.39, lon: 41.78 },
  'Орловский':             { lat: 46.86, lon: 41.84 },
  'Песчанокопский':        { lat: 46.19, lon: 41.07 },
  'Пролетарский':          { lat: 46.70, lon: 41.74 },
  'Ремонтненский':         { lat: 46.56, lon: 43.64 },
  'Родионово-Несветайский':{ lat: 47.51, lon: 39.54 },
  'Ростовский':            { lat: 47.24, lon: 39.70 },
  'Сальский':              { lat: 46.48, lon: 41.54 },
  'Семикаракорский':       { lat: 47.52, lon: 40.80 },
  'Советский':             { lat: 50.00, lon: 43.40 },
  'Тарасовский':           { lat: 49.04, lon: 40.82 },
  'Тацинский':             { lat: 48.21, lon: 41.27 },
  'Усть-Донецкий':         { lat: 47.63, lon: 40.87 },
  'Целинский':             { lat: 46.54, lon: 41.04 },
  'Чертковский':           { lat: 49.35, lon: 40.12 },
  'Шолоховский':           { lat: 49.06, lon: 41.57 },
}

const FIELDS_KEY = 'fields'

export function loadSavedFields() {
  try {
    return JSON.parse(localStorage.getItem(FIELDS_KEY)) || []
  } catch {
    return []
  }
}

function saveField(field) {
  const saved = loadSavedFields()
  localStorage.setItem(FIELDS_KEY, JSON.stringify([...saved, field]))
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'Inter, sans-serif',
}

const inputErrorStyle = {
  ...inputStyle,
  borderColor: 'var(--color-anomaly)',
}

const focusHandlers = {
  onFocus: e => {
    e.target.style.borderColor = 'var(--color-accent)'
    e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.12)'
  },
  onBlur: e => {
    e.target.style.borderColor = e.target.dataset.error ? 'var(--color-anomaly)' : 'var(--color-border)'
    e.target.style.boxShadow = 'none'
  },
}

function Field({ label, required, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
      {label}{required && <span style={{ color: 'var(--color-anomaly)', marginLeft: '2px' }}>*</span>}
      {children}
    </label>
  )
}

export default function AddFieldModal({ allFields, onClose, onAdd }) {
  const [form, setForm] = useState({
    title: '',
    number: '',
    crop: 'wheat',
    district: '',
    area: '',
    temp: '',
    precip: '',
  })
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [districts, setDistricts] = useState([])
  const [loadingDistricts, setLoadingDistricts] = useState(true)

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Load districts from API (with fallback)
  useEffect(() => {
    fetchDistricts().then(data => {
      setDistricts(data)
      setLoadingDistricts(false)
    })
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: false }))
    if (globalError) setGlobalError('')
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = true
    if (!form.number.toString().trim()) e.number = true
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    const fieldId = Number(form.number)
    if (allFields.some(f => f.field_id === fieldId)) {
      setGlobalError('Участок с таким номером уже существует')
      setErrors({ number: true })
      return
    }

    const districtKey = Object.keys(DISTRICT_COORDS).find(k =>
      form.district.startsWith(k) || k.startsWith(form.district.split(' ')[0])
    )
    const coords = DISTRICT_COORDS[districtKey] ?? { lat: 46.85, lon: 40.31 }

    const newField = {
      field_id: fieldId,
      name:     `Участок ${fieldId} — ${form.title.trim()}`,
      crop:     form.crop,
      status:   'normal',
      temp:     form.temp   !== '' ? Number(form.temp)   : 20,
      precip:   form.precip !== '' ? Number(form.precip) : 5,
      district: form.district,
      area:     form.area   !== '' ? Number(form.area)   : null,
      latitude:  coords.lat,
      longitude: coords.lon,
    }

    // Попытка сохранить на бэкенде
    const payload = {
      name:           newField.name,
      crop_type:      form.crop,
      area_hectares:  newField.area ?? 100,
      latitude:       coords.lat,
      longitude:      coords.lon,
      user_id:        1,
    }
    const result = await createField(payload)

    if (result) {
      // Бэкенд сохранил — адаптируем ответ к фронтовому формату
      onAdd({ ...newField, field_id: result.id ?? fieldId })
    } else {
      // Fallback — localStorage
      saveField(newField)
      onAdd(newField)
    }
    onClose()
  }

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Modal card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'overlay',
          padding: '28px 28px 24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <WheatEmoji size={22} />
            <h2 style={{ fontSize: '18px', color: 'var(--color-text)' }}>Новый участок</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1, padding: '4px', display: 'flex', alignItems: 'center', borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
          >
            <IconX size={20} color="currentColor" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Row 1: title + number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Название участка" required>
                <input
                  style={errors.title ? inputErrorStyle : inputStyle}
                  {...focusHandlers}
                  data-error={errors.title || undefined}
                  name="title"
                  type="text"
                  placeholder="Северный"
                  value={form.title}
                  onChange={handleChange}
                />
                {errors.title && <span style={{ fontSize: '11px', color: 'var(--color-anomaly)' }}>Обязательное поле</span>}
              </Field>

              <Field label="Номер участка" required>
                <input
                  style={errors.number ? inputErrorStyle : inputStyle}
                  {...focusHandlers}
                  data-error={errors.number || undefined}
                  name="number"
                  type="number"
                  min="1"
                  placeholder="46"
                  value={form.number}
                  onChange={handleChange}
                />
                {errors.number && <span style={{ fontSize: '11px', color: 'var(--color-anomaly)' }}>Обязательное поле</span>}
              </Field>
            </div>

            {/* Row 2: crop + district */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Культура">
                <select style={inputStyle} {...focusHandlers} name="crop" value={form.crop} onChange={handleChange}>
                  {CROPS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </Field>

              <Field label="Район">
                <select
                  style={{ ...inputStyle, color: loadingDistricts ? 'var(--color-text-muted)' : 'var(--color-text)' }}
                  {...focusHandlers}
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  disabled={loadingDistricts}
                  required
                >
                  <option value="">{loadingDistricts ? 'Загрузка...' : 'Выберите район'}</option>
                  {districts.map(d => {
                    const name = typeof d === 'string' ? d : d.name
                    return <option key={name} value={name}>{name}</option>
                  })}
                </select>
              </Field>
            </div>

            {/* Row 3: area + temp + precip */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <Field label="Площадь, га">
                <input
                  style={inputStyle} {...focusHandlers}
                  name="area" type="number" min="0" placeholder="250"
                  value={form.area} onChange={handleChange}
                />
              </Field>
              <Field label="Температура, °C">
                <input
                  style={inputStyle} {...focusHandlers}
                  name="temp" type="number" placeholder="22"
                  value={form.temp} onChange={handleChange}
                />
              </Field>
              <Field label="Осадки, мм">
                <input
                  style={inputStyle} {...focusHandlers}
                  name="precip" type="number" min="0" placeholder="5"
                  value={form.precip} onChange={handleChange}
                />
              </Field>
            </div>

          </div>

          {globalError && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--color-anomaly)' }}>
              {globalError}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-text-muted)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              Отмена
            </button>
            <button
              type="submit"
              style={{
                background: 'var(--color-accent)',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
            >
              Добавить
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
