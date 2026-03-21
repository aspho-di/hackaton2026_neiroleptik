const BADGE_CONFIG = {
  normal:  { bg: 'rgba(76,175,80,0.15)',  color: 'var(--color-normal)',  label: 'Норма',            dot: 'var(--color-normal)'  },
  warning: { bg: 'rgba(245,158,11,0.15)', color: 'var(--color-warning)', label: 'Требует внимания', dot: 'var(--color-warning)' },
  anomaly: { bg: 'rgba(239,68,68,0.15)',  color: 'var(--color-anomaly)', label: 'Аномалия',         dot: 'var(--color-anomaly)' },
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
