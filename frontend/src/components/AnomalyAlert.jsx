import { IconWarning } from './icons/Icons'

export default function AnomalyAlert({ message, anomalies }) {
  return (
    <div style={{
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderLeft: '4px solid var(--color-anomaly)',
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginBottom: '16px',
    }}>
      <IconWarning size={18} color="var(--color-anomaly)" style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'var(--color-anomaly)', fontSize: '14px', marginBottom: '4px' }}>
          Аномалия обнаружена
        </div>
        {anomalies?.length > 0 ? (
          <ul style={{ margin: 0, paddingLeft: '16px', color: 'var(--color-text)', fontSize: '13px', lineHeight: 1.7 }}>
            {anomalies.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        ) : (
          <div style={{ color: 'var(--color-text)', fontSize: '13px', lineHeight: 1.5 }}>
            {message || 'Обнаружено отклонение от нормы. Проверьте состояние поля.'}
          </div>
        )}
      </div>
    </div>
  )
}
