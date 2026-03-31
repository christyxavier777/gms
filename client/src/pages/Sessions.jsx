import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import DashboardLoadingState from '../components/DashboardLoadingState'
import StatusBanner from '../components/StatusBanner'
import StatusStack from '../components/StatusStack'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { useActionStatus } from '../server-state/action-status'
import { getServerStateErrorMessage } from '../server-state/errors'
import { useServerActionMutation } from '../server-state/mutations'
import { queryKeys } from '../server-state/queryKeys'
import { useSessionsQuery } from '../server-state/queries'

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

function getPlatformLabel(userAgent) {
  const ua = String(userAgent || '').toLowerCase()
  if (!ua) return 'Unknown device'
  if (ua.includes('iphone')) return 'iPhone'
  if (ua.includes('ipad')) return 'iPad'
  if (ua.includes('android')) return 'Android'
  if (ua.includes('windows')) return 'Windows'
  if (ua.includes('macintosh') || ua.includes('mac os x')) return 'Mac'
  if (ua.includes('linux')) return 'Linux'
  return 'Unknown device'
}

function getBrowserLabel(userAgent) {
  const ua = String(userAgent || '').toLowerCase()
  if (!ua) return 'Browser'
  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Chrome'
  if (ua.includes('firefox/')) return 'Firefox'
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari'
  return 'Browser'
}

function formatSessionDevice(userAgent) {
  const browser = getBrowserLabel(userAgent)
  const platform = getPlatformLabel(userAgent)
  if (platform === 'Unknown device') return browser
  return `${browser} on ${platform}`
}

function formatUserAgent(userAgent) {
  if (!userAgent) return 'User agent unavailable'
  return userAgent.length > 140 ? `${userAgent.slice(0, 137)}...` : userAgent
}

const EMPTY_SESSIONS = []

function SessionCard({ session }) {
  return (
    <article
      className={`border p-4 backdrop-blur-[10px] ${
        session.isCurrent ? 'border-[#ff8b5f]/50 bg-[#ff8b5f]/10' : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff8b5f]">
            {session.isCurrent ? 'Current Session' : 'Active Session'}
          </p>
          <h2 className="mt-1 text-lg font-black text-white">{formatSessionDevice(session.userAgent)}</h2>
          <p className="mt-2 text-sm text-gray-300">{formatUserAgent(session.userAgent)}</p>
        </div>
        <span
          className={`inline-flex w-fit border px-3 py-1 text-xs font-bold uppercase tracking-[0.1em] ${
            session.isCurrent
              ? 'border-[#ff8b5f]/60 bg-[#ff8b5f]/15 text-white'
              : 'border-white/15 bg-black/30 text-gray-200'
          }`}
        >
          {session.isCurrent ? 'This Device' : 'Other Device'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="border border-white/10 bg-black/30 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Signed In</p>
          <p className="mt-1 text-sm text-white">{formatDateTime(session.createdAt)}</p>
        </div>
        <div className="border border-white/10 bg-black/30 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Expires</p>
          <p className="mt-1 text-sm text-white">{formatDateTime(session.expiresAt)}</p>
        </div>
        <div className="border border-white/10 bg-black/30 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">IP Address</p>
          <p className="mt-1 break-all text-sm text-white">{session.ipAddress || 'Unavailable'}</p>
        </div>
      </div>
    </article>
  )
}

export default function Sessions() {
  const navigate = useNavigate()
  const { token, logout, user } = useAuth()
  const actionStatus = useActionStatus()
  const sessionsQuery = useSessionsQuery(token)
  const revokeOthersMutation = useServerActionMutation({
    actionStatus,
    mutationFn: () => api.revokeOtherSessions(token),
    getActionKey: () => 'revoke-others',
    getSuccessMessage: ({ data }) => {
      const revokedCount = Number(data?.revokedCount || 0)
      return revokedCount > 0
        ? `Signed out ${revokedCount} other active session${revokedCount === 1 ? '' : 's'}.`
        : 'No other active sessions were found.'
    },
    getErrorMessage: 'Failed to sign out other sessions.',
    optimisticUpdate: ({ queryClient }) => {
      const previous = queryClient.getQueryData(queryKeys.sessions)
      if (!previous?.sessions) {
        return null
      }

      queryClient.setQueryData(queryKeys.sessions, {
        ...previous,
        sessions: previous.sessions.filter((session) => session.isCurrent),
      })

      return {
        rollback: () => queryClient.setQueryData(queryKeys.sessions, previous),
      }
    },
    invalidate: ({ queryClient }) => queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
  })
  const revokeAllMutation = useServerActionMutation({
    actionStatus,
    mutationFn: () => api.revokeAllSessions(token),
    getActionKey: () => 'revoke-all',
    getErrorMessage: 'Failed to sign out every session.',
    optimisticUpdate: ({ queryClient }) => {
      const previous = queryClient.getQueryData(queryKeys.sessions)
      if (!previous?.sessions) {
        return null
      }

      queryClient.setQueryData(queryKeys.sessions, {
        ...previous,
        sessions: [],
      })

      return {
        rollback: () => queryClient.setQueryData(queryKeys.sessions, previous),
      }
    },
  })
  const sessions = sessionsQuery.data?.sessions ?? EMPTY_SESSIONS
  const queryError = sessionsQuery.error
    ? getServerStateErrorMessage(sessionsQuery.error, 'Failed to load active sessions.')
    : ''

  const currentSession = useMemo(() => sessions.find((session) => session.isCurrent) || null, [sessions])
  const otherSessions = useMemo(() => sessions.filter((session) => !session.isCurrent), [sessions])
  const latestSession = sessions[0] || null

  const metrics = [
    {
      label: 'Active Sessions',
      value: sessions.length,
      hint: 'Browsers or devices still signed in',
    },
    {
      label: 'Other Devices',
      value: otherSessions.length,
      hint: 'Sessions outside this browser',
    },
    {
      label: 'Current Device',
      value: currentSession ? 'Tracked' : 'Unavailable',
      hint: currentSession ? formatSessionDevice(currentSession.userAgent) : 'Session cookie not detected',
    },
    {
      label: 'Latest Sign-In',
      value: latestSession ? formatDateTime(latestSession.createdAt) : 'No sessions',
      hint: 'Most recent active session on record',
    },
  ]

  const handleRevokeOthers = async () => {
    try {
      await revokeOthersMutation.mutateAsync()
    } catch (error) {
      void error
    }
  }

  const handleRevokeAll = async () => {
    try {
      await revokeAllMutation.mutateAsync()
      await logout()
      navigate('/', { replace: true })
    } catch (error) {
      void error
    }
  }

  if (sessionsQuery.isPending) {
    return (
      <DashboardLayout title="Sessions">
        <DashboardLoadingState label="Loading session management" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Sessions">
      <StatusStack
        errorMessage={actionStatus.errorMessage || queryError}
        successMessage={actionStatus.successMessage}
      />

      <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Session Security</h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-300">
              Review where your {user?.role?.toLowerCase() || 'account'} workspace is still signed in, then remove
              stale devices without changing your password.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRevokeOthers}
              disabled={actionStatus.actionKey !== '' || otherSessions.length === 0}
              className="border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-100 transition hover:border-[#ff8b5f]/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionStatus.actionKey === 'revoke-others' ? 'Signing Out Others...' : 'Sign Out Other Devices'}
            </button>
            <button
              type="button"
              onClick={handleRevokeAll}
              disabled={actionStatus.actionKey !== ''}
              className="border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#f24c5c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionStatus.actionKey === 'revoke-all' ? 'Signing Out Everywhere...' : 'Sign Out Every Session'}
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Recommended</p>
            <p className="mt-1 text-sm text-white">Use "Sign Out Other Devices" after using a shared computer.</p>
          </div>
          <div className="border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">High Impact</p>
            <p className="mt-1 text-sm text-white">"Sign Out Every Session" also signs out this browser immediately.</p>
          </div>
          <div className="border border-white/10 bg-black/30 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Visibility</p>
            <p className="mt-1 text-sm text-white">IP addresses may reflect your proxy, ISP, or office gateway.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <article key={item.label} className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{item.label}</p>
            <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Active Devices</h2>
            <p className="text-sm text-gray-300">
              The current device is highlighted so you can keep the session you are using right now.
            </p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]">
            {sessions.length} active session{sessions.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="mt-4 grid gap-4">
          {sessions.length === 0 ? (
            <StatusBanner
              variant="info"
              title="No Active Sessions"
              message="No active browser sessions are currently stored for this account."
            />
          ) : (
            sessions.map((session) => <SessionCard key={session.id} session={session} />)
          )}
        </div>
      </section>
    </DashboardLayout>
  )
}
