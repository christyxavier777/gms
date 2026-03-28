import { Activity, CalendarDays, CreditCard, Dumbbell, LayoutDashboard, Shield, Wallet } from 'lucide-react'

const roleLabels = {
  ADMIN: 'Admin',
  TRAINER: 'Trainer',
  MEMBER: 'Member',
}

const protectedRouteAccess = {
  '/admin': ['ADMIN'],
  '/trainer': ['TRAINER'],
  '/member': ['MEMBER'],
  '/plans': ['ADMIN', 'TRAINER', 'MEMBER'],
  '/subscriptions': ['ADMIN', 'TRAINER', 'MEMBER'],
  '/payments': ['ADMIN', 'MEMBER'],
  '/progress': ['ADMIN', 'TRAINER', 'MEMBER'],
  '/schedule': ['ADMIN', 'TRAINER', 'MEMBER'],
  '/sessions': ['ADMIN', 'TRAINER', 'MEMBER'],
}

const workspaceNavConfig = [
  { key: 'dashboard', to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'schedule', to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { key: 'plans', to: '/plans', label: 'Plans', icon: Dumbbell },
  { key: 'subscriptions', to: '/subscriptions', label: 'Memberships', icon: CreditCard },
  { key: 'payments', to: '/payments', label: 'Payments', icon: Wallet, roles: ['ADMIN', 'MEMBER'] },
  { key: 'progress', to: '/progress', label: 'Progress', icon: Activity },
  { key: 'sessions', to: '/sessions', label: 'Sessions', icon: Shield },
]

export function roleDashboardPath(role) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'TRAINER') return '/trainer'
  return '/member'
}

export function roleWorkspaceLabel(role) {
  const label = roleLabels[role] || 'Workspace'
  return `${label} Workspace`
}

export function getWorkspaceNavItems(role) {
  return workspaceNavConfig
    .filter((item) => !item.roles || item.roles.includes(role))
    .map((item) => ({
      ...item,
      to: item.to === 'dashboard' ? roleDashboardPath(role) : item.to,
    }))
}

export function getAllowedRolesForPath(pathname) {
  return protectedRouteAccess[pathname] || null
}

export function canRoleAccessPath(role, pathname) {
  const allowedRoles = getAllowedRolesForPath(pathname)
  if (!allowedRoles) return true
  return allowedRoles.includes(role)
}

export function formatAllowedRoles(allowedRoles = []) {
  if (allowedRoles.length === 0) return 'authorized users'
  return allowedRoles
    .map((role) => roleLabels[role] || role)
    .join(', ')
}
