import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getUser } from '../auth'
import WheatEmoji from './icons/WheatEmoji'
import { IconBarChart, IconDroplets, IconBell, IconCompare, IconSun, IconMoon, IconCalendar } from './icons/Icons'
import { fetchAlerts } from '../api/client'

function Avatar({ name, size = 36 }) {
  const [avatarUrl, setAvatarUrl] = useState(() => getUser()?.avatar || null)

  useEffect(() => {
    function sync() { setAvatarUrl(getUser()?.avatar || null) }
    window.addEventListener('avatar-updated', sync)
    return () => window.removeEventListener('avatar-updated', sync)
  }, [])

  const initials = (name || 'AG').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div
      title={name}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'var(--color-accent)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.36, fontWeight: 700,
        fontFamily: 'Montserrat, sans-serif',
        flexShrink: 0, cursor: 'pointer',
        border: '2px solid rgba(255,255,255,0.3)',
        transition: 'opacity 0.15s', userSelect: 'none',
        overflow: 'hidden',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setAvatarUrl(null)} />
        : initials
      }
    </div>
  )
}

function NavIconBtn({ to, icon, label, badge }) {
  return (
    <NavLink
      to={to}
      title={label}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        width: 36, height: 36, borderRadius: 8,
        background: isActive ? 'rgba(255,255,255,0.18)' : 'transparent',
        transition: 'background 0.15s',
        textDecoration: 'none',
        flexShrink: 0,
      })}
      className={({ isActive }) => isActive ? 'nav-icon-active' : ''}
      onMouseEnter={e => { if (!e.currentTarget.style.background.includes('0.18')) e.currentTarget.style.background = 'rgba(255,255,255,0.10)' }}
      onMouseLeave={e => { if (!e.currentTarget.style.background.includes('0.18')) e.currentTarget.style.background = 'transparent' }}
    >
      {icon}
      <span className="nav-active-dot" style={{
        position: 'absolute', bottom: 4, left: '50%',
        transform: 'translateX(-50%)',
        width: 4, height: 4, borderRadius: '50%',
        background: '#fff',
        opacity: 0,
        transition: 'opacity 0.2s',
        pointerEvents: 'none',
      }} />
      {badge > 0 && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          minWidth: 16, height: 16, borderRadius: 8,
          background: '#ef4444', color: '#fff',
          fontSize: 9, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px',
          border: '1.5px solid var(--color-primary)',
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const user     = getUser()
  const name     = user?.name || ''

  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    function recalc() {
      fetchAlerts().then(alerts => {
        if (!Array.isArray(alerts)) return
        const readIds = (() => { try { return JSON.parse(localStorage.getItem('alerts_read') || '[]') } catch { return [] } })()
        setUnreadCount(alerts.filter(a => !readIds.includes(a.id) && !a.is_read).length)
      }).catch(() => {})
    }
    recalc()
    window.addEventListener('alerts-read-updated', recalc)
    return () => window.removeEventListener('alerts-read-updated', recalc)
  }, [])

  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark')

  function toggleTheme() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark')
      try { localStorage.setItem('theme', 'dark') } catch {}
    } else {
      document.documentElement.removeAttribute('data-theme')
      try { localStorage.setItem('theme', 'light') } catch {}
    }
  }

  return (
    <nav style={{
      background: 'var(--color-primary)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    }}>
      <div className="nav-inner" style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          <NavLink to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <WheatEmoji size={28} />
            <span className="nav-brand-label" style={{
              color: '#fff', fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700, fontSize: '16px', letterSpacing: '0.01em',
            }}>
              АгроАналитика
            </span>
          </NavLink>
        </div>

        {/* Nav icons + Avatar (right group) */}
        <div className="nav-icon-gap" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
          <NavIconBtn to="/dashboard" icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>} label="Главная" />
          <NavIconBtn to="/history"    icon={<IconBarChart  size={19} color="rgba(255,255,255,0.85)" />} label="История урожайности" />
          <NavIconBtn to="/compare"   icon={<IconCompare   size={19} color="rgba(255,255,255,0.85)" />} label="Сравнение участков" />
          <NavIconBtn to="/irrigation" icon={<IconDroplets  size={19} color="rgba(255,255,255,0.85)" />} label="Оптимизация полива" />
          <NavIconBtn to="/calendar"   icon={<IconCalendar  size={19} color="rgba(255,255,255,0.85)" />} label="Сезонный календарь" />
          <NavIconBtn to="/alerts"     icon={<IconBell      size={19} color="rgba(255,255,255,0.85)" />} label="Уведомления" badge={unreadCount} />
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 4px 0 8px' }} />
          <button
            onClick={toggleTheme}
            title={dark ? 'Светлая тема' : 'Тёмная тема'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: 'transparent', border: 'none',
              cursor: 'pointer', flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {dark
              ? <IconSun  size={19} color="rgba(255,255,255,0.85)" />
              : <IconMoon size={19} color="rgba(255,255,255,0.85)" />
            }
          </button>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)', margin: '0 8px 0 4px' }} />
          <div onClick={() => navigate('/profile')} style={{ flexShrink: 0 }}>
            <Avatar name={name} size={36} />
          </div>
        </div>
      </div>
    </nav>
  )
}
