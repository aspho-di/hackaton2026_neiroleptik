import { useState, useEffect } from 'react'
import { DISTRICTS, CROPS } from '../constants/districts'
import { IconWheat } from './icons/Icons'

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
  background: '#fff',
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
    crop: 'пшеница',
    district: '',
    area: '',
    temp: '',
    precip: '',
  })
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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

  function handleSubmit(e) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    const fieldId = Number(form.number)
    if (allFields.some(f => f.field_id === fieldId)) {
      setGlobalError('Участок с таким номером уже существует')
      setErrors({ number: true })
      return
    }

    const newField = {
      field_id: fieldId,
      name: `Участок ${fieldId} — ${form.title.trim()}`,
      crop: form.crop,
      status: 'normal',
      temp: form.temp !== '' ? Number(form.temp) : 20,
      precip: form.precip !== '' ? Number(form.precip) : 5,
      district: form.district,
      area: form.area !== '' ? Number(form.area) : null,
    }

    saveField(newField)
    onAdd(newField)
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
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 28px 24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconWheat size={22} color="var(--color-accent)" />
            <h2 style={{ fontSize: '18px', color: 'var(--color-text)' }}>Новый участок</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-muted)', lineHeight: 1, padding: '4px' }}
          >
            ×
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
                  {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Район">
                <select style={inputStyle} {...focusHandlers} name="district" value={form.district} onChange={handleChange}>
                  <option value="">Выберите район</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
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
