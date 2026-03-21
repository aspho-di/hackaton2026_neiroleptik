import { useNavigate } from 'react-router-dom'
import WheatEmoji from '../components/icons/WheatEmoji'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(140deg, #e8f5e9 0%, #f5f7f5 60%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      textAlign: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* SVG поле на фоне */}
      <svg
        viewBox="0 0 800 200"
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          width: '100%',
          height: 200,
          pointerEvents: 'none',
          zIndex: 0,
        }}
        preserveAspectRatio="xMidYMax slice"
      >
        {/* Холм 1 */}
        <path d="M0 180 Q200 100 400 140 Q600 180 800 120 L800 200 L0 200Z" fill="#c8e6c9" />
        {/* Холм 2 */}
        <path d="M0 200 Q150 150 350 165 Q550 180 800 150 L800 200 L0 200Z" fill="#a5d6a7" />

        {/* Колосья */}
        {[50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750].map((x, i) => (
          <g key={x} transform={`translate(${x}, ${140 + (i % 3) * 12})`} style={{ animation: `sway ${2 + (i % 3) * 0.4}s ease-in-out ${i * 0.15}s infinite alternate` }}>
            <line x1="0" y1="40" x2="0" y2="0" stroke="#388e3c" strokeWidth="1.5" />
            <ellipse cx="0" cy="-5" rx="3" ry="8" fill="#558b2f" />
            <line x1="-6" y1="15" x2="0" y2="10" stroke="#388e3c" strokeWidth="1" />
            <line x1="6" y1="20" x2="0" y2="15" stroke="#388e3c" strokeWidth="1" />
          </g>
        ))}
      </svg>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, animation: 'fadeIn 0.5s ease' }}>
        {/* 404 number */}
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(80px, 15vw, 140px)',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #1a4d2e 0%, #4caf50 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '12px',
          letterSpacing: '-0.04em',
        }}>
          404
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <WheatEmoji size={52} />
        </div>

        <h1 style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: '24px',
          color: '#1a4d2e',
          marginBottom: '12px',
        }}>
          Поле не найдено
        </h1>

        <p style={{
          fontSize: '15px',
          color: '#6b7c6e',
          maxWidth: '380px',
          lineHeight: 1.7,
          marginBottom: '36px',
        }}>
          Кажется, вы свернули не туда. Этот участок не значится в базе —
          возможно, он был удалён или ссылка устарела.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#1a4d2e',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(26,77,46,0.28)',
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4caf50'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(76,175,80,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#1a4d2e'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,77,46,0.28)' }}
          >
            На главную
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              color: '#1a4d2e',
              border: '2px solid #1a4d2e',
              borderRadius: '10px',
              padding: '12px 28px',
              fontSize: '15px',
              fontWeight: 600,
              fontFamily: 'Montserrat, sans-serif',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1a4d2e'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#1a4d2e' }}
          >
            Назад
          </button>
        </div>
      </div>
    </div>
  )
}
