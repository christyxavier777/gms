import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

function formatDate(date) {
  try {
    return new Date(date).toLocaleString()
  } catch {
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

  const liveEntries = dashboard?.recentProgressEntries || []
  const demoEntries = [
    {
      id: 'demo-1',
      userId: 'MEM-104',
      recordedAt: new Date().toISOString(),
      weight: 78.4,
      bodyFat: 22.1,
      bmi: 25.5,
      notes: 'Improved squat depth and knee stability.',
    },
    {
      id: 'demo-2',
      userId: 'MEM-088',
      recordedAt: new Date(Date.now() - 86400000).toISOString(),
      weight: 64.2,
      bodyFat: 18.9,
      bmi: 22.2,
      notes: 'Cardio adherence up to 5 sessions/week.',
    },
  ]
  const entries = liveEntries.length > 0 ? liveEntries : demoEntries

  const assignedMembers = Number(dashboard?.assignedMembersCount ?? 0)
  const plansCreated = Number(dashboard?.plansCreatedByTrainer ?? 0)
  const isPresentationMode = assignedMembers === 0 && plansCreated === 0 && liveEntries.length === 0

  const stats = [
    { label: 'Assigned Members', value: isPresentationMode ? 34 : assignedMembers, hint: 'Current roster' },
    { label: 'Plans Created', value: isPresentationMode ? 27 : plansCreated, hint: 'Workout + diet' },
    { label: 'Recent Progress Entries', value: entries.length, hint: 'Latest updates' },
  ]

  const todaySchedule = [
    { time: '06:30 AM', member: 'Rahul Mehta', focus: 'Lower Body Strength' },
    { time: '08:00 AM', member: 'Sara Collins', focus: 'Conditioning + Core' },
    { time: '05:30 PM', member: 'Neha Sharma', focus: 'Hypertrophy Day 3' },
  ]

  return (
    <DashboardLayout title="Trainer">
      {loading && <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Loading dashboard...</p>}
      {error && <p className="text-sm font-semibold text-[#E21A2C]">{error}</p>}
      {isPresentationMode && !loading && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
          Presentation mode: showing representative trainer activity.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-[10px]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px] lg:col-span-2">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Recent Progress</h2>
          <div className="mt-4 space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#ff8b5f]">
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
        </article>

        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Today Schedule</h2>
          <div className="mt-4 space-y-3">
            {todaySchedule.map((session) => (
              <div key={`${session.time}-${session.member}`} className="border border-white/10 bg-black/30 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#ff8b5f]">{session.time}</p>
                <p className="mt-1 text-sm font-semibold text-white">{session.member}</p>
                <p className="text-sm text-gray-300">{session.focus}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Coach Notes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {['Warm-up review pending', '2 reassessments due', 'Nutrition audit on Friday'].map((note) => (
            <div key={note} className="border-l-2 border-[#ff8b5f] bg-black/30 px-3 py-2">
              <p className="text-sm text-gray-300">{note}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}
