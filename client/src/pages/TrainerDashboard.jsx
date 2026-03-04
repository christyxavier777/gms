import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

function formatDate(date) {
  try {
    return new Date(date).toLocaleString()
  } catch (_error) {
    return date
  }
}

export default function TrainerDashboard() {
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
        const data = await api.getTrainerDashboard(token, 8)
        setDashboard(data.dashboard)
      } catch (err) {
        setError(err?.message || 'Failed to load trainer dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [token])

  const stats = [
    { label: 'Assigned Members', value: dashboard?.assignedMembersCount ?? 0 },
    { label: 'Plans Created', value: dashboard?.plansCreatedByTrainer ?? 0 },
    { label: 'Recent Progress Entries', value: dashboard?.recentProgressEntries?.length ?? 0 },
  ]

  return (
    <DashboardLayout title="Trainer">
      {loading && <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Loading dashboard...</p>}
      {error && <p className="text-sm font-semibold text-[#E21A2C]">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="border border-[#2f2f2f] bg-[#111111] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="border border-[#2f2f2f] bg-[#111111] p-5">
        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Recent Progress</h2>
        <div className="mt-4 space-y-3">
          {(dashboard?.recentProgressEntries || []).length === 0 && (
            <p className="text-sm text-gray-300">No recent progress entries for assigned members.</p>
          )}
          {(dashboard?.recentProgressEntries || []).map((entry) => (
            <div key={entry.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#E21A2C]">
                Member ID: {entry.userId}
              </p>
              <p className="mt-1 text-sm text-gray-300">Recorded: {formatDate(entry.recordedAt)}</p>
              <p className="mt-1 text-sm text-gray-300">
                Weight: {entry.weight ?? '-'} | Body Fat: {entry.bodyFat ?? '-'} | BMI: {entry.bmi ?? '-'}
              </p>
              {entry.notes && <p className="mt-1 text-sm text-gray-300">Notes: {entry.notes}</p>}
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}
