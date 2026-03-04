import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../components/DashboardLayout'

export default function MemberDashboard() {
  const { user } = useAuth()
  const displayName = user?.email ? user.email.split('@')[0] : 'Member'

  const metrics = [
    { label: 'Current Weight', value: '74.8 kg', note: '-1.6 kg in 30 days' },
    { label: 'Body Fat', value: '19.2%', note: '-0.8% this month' },
    { label: 'Sessions Completed', value: '21', note: '4 this week' },
    { label: 'Diet Adherence', value: '82%', note: 'Target: 85%' },
  ]

  const workoutQueue = [
    { day: 'Monday', plan: 'Push Strength + Core', coach: 'Trainer: Arjun' },
    { day: 'Wednesday', plan: 'Lower Body Progressive Load', coach: 'Trainer: Arjun' },
    { day: 'Friday', plan: 'Conditioning Intervals', coach: 'Trainer: Arjun' },
    { day: 'Saturday', plan: 'Mobility and Recovery', coach: 'Trainer: Arjun' },
  ]

  const reminders = [
    'Renewal due in 8 days for Pro Quarterly Plan.',
    'Upload post-workout meal logs for Tuesday and Wednesday.',
    'Book your monthly progress review before Friday.',
  ]

  const recentProgress = [
    'Bench Press: 42.5 kg -> 47.5 kg',
    '5K Run Timing: 33:40 -> 31:10',
    'Average Daily Steps: 6,200 -> 8,100',
    'Waist Measurement: 91 cm -> 88 cm',
  ]

  return (
    <DashboardLayout title="Member">
      <section className="border border-[#2f2f2f] bg-[#111111] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <h2 className="text-xl font-black uppercase tracking-[0.08em] text-white">Welcome, {displayName}</h2>
        <p className="mt-4 border-l-4 border-[#E21A2C] pl-3 text-sm font-semibold text-gray-300">
          Your focus this week: complete 4 strength sessions and maintain at least 80% meal-plan adherence.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((item) => (
          <article key={item.label} className="border border-[#2f2f2f] bg-[#111111] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#E21A2C]">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="border border-[#2f2f2f] bg-[#111111] p-5 lg:col-span-2">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Workout Queue</h2>
          <div className="mt-4 space-y-3">
            {workoutQueue.map((entry) => (
              <div key={`${entry.day}-${entry.plan}`} className="flex flex-col gap-2 border border-[#2f2f2f] bg-[#1A1A1A] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{entry.day}</p>
                  <p className="mt-1 text-base font-semibold text-white">{entry.plan}</p>
                </div>
                <p className="text-sm font-medium text-gray-300">{entry.coach}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Reminders</h2>
          <div className="mt-4 space-y-3">
            {reminders.map((item) => (
              <div key={item} className="border-l-2 border-[#E21A2C] bg-[#1A1A1A] px-3 py-2">
                <p className="text-sm text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Recent Progress</h2>
          <div className="mt-4 grid gap-3">
            {recentProgress.map((entry) => (
              <div key={entry} className="border border-[#2f2f2f] bg-[#1A1A1A] p-3">
                <p className="text-sm font-semibold text-gray-300">{entry}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Subscription</h2>
          <div className="mt-4 space-y-3">
            <div className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Active Plan</p>
              <p className="mt-1 text-lg font-black text-white">Pro Quarterly</p>
            </div>
            <div className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Next Billing Date</p>
              <p className="mt-1 text-lg font-black text-white">March 7, 2026</p>
            </div>
            <div className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Assigned Trainer</p>
              <p className="mt-1 text-lg font-black text-white">Arjun Rao</p>
            </div>
          </div>
        </article>
      </section>
    </DashboardLayout>
  )
}
