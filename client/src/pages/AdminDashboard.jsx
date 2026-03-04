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

  const kpis = [
    { label: 'Total Users', value: dashboard?.totalUsers ?? 0 },
    { label: 'Active Members', value: dashboard?.activeMembers ?? 0 },
    { label: 'Active Subscriptions', value: dashboard?.activeSubscriptions ?? 0 },
    { label: 'Expired Subscriptions', value: dashboard?.expiredSubscriptions ?? 0 },
    { label: 'Total Trainers', value: dashboard?.totalTrainers ?? 0 },
    { label: 'Total Plans', value: dashboard?.totalPlans ?? 0 },
  ]

  return (
    <DashboardLayout title="Admin">
      {loading && <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Loading dashboard...</p>}
      {error && <p className="text-sm font-semibold text-[#E21A2C]">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item) => (
          <article key={item.label} className="border border-[#2f2f2f] bg-[#111111] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
          </article>
        ))}
      </section>
    </DashboardLayout>
  )
}
