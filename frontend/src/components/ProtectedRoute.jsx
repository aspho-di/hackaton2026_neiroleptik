import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../auth'
import FieldBackground from './FieldBackground'

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <FieldBackground />
      <div style={{ position: 'relative', zIndex: 1, paddingBottom: '320px' }}>
        {children}
      </div>
    </div>
  )
}
