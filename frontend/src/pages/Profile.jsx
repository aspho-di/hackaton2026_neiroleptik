import { useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { getUser, setUser, removeUser } from '../auth'
import { useFields } from '../hooks/useFields'
import { IconCircleAlert, IconCheck, IconBuilding, IconMapPin, IconMail, IconPhone, IconMap, IconCamera } from '../components/icons/Icons'
import WheatEmoji from '../components/icons/WheatEmoji'

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
    try { setUser(updated) } catch {}
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
