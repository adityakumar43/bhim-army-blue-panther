import { Navigate } from 'react-router-dom'
import { getItem } from '../lib/storage.js'

export default function ProtectedRoute({ children }) {
  return getItem('token') ? children : <Navigate to="/admin/login" replace />
}
