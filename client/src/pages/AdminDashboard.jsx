import DashboardLayout from '../components/DashboardLayout'

export default function AdminDashboard() {
  const kpis = [
    { label: 'Active Members', value: '412', trend: '+18 this week' },
    { label: 'Active Trainers', value: '16', trend: '2 on leave today' },
    { label: 'Monthly Revenue', value: '$38,450', trend: '+12.4% vs last month' },
    { label: 'Attendance Today', value: '267', trend: 'Peak at 6:30 PM' },
  ]

  const alerts = [
    { title: 'Membership Expiry Spike', detail: '28 memberships expire within 5 days. Prioritize renewals.' },
    { title: 'Trainer Capacity Risk', detail: 'Evening slots are at 92% utilization this week.' },
    { title: 'Pending Support Tickets', detail: '6 unresolved front-desk issues need assignment.' },
  ]

  const quickActions = [
    { title: 'Approve New Trainer', description: 'Review profile and enable role permissions.' },
    { title: 'Publish Offer Campaign', description: 'Launch discounted quarterly renewal push.' },
    { title: 'Review Attendance Outliers', description: 'Inspect members with sudden drop in visits.' },
    { title: 'Export Weekly Reports', description: 'Download operations and financial summaries.' },
  ]

  const recentActivity = [
    'New member registration: Aisha Khan',
    'Plan assignment updated: Strength Foundation Batch B',
    'Payment received: Quarterly plan (Member ID M-223)',
    'Trainer account locked after repeated failed logins',
    'Diet plan revised: Member ID M-147',
  ]

  return (
    <DashboardLayout title="Admin">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <article key={item.label} className="border border-[#2f2f2f] bg-[#111111] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#E21A2C]">{item.trend}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="border border-[#2f2f2f] bg-[#111111] p-5 lg:col-span-2">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Operations Snapshot</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Check-ins</p>
              <p className="mt-2 text-2xl font-black">1,824</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">Last 7 days</p>
            </div>
            <div className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Renewal Rate</p>
              <p className="mt-2 text-2xl font-black">84%</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">Current cycle</p>
            </div>
            <div className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Avg. Session Length</p>
              <p className="mt-2 text-2xl font-black">57 min</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">Floor analytics</p>
            </div>
            <div className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Open Tasks</p>
              <p className="mt-2 text-2xl font-black">13</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">Requires review</p>
            </div>
          </div>
        </article>

        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Priority Alerts</h2>
          <div className="mt-4 space-y-3">
            {alerts.map((alert) => (
              <div key={alert.title} className="border border-[#3a1c1f] bg-[#1A1A1A] p-3">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{alert.title}</p>
                <p className="mt-1 text-sm font-medium text-gray-300">{alert.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Admin Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            {quickActions.map((action) => (
              <button key={action.title} className="w-full border border-[#2f2f2f] bg-[#1A1A1A] p-4 text-left transition-colors hover:border-[#E21A2C]/70">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-white">{action.title}</p>
                <p className="mt-1 text-sm text-gray-300">{action.description}</p>
              </button>
            ))}
          </div>
        </article>

        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Recent Activity</h2>
          <div className="mt-4 space-y-3">
            {recentActivity.map((item) => (
              <div key={item} className="border-l-2 border-[#E21A2C] bg-[#1A1A1A] px-3 py-2">
                <p className="text-sm font-medium text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <div className="border border-[#2f2f2f] bg-[#111111] p-5">
        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">System Notes</h2>
        <p className="mt-3 border-l-4 border-[#E21A2C] pl-3 text-sm font-semibold text-gray-300">
          Weekly maintenance window is set for Sunday, 02:00 AM to 03:00 AM. Front-desk exports and trainer schedule sync should be completed before cutoff.
        </p>
      </div>
    </DashboardLayout>
  )
}
