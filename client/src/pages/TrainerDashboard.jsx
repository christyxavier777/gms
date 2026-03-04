import DashboardLayout from '../components/DashboardLayout'

export default function TrainerDashboard() {
  const trainerStats = [
    { label: 'Sessions Today', value: '9', note: '2 completed, 7 upcoming' },
    { label: 'Assigned Members', value: '34', note: '4 high-priority follow-ups' },
    { label: 'Plan Updates', value: '12', note: 'Pending approval: 3' },
    { label: 'Avg. Adherence', value: '86%', note: '+4% vs last week' },
  ]

  const todaySchedule = [
    { time: '06:30 AM', member: 'Rahul Mehta', focus: 'Lower Body Strength' },
    { time: '08:00 AM', member: 'Sara Collins', focus: 'Fat Loss Conditioning' },
    { time: '11:00 AM', member: 'Ibrahim Khan', focus: 'Mobility + Rehab' },
    { time: '05:30 PM', member: 'Neha Sharma', focus: 'Hypertrophy Split Day 3' },
    { time: '07:00 PM', member: 'Aman Verma', focus: 'Athletic Performance Block' },
  ]

  const memberCheckins = [
    { name: 'M-147 / Rohan', status: 'Check-in done', detail: 'Weight update pending' },
    { name: 'M-223 / Priya', status: 'Missed session', detail: 'Reschedule requested' },
    { name: 'M-109 / Alex', status: 'On track', detail: 'Completed all assigned sets' },
    { name: 'M-184 / Jiya', status: 'Diet non-compliant', detail: 'Nutrition call suggested' },
  ]

  const tasks = [
    'Approve warm-up template for beginner batch',
    'Submit weekly progress remarks for members M-101 to M-120',
    'Coordinate with admin for extra evening slot on Friday',
    'Review injury-safe alternatives for lower-back pain group',
  ]

  return (
    <DashboardLayout title="Trainer">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {trainerStats.map((item) => (
          <article key={item.label} className="border border-[#2f2f2f] bg-[#111111] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#E21A2C]">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="border border-[#2f2f2f] bg-[#111111] p-5 lg:col-span-2">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Today&apos;s Schedule</h2>
          <div className="mt-4 space-y-3">
            {todaySchedule.map((session) => (
              <div key={`${session.time}-${session.member}`} className="flex flex-col gap-2 border border-[#2f2f2f] bg-[#1A1A1A] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{session.time}</p>
                  <p className="mt-1 text-base font-semibold text-white">{session.member}</p>
                </div>
                <p className="text-sm font-medium text-gray-300">{session.focus}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Coach Tasks</h2>
          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <div key={task} className="border-l-2 border-[#E21A2C] bg-[#1A1A1A] px-3 py-2">
                <p className="text-sm font-medium text-gray-300">{task}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="border border-[#2f2f2f] bg-[#111111] p-5">
        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Member Progress Watchlist</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {memberCheckins.map((entry) => (
            <div key={entry.name} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-white">{entry.name}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{entry.status}</p>
              <p className="mt-1 text-sm text-gray-300">{entry.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}
