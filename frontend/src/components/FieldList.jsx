import FieldCard from './FieldCard'

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderLeft: '4px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      padding: '14px 16px 14px 20px',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ width: '40%', height: 14, borderRadius: 6, background: 'var(--color-border)', marginBottom: 8, animation: 'shimmer 1.4s ease infinite alternate' }} />
        <div style={{ width: '65%', height: 12, borderRadius: 6, background: 'var(--color-border)', marginBottom: 10, opacity: 0.7, animation: 'shimmer 1.4s ease 0.2s infinite alternate' }} />
        <div style={{ width: '28%', height: 20, borderRadius: 10, background: 'var(--color-border)', animation: 'shimmer 1.4s ease 0.4s infinite alternate' }} />
      </div>
      <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--color-border)', flexShrink: 0, animation: 'shimmer 1.4s ease 0.1s infinite alternate' }} />
    </div>
  )
}

export default function FieldList({ fields, loading = false }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
        {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
      {fields.map((field, i) => (
        <FieldCard key={field.field_id} field={field} index={i} />
      ))}
    </div>
  )
}
