import { Navigate, useLocation } from "react-router-dom"
import RouteStatusScreen from "./RouteStatusScreen"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <RouteStatusScreen
        eyebrow="Secure Access"
        title="Checking your access"
        description="Loading your session and workspace permissions before opening this page."
        loading
      />
    )
  }

  if (user === null) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          redirectTo: location.pathname,
          accessReason: "auth",
        }}
      />
    )
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to="/access-denied"
        replace
        state={{
          requestedPath: location.pathname,
          allowedRoles,
        }}
      />
    )
  }

  return children
}
