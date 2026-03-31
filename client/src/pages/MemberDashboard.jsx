import DashboardLoadingState from '../components/DashboardLoadingState'
import DashboardLayout from '../components/DashboardLayout'
import StatusBanner from '../components/StatusBanner'
import { useAuth } from '../context/AuthContext'
import { getServerStateErrorMessage } from '../server-state/errors'
import { useMemberDashboardQuery } from '../server-state/queries'

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return date
  }
}

function formatStatusLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export default function MemberDashboard() {
  const { user, token } = useAuth()
  const dashboardQuery = useMemberDashboardQuery(token, 8)
  const dashboard = dashboardQuery.data?.dashboard ?? null
  const error = dashboardQuery.error
    ? getServerStateErrorMessage(dashboardQuery.error, 'Failed to load member dashboard.')
    : ''
  const displayName = user?.email ? user.email.split('@')[0] : 'Member'

  if (dashboardQuery.isPending) {
    return (
      <DashboardLayout title="Member">
        <DashboardLoadingState label="Loading member dashboard" />
      </DashboardLayout>
    )
  }

  const workoutLive = dashboard?.assignedWorkoutPlans || []
  const dietLive = dashboard?.assignedDietPlans || []
  const progressLive = dashboard?.recentProgressEntries || []
  const subscriptionSummary = dashboard?.activeSubscriptionSummary || null
  const hasSubscriptionData = Boolean(subscriptionSummary)
  const hasLiveData =
    workoutLive.length > 0 || dietLive.length > 0 || progressLive.length > 0 || hasSubscriptionData

  const workoutPlans = workoutLive
  const dietPlans = dietLive
  const progressEntries = progressLive
  const subscriptionStatusLabel = subscriptionSummary?.status
    ? formatStatusLabel(subscriptionSummary.status)
    : 'None'

  const metrics = [
    { label: 'Assigned Workout Plans', value: workoutPlans.length, hint: 'Current training blocks' },
    { label: 'Assigned Diet Plans', value: dietPlans.length, hint: 'Nutrition protocols' },
    { label: 'Recent Progress Entries', value: progressEntries.length, hint: 'Logged performance' },
    { label: 'Subscription Status', value: subscriptionStatusLabel, hint: 'Membership lifecycle' },
  ]

  const reminders = [
    'Log your first progress entry after your initial assessment',
    'Ask your trainer for workout and diet assignments if this page is empty',
    'Check whether your membership is still pending activation or already active',
  ]

  return (
    <DashboardLayout title="Member">
      {error && <StatusBanner message={error} />}
      {!hasLiveData && !dashboardQuery.isPending && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
          Live mode: this dashboard will populate after plans and progress data are assigned.
        </p>
      )}

      <section className="border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-[10px]">
        <h2 className="text-xl font-black uppercase tracking-[0.08em] text-white">Welcome, {displayName}</h2>
        <p className="mt-4 border-l-4 border-[#ff8b5f] pl-3 text-sm font-semibold text-gray-300">
          Review your assigned plans and recent fitness progress below.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <article key={item.label} className="min-w-0 border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{item.label}</p>
            <p className="mt-2 break-words text-3xl font-black leading-tight text-white">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px] lg:col-span-2">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Assigned Workout Plans</h2>
          <div className="mt-4 space-y-3">
            {workoutPlans.length === 0 && (
              <p className="text-sm text-gray-300">No workout plan assigned yet.</p>
            )}
            {workoutPlans.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-2 border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#ff8b5f]">{entry.title}</p>
                  <p className="mt-1 text-base font-semibold text-white">{entry.description}</p>
                </div>
                <p className="text-sm font-medium text-gray-300">Updated: {formatDate(entry.updatedAt)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Assigned Diet Plans</h2>
          <div className="mt-4 space-y-3">
            {dietPlans.length === 0 && (
              <p className="text-sm text-gray-300">No diet plan assigned yet.</p>
            )}
            {dietPlans.map((item) => (
              <div key={item.id} className="border-l-2 border-[#ff8b5f] bg-black/30 px-3 py-2">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-sm text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Recent Progress</h2>
          <div className="mt-4 grid gap-3">
            {progressEntries.length === 0 && (
              <p className="text-sm text-gray-300">No progress entries found.</p>
            )}
            {progressEntries.map((entry) => (
              <div key={entry.id} className="border border-white/10 bg-black/30 p-3">
                <p className="text-sm font-semibold text-gray-300">
                  {formatDate(entry.recordedAt)} | Weight: {entry.weight ?? '-'} | Body Fat: {entry.bodyFat ?? '-'} | BMI: {entry.bmi ?? '-'}
                </p>
                {entry.notes && <p className="mt-1 text-sm text-gray-300">{entry.notes}</p>}
              </div>
            ))}
          </div>
        </article>

        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Subscription</h2>
          <div className="mt-4 space-y-3">
            <div className="border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Active Plan</p>
              <p className="mt-1 text-lg font-black text-white">
                {subscriptionSummary?.planName || 'No current membership'}
              </p>
            </div>
            <div className="border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
                {subscriptionSummary?.status === 'PENDING_ACTIVATION' ? 'Activation State' : 'Current Period Ends'}
              </p>
              <p className="mt-1 text-lg font-black text-white">
                {subscriptionSummary?.status === 'PENDING_ACTIVATION'
                  ? 'Waiting for payment completion'
                  : subscriptionSummary?.endDate
                    ? formatDate(subscriptionSummary.endDate)
                    : '-'}
              </p>
            </div>
            {subscriptionSummary?.status && (
              <div className="border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Lifecycle Status</p>
                <p className="mt-1 text-lg font-black text-white">
                  {subscriptionStatusLabel}
                </p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Daily Reminders</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {reminders.map((item) => (
            <div key={item} className="border-l-2 border-[#ff8b5f] bg-black/30 px-3 py-2">
              <p className="text-sm text-gray-300">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}
