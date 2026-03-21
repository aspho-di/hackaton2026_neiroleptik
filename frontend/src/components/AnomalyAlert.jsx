import { IconWarning } from './icons/Icons'

export default function AnomalyAlert({ message }) {
  return (
    <div style={{
      background: '#fef2f2',
      border: '1px solid #fca5a5',
      borderLeft: '4px solid var(--color-anomaly)',
      borderRadius: '8px',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginBottom: '16px',
    }}>
      <IconWarning size={18} color="#b91c1c" />
      <div>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#b91c1c', fontSize: '14px', marginBottom: '3px' }}>
          Аномалия обнаружена
        </div>
        <div style={{ color: '#991b1b', fontSize: '13px', lineHeight: 1.5 }}>
          {message || 'Обнаружено отклонение от нормы. Проверьте состояние поля.'}
        </div>
      </div>
    </div>
  )
}
