import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { setUser } from '../auth'
import { DISTRICTS } from '../constants/districts'
import WheatEmoji from '../components/icons/WheatEmoji'

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  background: '#fff',
  color: 'var(--color-text)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const focusHandlers = {
  onFocus: e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.12)' },
  onBlur:  e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' },
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    role: '', organization: '',
    district: '', password: '', confirm: '',
  })
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Пароли не совпадают')
      return
    }
    if (form.password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов')
      return
    }

    const { confirm, password, ...userData } = form
    setUser({ ...userData, avatar: null, stats: { total_fields: 5, active_anomalies: 1, completed_recommendations: 0 } })
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <WheatEmoji size={48} />
          </div>
          <div style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: '20px',
            color: 'var(--color-primary)',
          }}>
            АгроАналитика
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Ростовская область
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '28px 24px',
        }}>
          <h1 style={{ fontSize: '18px', color: 'var(--color-text)', marginBottom: '20px', textAlign: 'center' }}>
            Регистрация
          </h1>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>

              <Field label="ФИО">
                <input style={inputStyle} {...focusHandlers}
                  type="text" name="name"
                  placeholder="Иванова Мария Сергеевна"
                  value={form.name} onChange={handleChange} required
                />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Email">
                  <input style={inputStyle} {...focusHandlers}
                    type="email" name="email"
                    placeholder="example@mail.ru"
                    value={form.email} onChange={handleChange}
                    autoComplete="email" required
                  />
                </Field>
                <Field label="Телефон">
                  <input style={inputStyle} {...focusHandlers}
                    type="tel" name="phone"
                    placeholder="+7 (000) 000-00-00"
                    value={form.phone} onChange={handleChange} required
                  />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Должность">
                  <input style={inputStyle} {...focusHandlers}
                    type="text" name="role"
                    placeholder="Главный агроном"
                    value={form.role} onChange={handleChange} required
                  />
                </Field>
                <Field label="Организация">
                  <input style={inputStyle} {...focusHandlers}
                    type="text" name="organization"
                    placeholder="АО Агрофирма..."
                    value={form.organization} onChange={handleChange} required
                  />
                </Field>
              </div>

              <Field label="Район обслуживания">
                <select
                  style={{ ...inputStyle, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\'%3E%3Cpath d=\'M0 0l6 8 6-8z\' fill=\'%236b7c6e\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px', cursor: 'pointer' }}
                  {...focusHandlers}
                  name="district"
                  value={form.district} onChange={handleChange} required
                >
                  <option value="">Выберите район</option>
                  {DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Field label="Пароль">
                  <input style={inputStyle} {...focusHandlers}
                    type="password" name="password"
                    placeholder="Мин. 6 символов"
                    value={form.password} onChange={handleChange}
                    autoComplete="new-password" required
                  />
                </Field>
                <Field label="Подтвердить пароль">
                  <input style={inputStyle} {...focusHandlers}
                    type="password" name="confirm"
                    placeholder="Повторите пароль"
                    value={form.confirm} onChange={handleChange}
                    autoComplete="new-password" required
                  />
                </Field>
              </div>

            </div>

            {error && (
              <div style={{ color: 'var(--color-anomaly)', fontSize: '13px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                background: 'var(--color-accent)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '11px',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
            >
              Зарегистрироваться
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
              Войти
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', fontWeight: 500, color: 'var(--color-text-muted)' }}>
      {label}
      {children}
    </label>
  )
}
