import DashboardLoadingState from '../components/DashboardLoadingState'
import DashboardLayout from '../components/DashboardLayout'
import StatusBanner from '../components/StatusBanner'
import { useAuth } from '../context/AuthContext'
import { getServerStateErrorMessage } from '../server-state/errors'
import { useAdminDashboardQuery } from '../server-state/queries'

export default function AdminDashboard() {
  const { token } = useAuth()
  const dashboardQuery = useAdminDashboardQuery(token)
  const dashboard = dashboardQuery.data?.dashboard ?? null
  const error = dashboardQuery.error
    ? getServerStateErrorMessage(dashboardQuery.error, 'Failed to load admin dashboard.')
    : ''

  if (dashboardQuery.isPending) {
    return (
      <DashboardLayout title="Admin">
        <DashboardLoadingState label="Loading admin dashboard" summaryCount={6} />
      </DashboardLayout>
    )
  }

  const hasLiveStats =
    dashboard &&
    [
      dashboard.totalUsers,
      dashboard.activeMembers,
      dashboard.activeSubscriptions,
      dashboard.expiredSubscriptions,
      dashboard.totalTrainers,
      dashboard.totalPlans,
    ].some((value) => Number(value) > 0)

  const kpis = [
    { label: 'Total Users', value: Number(dashboard?.totalUsers ?? 0), hint: 'All roles' },
    { label: 'Active Members', value: Number(dashboard?.activeMembers ?? 0), hint: 'Currently training' },
    { label: 'Active Subscriptions', value: Number(dashboard?.activeSubscriptions ?? 0), hint: 'Revenue-active' },
    { label: 'Expired Subscriptions', value: Number(dashboard?.expiredSubscriptions ?? 0), hint: 'Renewal pipeline' },
    { label: 'Total Trainers', value: Number(dashboard?.totalTrainers ?? 0), hint: 'Coaching staff' },
    { label: 'Total Plans', value: Number(dashboard?.totalPlans ?? 0), hint: 'Workout + diet' },
  ]

  const alerts = hasLiveStats
    ? [
        `${Number(dashboard?.expiredSubscriptions ?? 0)} subscriptions need renewal review`,
        `${Number(dashboard?.totalPlans ?? 0)} total plans are currently available`,
        `${Number(dashboard?.totalTrainers ?? 0)} trainers are active in the system`,
      ]
    : ['No live admin metrics yet. Create users, plans, and subscriptions to populate this dashboard.']

  const quickActions = [
    'Review onboarding and create your first trainer/member accounts',
    'Create baseline workout and diet plans for assignments',
    'Seed or import subscription data before going live',
    'Confirm deploy environment variables and health checks',
  ]

  return (
    <DashboardLayout title="Admin">
      {error && <StatusBanner message={error} />}
      {!hasLiveStats && !dashboardQuery.isPending && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
          Live mode: this dashboard will populate as real data is created.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item) => (
          <article key={item.label} className="border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-[10px]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Priority Alerts</h2>
          <div className="mt-4 space-y-3">
            {alerts.map((item) => (
              <div key={item} className="border-l-2 border-[#ff8b5f] bg-black/30 px-3 py-2">
                <p className="text-sm text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Operations Queue</h2>
          <div className="mt-4 space-y-3">
            {quickActions.map((item) => (
              <div key={item} className="border border-white/10 bg-black/30 px-3 py-2">
                <p className="text-sm font-medium text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardLayout>
  )
}
