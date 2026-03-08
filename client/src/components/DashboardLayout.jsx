import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Dumbbell, CreditCard, Activity } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function roleDashboardPath(role) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'TRAINER') return '/trainer'
  return '/member'
}

const navItems = [
  { to: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/plans', label: 'Plans', icon: Dumbbell },
  { to: '/subscriptions', label: 'Memberships', icon: CreditCard },
  { to: '/progress', label: 'Progress', icon: Activity },
]

export default function DashboardLayout({ children, title = 'Dashboard' }) {
  const { user } = useAuth()
  const location = useLocation()
  const dashboardPath = roleDashboardPath(user?.role)
  const roleLabel = user?.role ? `${user.role} Workspace` : 'Workspace'

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,rgba(226,26,44,0.16),transparent_32%),radial-gradient(circle_at_85%_95%,rgba(255,132,72,0.15),transparent_30%),linear-gradient(140deg,#070a0f_0%,#0f1620_54%,#0b1017_100%)] text-white">
      <div className="mx-auto flex w-full max-w-7xl gap-4 px-3 py-4 md:px-6 md:py-6">
        <aside className="sticky top-20 hidden h-[calc(100vh-7rem)] w-72 flex-col rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-[20px] md:flex">
          <div className="mb-6 border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#ff8b5f]">Gym OS</p>
            <p className="mt-1 text-xl font-black tracking-[0.06em]">TFG Command</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">{roleLabel}</p>
          </div>
          <nav className="space-y-2.5">
            {navItems.map((item) => {
              const to = item.to === 'dashboard' ? dashboardPath : item.to
              const active = location.pathname === to
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={to}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-gradient-to-r from-[#E21A2C]/30 to-[#ff7a45]/20 text-white ring-1 ring-[#ff8b5f]/70'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-[#ff8b5f]' : 'text-gray-400 group-hover:text-white'} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#ff8b5f]">Environment</p>
            <p className="mt-1 text-sm font-semibold text-white">Production-ready preview</p>
            <p className="mt-1 text-xs text-gray-300">Role-safe navigation and live API metrics enabled.</p>
          </div>
        </aside>

        <main className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-[20px] md:p-6">
          <header className="mb-5 border-b border-white/10 pb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff8b5f]">{roleLabel}</p>
            <h1 className="mt-1 text-xl font-black uppercase tracking-[0.12em] md:text-2xl">{title}</h1>
          </header>

          <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {navItems.map((item) => {
              const to = item.to === 'dashboard' ? dashboardPath : item.to
              const active = location.pathname === to
              const Icon = item.icon
              return (
                <Link
                  key={`mobile-${item.label}`}
                  to={to}
                  className={`flex items-center gap-2 whitespace-nowrap border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] ${
                    active
                      ? 'border-[#ff8b5f] bg-[#E21A2C]/25 text-white'
                      : 'border-white/15 bg-white/5 text-gray-200'
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
