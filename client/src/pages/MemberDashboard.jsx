import DashboardLoadingState from '../components/DashboardLoadingState'
import DashboardLayout from '../components/DashboardLayout'
import StatusBanner from '../components/StatusBanner'
import { useAuth } from '../context/AuthContext'
import { getServerStateErrorMessage } from '../server-state/errors'
import { useMemberDashboardQuery, useMySubscriptionsQuery, usePaymentsQuery } from '../server-state/queries'

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

function getSubscriptionTone(status) {
  if (status === 'ACTIVE') return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
  if (status === 'CANCELLED_AT_PERIOD_END') return 'border-[#ff8b5f]/30 bg-[#ff8b5f]/10 text-[#ffd3c4]'
  if (status === 'PENDING_ACTIVATION') return 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200'
  return 'border-white/10 bg-white/5 text-gray-200'
}

export default function MemberDashboard() {
  const { user, token } = useAuth()
  const dashboardQuery = useMemberDashboardQuery(token, 8)
  const subscriptionsQuery = useMySubscriptionsQuery(token)
  const paymentsQuery = usePaymentsQuery(
    token,
    { page: 1, pageSize: 50, sortBy: 'createdAt', sortOrder: 'desc' },
    { enabled: Boolean(token) },
  )
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
  const subscriptionTimeline = subscriptionsQuery.data?.subscriptions ?? []
  const paymentTimeline = paymentsQuery.data?.payments ?? []
  const currentDate = new Date()
  const currentSubscription =
    subscriptionTimeline.find((subscription) =>
      subscription.status === 'ACTIVE' || subscription.status === 'CANCELLED_AT_PERIOD_END',
    ) ||
    dashboard?.activeSubscriptionSummary ||
    null
  const upcomingSubscription =
    subscriptionTimeline.find(
      (subscription) =>
        subscription.status === 'PENDING_ACTIVATION' && new Date(subscription.startDate) > currentDate,
    ) || null
  const successfulUpcomingSubscriptionIds = new Set(
    paymentTimeline
      .filter((payment) => payment.status === 'SUCCESS' && payment.subscriptionId)
      .map((payment) => payment.subscriptionId),
  )
  const bookedCoverageSubscription = subscriptionTimeline
    .filter((subscription) => {
      if (subscription.status === 'ACTIVE' || subscription.status === 'CANCELLED_AT_PERIOD_END') return true
      return (
        subscription.status === 'PENDING_ACTIVATION' &&
        successfulUpcomingSubscriptionIds.has(subscription.id) &&
        new Date(subscription.startDate) > currentDate
      )
    })
    .sort((left, right) => new Date(right.endDate).getTime() - new Date(left.endDate).getTime())[0] || null
  const subscriptionSummary = currentSubscription || dashboard?.activeSubscriptionSummary || null
  const hasSubscriptionData = Boolean(subscriptionSummary)
  const hasLiveData =
    workoutLive.length > 0 || dietLive.length > 0 || progressLive.length > 0 || hasSubscriptionData

  const workoutPlans = workoutLive
  const dietPlans = dietLive
  const progressEntries = progressLive
  const subscriptionStatusLabel = subscriptionSummary?.status
    ? formatStatusLabel(subscriptionSummary.status)
    : 'None'
  const subscriptionValidityLabel =
    subscriptionSummary?.status === 'PENDING_ACTIVATION'
      ? 'Awaiting payment'
      : subscriptionSummary?.endDate
        ? formatDate(subscriptionSummary.endDate)
        : 'Not available'
  const bookedCoverageLabel = bookedCoverageSubscription?.endDate
    ? formatDate(bookedCoverageSubscription.endDate)
    : subscriptionValidityLabel

  const metrics = [
    { label: 'Assigned Workout Plans', value: workoutPlans.length, hint: 'Current training blocks' },
    { label: 'Assigned Diet Plans', value: dietPlans.length, hint: 'Nutrition protocols' },
    { label: 'Recent Progress Entries', value: progressEntries.length, hint: 'Logged performance' },
    { label: 'Coverage Booked Till', value: bookedCoverageLabel, hint: 'Current plan plus paid renewals' },
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

      <section className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.2)] backdrop-blur-[12px]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff8b5f]">Member Workspace</p>
            <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] text-white">Welcome, {displayName}</h2>
            <p className="mt-4 border-l-4 border-[#ff8b5f] pl-3 text-sm font-semibold text-gray-300">
              Review your assigned plans, membership coverage, and recent fitness progress below.
            </p>
          </div>
          <div className={`border px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.16)] ${getSubscriptionTone(subscriptionSummary?.status)}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em]">Membership State</p>
            <p className="mt-1 text-lg font-black text-white">{subscriptionSummary?.planName || 'No active plan'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.1em]">
              {subscriptionSummary?.status ? subscriptionStatusLabel : 'Waiting for setup'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <article
            key={item.label}
            className="min-w-0 border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 backdrop-blur-[10px]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{item.label}</p>
            <p className="mt-2 break-words text-3xl font-black leading-tight text-white">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 backdrop-blur-[10px] lg:col-span-2">
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

        <article className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 backdrop-blur-[10px]">
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
        <article className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 backdrop-blur-[10px]">
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

        <article className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 backdrop-blur-[10px]">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Subscription</h2>
          <div className="mt-4 space-y-3">
            <div className="border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Active Plan</p>
              <p className="mt-1 text-lg font-black text-white">
                {subscriptionSummary?.planName || 'No current membership'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Membership Valid Till</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {subscriptionSummary?.status === 'PENDING_ACTIVATION'
                    ? 'Waiting for payment completion'
                    : subscriptionSummary?.endDate
                      ? formatDate(subscriptionSummary.endDate)
                      : '-'}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">
                  {subscriptionSummary?.status === 'PENDING_ACTIVATION'
                    ? 'Complete payment to begin this membership period'
                    : 'This is the date your current access window ends'}
                </p>
              </div>
              <div className="border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Coverage Booked Till</p>
                <p className="mt-1 text-2xl font-black text-white">{bookedCoverageLabel}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">
                  Includes current access and any already-paid renewal queued next.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`border p-4 ${getSubscriptionTone(subscriptionSummary?.status)}`}>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Lifecycle Status</p>
                <p className="mt-1 text-lg font-black text-white">
                  {subscriptionStatusLabel}
                </p>
              </div>
              <div className="border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Membership Window</p>
                <p className="mt-1 text-sm text-gray-300">
                  {subscriptionSummary?.startDate && subscriptionSummary?.endDate
                    ? `${formatDate(subscriptionSummary.startDate)} to ${formatDate(subscriptionSummary.endDate)}`
                    : 'No membership dates available yet.'}
                </p>
              </div>
            </div>
            {upcomingSubscription && (
              <div className="border border-[#ff8b5f]/20 bg-[linear-gradient(160deg,rgba(255,139,95,0.14),rgba(255,255,255,0.03))] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Upcoming Renewal</p>
                <p className="mt-1 text-lg font-black text-white">{upcomingSubscription.planName}</p>
                <p className="mt-1 text-sm text-gray-300">
                  Starts {formatDate(upcomingSubscription.startDate)} and runs until {formatDate(upcomingSubscription.endDate)}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">
                  Already paid. This plan begins after your current period ends.
                </p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5 backdrop-blur-[10px]">
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
