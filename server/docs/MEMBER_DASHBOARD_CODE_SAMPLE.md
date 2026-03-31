# Member Dashboard Code Sample

This is a document-ready sample based on the actual member dashboard UI in this project.

Original source file:
- `client/src/pages/MemberDashboard.jsx`

```jsx
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

export default function MemberDashboard() {
  const { user, token } = useAuth()
  const dashboardQuery = useMemberDashboardQuery(token, 8)
  const dashboard = dashboardQuery.data?.dashboard ?? null
  const error = dashboardQuery.error
    ? getServerStateErrorMessage(dashboardQuery.error, 'Failed to load member dashboard.')
    : ''

  if (dashboardQuery.isPending) {
    return (
      <DashboardLayout title="Member">
        <DashboardLoadingState label="Loading member dashboard" />
      </DashboardLayout>
    )
  }

  const workoutPlans = dashboard?.assignedWorkoutPlans || []
  const dietPlans = dashboard?.assignedDietPlans || []
  const progressEntries = dashboard?.recentProgressEntries || []
  const subscriptionSummary = dashboard?.activeSubscriptionSummary || null
  const displayName = user?.email ? user.email.split('@')[0] : 'Member'

  const metrics = [
    { label: 'Assigned Workout Plans', value: workoutPlans.length, hint: 'Current training blocks' },
    { label: 'Assigned Diet Plans', value: dietPlans.length, hint: 'Nutrition protocols' },
    { label: 'Recent Progress Entries', value: progressEntries.length, hint: 'Logged performance' },
    { label: 'Subscription Status', value: subscriptionSummary?.status || 'None', hint: 'Membership lifecycle' },
  ]

  return (
    <DashboardLayout title="Member">
      {error && <StatusBanner message={error} />}

      <section className="border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-black uppercase text-white">Welcome, {displayName}</h2>
        <p className="mt-4 text-sm text-gray-300">
          Review your assigned plans and recent fitness progress below.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <article key={item.label} className="border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase text-gray-300">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs uppercase text-[#ff8b5f]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-black uppercase text-white">Recent Progress</h2>
          <div className="mt-4 grid gap-3">
            {progressEntries.map((entry) => (
              <div key={entry.id} className="border border-white/10 bg-black/30 p-3">
                <p className="text-sm text-gray-300">
                  {formatDate(entry.recordedAt)} | Weight: {entry.weight ?? '-'} | BMI: {entry.bmi ?? '-'}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-black uppercase text-white">Subscription</h2>
          <div className="mt-4 space-y-3">
            <div className="border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase text-gray-300">Active Plan</p>
              <p className="mt-1 text-lg font-black text-white">
                {subscriptionSummary?.planName || 'No current membership'}
              </p>
            </div>
            <div className="border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase text-gray-300">Current Period Ends</p>
              <p className="mt-1 text-lg font-black text-white">
                {subscriptionSummary?.endDate ? formatDate(subscriptionSummary.endDate) : '-'}
              </p>
            </div>
          </div>
        </article>
      </section>
    </DashboardLayout>
  )
}
```

Suggested caption:

`Sample code for the member dashboard showing plans, progress entries, and subscription details.`
