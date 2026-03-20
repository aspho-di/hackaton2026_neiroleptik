import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import CropSVG from './CropSVG'

const BORDER_COLOR = {
  normal:  'var(--color-normal)',
  warning: 'var(--color-warning)',
  anomaly: 'var(--color-anomaly)',
}

export default function FieldCard({ field }) {
  const navigate = useNavigate()
  const accentColor = BORDER_COLOR[field.status] ?? BORDER_COLOR.normal

  return (
    <div
      onClick={() => navigate(`/field/${field.field_id}`)}
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 'var(--radius-card)',
        padding: '14px 16px 14px 20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'box-shadow 0.15s, transform 0.12s',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Text info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          fontSize: '15px',
          color: 'var(--color-text)',
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {field.name}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
          ID: {field.field_id}
        </div>
        <StatusBadge status={field.status} />
      </div>

      {/* Crop illustration */}
      <div style={{ flexShrink: 0 }}>
        <CropSVG
          crop={field.crop}
          status={field.status}
          temp={field.temp}
          precip={field.precip}
        />
      </div>

      {/* Chevron */}
      <span style={{ color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: 1, flexShrink: 0 }}>›</span>
    </div>
  )
}
