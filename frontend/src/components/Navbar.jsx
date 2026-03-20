import { NavLink, useNavigate } from 'react-router-dom'
import { getUser } from '../auth'
import { IconWheat } from './icons/Icons'

function Avatar({ name, size = 36 }) {
  const initials = (name || 'AG')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--color-accent)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 700,
        fontFamily: 'Montserrat, sans-serif',
        flexShrink: 0,
        cursor: 'pointer',
        border: '2px solid rgba(255,255,255,0.3)',
        transition: 'opacity 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {initials}
    </div>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const user = getUser()
  const name = user?.name || ''

  return (
    <nav style={{
      background: 'var(--color-primary)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    }}>
      {/* Logo */}
      <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
        <IconWheat size={22} color="#fff" />
        <span style={{
          color: '#fff',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: '16px',
          letterSpacing: '0.01em',
        }}>
          АгроАналитика
        </span>
      </NavLink>

      {/* Avatar → /profile */}
      <div onClick={() => navigate('/profile')}>
        <Avatar name={name} size={36} />
      </div>
    </nav>
  )
}
