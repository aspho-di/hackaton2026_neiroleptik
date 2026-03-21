import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../auth'
import FieldBackground from './FieldBackground'
import Navbar from './Navbar'

export default function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <FieldBackground />
      <Navbar />
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ minHeight: '100%', paddingBottom: '48px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
