const BADGE_CONFIG = {
  normal:  { bg: '#dcfce7', color: '#15803d', label: 'Норма',            dot: 'var(--color-normal)'  },
  warning: { bg: '#fef9c3', color: '#a16207', label: 'Требует внимания', dot: 'var(--color-warning)' },
  anomaly: { bg: '#fee2e2', color: '#b91c1c', label: 'Аномалия',         dot: 'var(--color-anomaly)' },
}

export default function StatusBadge({ status, confidence }) {
  let key = status
  if (confidence === 'low' && status !== 'anomaly') key = 'warning'

  const cfg = BADGE_CONFIG[key] ?? BADGE_CONFIG.normal

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '9999px',
      background: cfg.bg,
      color: cfg.color,
      fontSize: '12px',
      fontWeight: 600,
      fontFamily: 'Inter, sans-serif',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: '7px', height: '7px',
        borderRadius: '50%',
        background: cfg.dot,
        display: 'inline-block',
        flexShrink: 0,
      }} />
      {cfg.label}
    </span>
  )
}
