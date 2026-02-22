import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()

  if (user === null) {
    return <Navigate to="/" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}
