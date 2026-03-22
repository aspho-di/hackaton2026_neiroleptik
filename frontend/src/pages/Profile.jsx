import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { getUser, setUser, removeUser } from '../auth'
import { useFields } from '../hooks/useFields'
import { IconCircleAlert, IconCheck, IconBuilding, IconMapPin, IconMail, IconPhone, IconMap, IconCamera } from '../components/icons/Icons'
import WheatEmoji from '../components/icons/WheatEmoji'

const TG_BOT = 'agro_backend_bot'
const TG_STORAGE_KEY = 'telegram_connected'

function getTgConnected() {
  try { return !!localStorage.getItem(TG_STORAGE_KEY) } catch { return false }
}

function TelegramIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#29B6F6" />
      <path d="M5.5 11.5l11-4.5-1.5 9-3.5-2.5-2 2v-3l5-4.5-6.5 3.5L5.5 11.5z" fill="#fff" />
    </svg>
  )
}

function TelegramConnectCard({ onConnected }) {
  const [open, setOpen]   = useState(false)
  const [step, setStep]   = useState(1)
  const [done, setDone]   = useState(getTgConnected)

  function connect() {
    try { localStorage.setItem(TG_STORAGE_KEY, '1') } catch {}
    setDone(true)
    setOpen(false)
    setStep(1)
    onConnected?.()
    window.dispatchEvent(new Event('telegram-connected'))
  }

  function disconnect() {
    try { localStorage.removeItem(TG_STORAGE_KEY) } catch {}
    setDone(false)
    window.dispatchEvent(new Event('telegram-connected'))
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: `1px solid ${done ? 'var(--color-border)' : '#bfdbfe'}`,
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '18px 20px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: done ? '#e8f5e9' : '#e0f2fe',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <TelegramIcon size={24} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)' }}>
            Telegram-уведомления
          </span>
          {done && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#15803d',
              background: '#dcfce7', borderRadius: 6, padding: '2px 8px',
            }}>✓ Подключено</span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
          {done
            ? 'Вы будете получать мгновенные оповещения об аномалиях и рекомендациях по поливу'
            : 'Получайте мгновенные оповещения об аномалиях прямо в Telegram'}
        </p>
      </div>

      {done ? (
        <button
          onClick={disconnect}
          style={{
            padding: '7px 14px', border: '1px solid var(--color-border)',
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: 'transparent', color: 'var(--color-text-muted)',
            transition: 'border-color 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-anomaly)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          Отключить
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: '8px 16px',
            background: '#29B6F6', color: '#fff',
            border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700,
            fontFamily: 'Montserrat, sans-serif',
            cursor: 'pointer', flexShrink: 0,
            transition: 'background 0.15s',
            boxShadow: '0 2px 8px rgba(41,182,246,0.30)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#0288D1'}
          onMouseLeave={e => e.currentTarget.style.background = '#29B6F6'}
        >
          Подключить
        </button>
      )}

      {/* Modal */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) { setOpen(false); setStep(1) } }}
        >
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 16, padding: '28px 28px 24px',
            maxWidth: 420, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TelegramIcon size={28} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)' }}>
                  Подключение Telegram
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Шаг {step} из 2
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 4, borderRadius: 2, background: 'var(--color-border)', marginBottom: 24 }}>
              <div style={{ height: '100%', borderRadius: 2, background: '#29B6F6', width: step === 1 ? '50%' : '100%', transition: 'width 0.3s' }} />
            </div>

            {step === 1 ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, marginBottom: 16 }}>
                  Откройте нашего Telegram-бота и нажмите <b>/start</b>, чтобы начать получать уведомления об аномалиях, рекомендациях по поливу и прогнозах урожайности.
                </p>

                <div style={{
                  background: '#f0f9ff', border: '1px solid #bae6fd',
                  borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <TelegramIcon size={20} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0369a1' }}>@{TG_BOT}</span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <a
                    href={`https://t.me/${TG_BOT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1, padding: '10px 0', textAlign: 'center',
                      background: '#29B6F6', color: '#fff',
                      borderRadius: 8, fontWeight: 700, fontSize: 14,
                      fontFamily: 'Montserrat, sans-serif', textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(41,182,246,0.30)',
                    }}
                  >
                    Открыть Telegram
                  </a>
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      flex: 1, padding: '10px 0',
                      background: 'transparent', border: '1px solid var(--color-border)',
                      borderRadius: 8, fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', color: 'var(--color-text)',
                      fontFamily: 'Montserrat, sans-serif',
                    }}
                  >
                    Уже открыл →
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, marginBottom: 16 }}>
                  Отправьте боту команду <b>/start</b>. Бот автоматически настроит уведомления для вашего аккаунта.
                </p>

                <div style={{
                  background: '#f8fafc', border: '1px dashed var(--color-border)',
                  borderRadius: 10, padding: '16px', marginBottom: 20,
                }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Типы уведомлений
                  </div>
                  {[
                    '🚨 Аномалии показаний датчиков',
                    '💧 Рекомендации по поливу',
                    '🌾 Прогнозы урожайности',
                    '⛈️ Погодные предупреждения',
                  ].map(t => (
                    <div key={t} style={{ fontSize: 13, color: 'var(--color-text)', padding: '3px 0' }}>{t}</div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      padding: '10px 16px', background: 'transparent',
                      border: '1px solid var(--color-border)', borderRadius: 8,
                      fontSize: 13, cursor: 'pointer', color: 'var(--color-text-muted)',
                    }}
                  >
                    ← Назад
                  </button>
                  <button
                    onClick={connect}
                    style={{
                      flex: 1, padding: '10px 0',
                      background: 'var(--color-accent)', color: '#fff',
                      border: 'none', borderRadius: 8,
                      fontWeight: 700, fontSize: 14,
                      fontFamily: 'Montserrat, sans-serif',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(76,175,80,0.30)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
                  >
                    ✓ Готово, подключить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function getCompletedRecs() {
  return Number(localStorage.getItem('completed_recommendations') || 0)
}

function AvatarUpload({ user, size = 80, onUpload }) {
  const inputRef = useRef()
  const [hover, setHover] = useState(false)
  const initials = (user?.name || 'AG').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onUpload(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div
      style={{ position: 'relative', width: size, height: size, flexShrink: 0, cursor: 'pointer' }}
      onClick={() => inputRef.current.click()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--color-accent)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.35, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
        boxShadow: '0 4px 12px rgba(76,175,80,0.35)',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s',
      }}>
        {user?.avatar
          ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials
        }
      </div>

      {hover && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(0,0,0,0.48)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 3, transition: 'opacity 0.15s',
        }}>
          <IconCamera size={20} color="#fff" />
          <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: '0.04em' }}>ИЗМЕНИТЬ</span>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1px' }}>
          {label}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
          {value || '—'}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, valueColor }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '20px 16px',
      textAlign: 'center',
      flex: '1 1 120px',
    }}>
      <div style={{ marginBottom: '6px', display: 'flex' }}>{icon}</div>
      <div style={{
        fontSize: '28px',
        fontWeight: 700,
        fontFamily: 'Montserrat, sans-serif',
        color: valueColor || 'var(--color-text)',
        lineHeight: 1,
        marginBottom: '4px',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUserState] = useState(() => getUser())
  const { fields } = useFields()

  function handleAvatarUpload(dataUrl) {
    const updated = { ...user, avatar: dataUrl }
    try {
      setUser(updated)
      // Persist avatar separately so it survives logout/re-login
      if (user?.email) localStorage.setItem(`agro_avatar_${user.email}`, dataUrl)
    } catch {}
    setUserState(updated)
    window.dispatchEvent(new Event('avatar-updated'))
  }

  const name         = user?.name         || 'Агроном'
  const role         = user?.role         || '—'
  const organization = user?.organization || '—'
  const district     = user?.district     || '—'
  const email        = user?.email        || '—'
  const phone        = user?.phone        || '—'

  const totalFields        = fields.length
  const activeAnomalies    = fields.filter(f => f.status === 'anomaly').length
  const completedRecs      = getCompletedRecs()

  function handleLogout() {
    removeUser()
    navigate('/login')
  }

  return (
    <>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px 48px' }}>

        {/* Header card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '28px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap',
        }}>
          <AvatarUpload user={user} size={80} onUpload={handleAvatarUpload} />
          <div style={{ flex: 1, minWidth: '180px' }}>
            <h1 style={{ fontSize: '20px', marginBottom: '4px', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {name}
            </h1>
            <div style={{ fontSize: '14px', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '4px' }}>
              {role}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              {organization}
            </div>
          </div>

          {/* Кнопка "Выйти" */}
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '7px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-anomaly)',
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            Выйти
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <StatCard icon={<WheatEmoji size={24} />}                                          value={totalFields}     label="Полей всего"            valueColor="var(--color-text)" />
          <StatCard icon={<IconCircleAlert size={24} color="var(--color-anomaly)" />}     value={activeAnomalies} label="Активных аномалий"      valueColor="var(--color-anomaly)" />
          <StatCard icon={<IconCheck size={24} color="var(--color-normal)" />}            value={completedRecs}   label="Рекомендаций выполнено" valueColor="var(--color-normal)" />
        </div>

        {/* Telegram */}
        <TelegramConnectCard />

        {/* Contact & info card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '4px 20px',
          marginBottom: '20px',
        }}>
          <InfoRow icon={<IconBuilding size={18} color="var(--color-text-muted)" />} label="Организация"        value={organization} />
          <InfoRow icon={<IconMapPin  size={18} color="var(--color-text-muted)" />} label="Район обслуживания" value={district} />
          <InfoRow icon={<IconMail   size={18} color="var(--color-text-muted)" />} label="Email"               value={email} />
          <InfoRow icon={<IconPhone  size={18} color="var(--color-text-muted)" />} label="Телефон"             value={phone} />
        </div>

        {/* Fields list */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <IconMap size={16} color="var(--color-text-muted)" />
            <h2 style={{ fontSize: '15px', color: 'var(--color-text)' }}>Закреплённые поля</h2>
          </div>
          {fields.map((field, i) => (
            <div
              key={field.field_id}
              onClick={() => navigate(`/field/${field.field_id}`)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '13px 20px',
                borderBottom: i < fields.length - 1 ? '1px solid var(--color-border)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--color-text)', marginBottom: '1px' }}>
                  {field.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>ID: {field.field_id}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusBadge status={field.status} />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '16px' }}>›</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </>
  )
}
