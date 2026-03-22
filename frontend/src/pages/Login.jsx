import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { setUser } from '../auth'
import { MOCK_AGRONOMIST } from '../mockData'
import WheatEmoji from '../components/icons/WheatEmoji'

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const focusHandlers = {
  onFocus: e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.15)' },
  onBlur:  e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' },
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Заполните все поля')
      return
    }
    const savedAvatar = localStorage.getItem(`agro_avatar_${form.email}`) || null
    setUser({ ...MOCK_AGRONOMIST, email: form.email, avatar: savedAvatar })
    navigate('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(140deg, #e8f5e9 0%, #f5f7f5 60%, #e0f2fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '820px',
        display: 'flex',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(26,77,46,0.18)',
        animation: 'fadeIn 0.4s ease',
      }}>

        {/* Left hero panel */}
        <div style={{
          flex: '0 0 42%',
          background: 'linear-gradient(160deg, #1a4d2e 0%, #2e7d32 55%, #43a047 100%)',
          padding: '52px 36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', bottom: -70, right: -70, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: -50, left: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '30%', right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <WheatEmoji size={72} />
            <div style={{
              color: '#fff',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800,
              fontSize: '26px',
              marginTop: '18px',
              letterSpacing: '-0.01em',
            }}>
              АгроАналитика
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.72)',
              fontSize: '13px',
              marginTop: '12px',
              lineHeight: 1.7,
              maxWidth: '200px',
            }}>
              Предиктивная аналитика<br />
              для сельского хозяйства<br />
              Ростовской области
            </div>

            {/* Stats hint */}
            <div style={{
              marginTop: '36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {[
                { num: '43', text: 'района Ростовской обл.' },
                { num: '4', text: 'типа культур в анализе' },
                { num: '10', text: 'лет исторических данных' },
              ].map(({ num, text }) => (
                <div key={num} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  background: 'rgba(255,255,255,0.10)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '18px', color: '#a5f3af', minWidth: 28 }}>{num}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.80)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div style={{
          flex: 1,
          background: 'var(--color-surface)',
          padding: '52px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
          <h1 style={{
            fontSize: '22px',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: '6px',
          }}>
            Вход в систему
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '28px' }}>
            Войдите, чтобы управлять полями и прогнозами
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '22px' }}>
              <Field label="Email">
                <input
                  style={inputStyle} {...focusHandlers}
                  type="email" name="email"
                  placeholder="example@mail.ru"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </Field>
              <Field label="Пароль">
                <input
                  style={inputStyle} {...focusHandlers}
                  type="password" name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
              </Field>
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
                borderRadius: '10px',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                transition: 'background 0.15s, box-shadow 0.15s',
                boxShadow: '0 4px 14px rgba(76,175,80,0.30)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent-hover)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(76,175,80,0.40)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(76,175,80,0.30)' }}
            >
              Войти
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Нет аккаунта?{' '}
            <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
              Зарегистрироваться
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
