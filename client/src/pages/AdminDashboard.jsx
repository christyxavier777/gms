import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function AdminDashboard() {
  const { token } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token) return
      try {
        setLoading(true)
        setError('')
        const data = await api.getAdminDashboard(token)
        setDashboard(data.dashboard)
      } catch (err) {
        setError(err?.message || 'Failed to load admin dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [token])

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

  const source = hasLiveStats
    ? dashboard
    : {
        totalUsers: 486,
        activeMembers: 412,
        activeSubscriptions: 398,
        expiredSubscriptions: 26,
        totalTrainers: 16,
        totalPlans: 89,
      }

  const kpis = [
    { label: 'Total Users', value: source.totalUsers, hint: 'All roles' },
    { label: 'Active Members', value: source.activeMembers, hint: 'Currently training' },
    { label: 'Active Subscriptions', value: source.activeSubscriptions, hint: 'Revenue-active' },
    { label: 'Expired Subscriptions', value: source.expiredSubscriptions, hint: 'Renewal pipeline' },
    { label: 'Total Trainers', value: source.totalTrainers, hint: 'Coaching staff' },
    { label: 'Total Plans', value: source.totalPlans, hint: 'Workout + diet' },
  ]

  const alerts = [
    '12 memberships are expiring within 5 days',
    'Evening slot utilization reached 91%',
    '7 members require trainer reassignment',
  ]

  const quickActions = [
    'Create renewal campaign for monthly members',
    'Audit inactive members and call follow-up list',
    'Review trainer workload and re-balance slots',
    'Publish updated beginner transformation plan',
  ]

  return (
    <DashboardLayout title="Admin">
      {loading && <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Loading dashboard...</p>}
      {error && <p className="text-sm font-semibold text-[#E21A2C]">{error}</p>}
      {!hasLiveStats && !loading && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
          Presentation mode: showing representative sample metrics.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item) => (
          <article key={item.label} className="border border-[#2f2f2f] bg-[#111111] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#E21A2C]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Priority Alerts</h2>
          <div className="mt-4 space-y-3">
            {alerts.map((item) => (
              <div key={item} className="border-l-2 border-[#E21A2C] bg-[#1A1A1A] px-3 py-2">
                <p className="text-sm text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Operations Queue</h2>
          <div className="mt-4 space-y-3">
            {quickActions.map((item) => (
              <div key={item} className="border border-[#2f2f2f] bg-[#1A1A1A] px-3 py-2">
                <p className="text-sm font-medium text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardLayout>
  )
}
