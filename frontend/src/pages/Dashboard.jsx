import Navbar from '../components/Navbar'
import FieldList from '../components/FieldList'
import { MOCK_FIELDS } from '../mockData'
import { getUser } from '../auth'

const STAT_CARDS = [
  { key: 'normal',  dot: '#4caf50', label: 'В норме',           filter: f => f.status === 'normal'  },
  { key: 'warning', dot: '#f59e0b', label: 'Требуют внимания',  filter: f => f.status === 'warning' },
  { key: 'anomaly', dot: '#ef4444', label: 'Аномалии',          filter: f => f.status === 'anomaly' },
]

function StatCard({ dot, label, count }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '12px 16px',
      flex: '1 1 100px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <span style={{
        width: '8px', height: '8px',
        borderRadius: '50%',
        background: dot,
        flexShrink: 0,
        display: 'inline-block',
      }} />
      <div>
        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          fontFamily: 'Montserrat, sans-serif',
          color: 'var(--color-text)',
          lineHeight: 1,
          marginBottom: '2px',
        }}>
          {count}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const user = getUser()
  const firstName = (user?.name || '').split(' ')[0] || 'Агроном'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 16px 48px' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', color: 'var(--color-text)', marginBottom: '4px' }}>
            Добрый день, {firstName}!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Ростовская область — прогнозы урожайности и рекомендации по поливу
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {STAT_CARDS.map(card => (
            <StatCard
              key={card.key}
              dot={card.dot}
              label={card.label}
              count={MOCK_FIELDS.filter(card.filter).length}
            />
          ))}
        </div>

        {/* Section header */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', color: 'var(--color-text)' }}>Мои поля</h2>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {MOCK_FIELDS.length} участков
          </span>
        </div>

        <FieldList fields={MOCK_FIELDS} />
      </div>
    </div>
  )
}
