import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return date
  }
}

export default function MemberDashboard() {
  const { user, token } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const displayName = user?.email ? user.email.split('@')[0] : 'Member'

  useEffect(() => {
    const loadDashboard = async () => {
      if (!token) return
      try {
        setLoading(true)
        setError('')
        const data = await api.getMemberDashboard(token, 8)
        setDashboard(data.dashboard)
      } catch (err) {
        setError(err?.message || 'Failed to load member dashboard.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [token])

  const workoutLive = dashboard?.assignedWorkoutPlans || []
  const dietLive = dashboard?.assignedDietPlans || []
  const progressLive = dashboard?.recentProgressEntries || []
  const hasLiveData = workoutLive.length > 0 || dietLive.length > 0 || progressLive.length > 0

  const workoutPlans = hasLiveData
    ? workoutLive
    : [
        { id: 'w-1', title: 'Push Strength + Core', description: 'Bench, incline DB, cable fly, planks', updatedAt: new Date().toISOString() },
        { id: 'w-2', title: 'Lower Body Progressive', description: 'Back squat, RDL, split squat, calf raises', updatedAt: new Date().toISOString() },
      ]
  const dietPlans = hasLiveData
    ? dietLive
    : [
        { id: 'd-1', title: 'Lean Gain Plan', description: '2,450 kcal / high protein / 5 meals' },
        { id: 'd-2', title: 'Rest Day Nutrition', description: '2,150 kcal / lower carbs / hydration focus' },
      ]
  const progressEntries = hasLiveData
    ? progressLive
    : [
        { id: 'p-1', recordedAt: new Date().toISOString(), weight: 74.8, bodyFat: 19.2, bmi: 24.3, notes: 'Strength endurance improved.' },
        { id: 'p-2', recordedAt: new Date(Date.now() - 86400000 * 7).toISOString(), weight: 75.4, bodyFat: 19.9, bmi: 24.6, notes: 'Recovery and sleep quality improved.' },
      ]

  const metrics = [
    { label: 'Assigned Workout Plans', value: workoutPlans.length, hint: 'Current training blocks' },
    { label: 'Assigned Diet Plans', value: dietPlans.length, hint: 'Nutrition protocols' },
    { label: 'Recent Progress Entries', value: progressEntries.length, hint: 'Logged performance' },
    { label: 'Subscription Status', value: dashboard?.activeSubscriptionSummary?.status ?? (hasLiveData ? 'NONE' : 'ACTIVE'), hint: 'Membership lifecycle' },
  ]

  const reminders = [
    'Hydration target today: 3.5L',
    'Upload meal logs before 9:00 PM',
    'Recovery stretch routine after workout',
  ]

  return (
    <DashboardLayout title="Member">
      {loading && <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Loading dashboard...</p>}
      {error && <p className="text-sm font-semibold text-[#E21A2C]">{error}</p>}
      {!hasLiveData && !loading && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
          Presentation mode: showing representative member journey data.
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
          <article key={item.label} className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
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
                {dashboard?.activeSubscriptionSummary?.planName || (hasLiveData ? 'No active plan' : 'Pro Quarterly')}
              </p>
            </div>
            <div className="border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Next Billing Date</p>
              <p className="mt-1 text-lg font-black text-white">
                {dashboard?.activeSubscriptionSummary?.endDate
                  ? formatDate(dashboard.activeSubscriptionSummary.endDate)
                  : hasLiveData
                    ? '-'
                    : 'March 28, 2026'}
              </p>
            </div>
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
