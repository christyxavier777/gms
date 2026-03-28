import { useLocation } from 'react-router-dom'
import RouteStatusScreen from '../components/RouteStatusScreen'
import { useAuth } from '../context/AuthContext'
import { formatAllowedRoles, roleDashboardPath, roleWorkspaceLabel } from '../navigation/workspaceNavigation'

export default function AccessDenied() {
  const { user } = useAuth()
  const location = useLocation()

  const requestedPath = location.state?.requestedPath || 'this page'
  const allowedRoles = location.state?.allowedRoles || []
  const allowedRoleLabel = formatAllowedRoles(allowedRoles)

  if (!user) {
    return (
      <RouteStatusScreen
        eyebrow="Access"
        title="You need to sign in first"
        description="Sign in with an account that has permission for this area, then try again."
        actions={[
          { label: 'Login', to: '/login' },
          { label: 'Register', to: '/register', variant: 'secondary' },
        ]}
      />
    )
  }

  return (
    <RouteStatusScreen
      eyebrow={roleWorkspaceLabel(user.role)}
      title="This page is outside your current access level"
      description={`The route "${requestedPath}" is reserved for ${allowedRoleLabel}. You are signed in as ${user.role}.`}
      actions={[
        { label: 'Open My Dashboard', to: roleDashboardPath(user.role) },
        { label: 'Back To Memberships', to: '/subscriptions', variant: 'secondary' },
      ]}
    />
  )
}
