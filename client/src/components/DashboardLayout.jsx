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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#2a2a2a_0%,_#111111_45%,_#090909_100%)] text-white">
      <div className="mx-auto flex w-full max-w-7xl gap-4 px-3 py-4 md:px-6 md:py-6">
        <aside className="sticky top-20 hidden h-[calc(100vh-7rem)] w-64 flex-col rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-[20px] md:flex">
          <div className="mb-6 border-b border-white/10 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Gym OS</p>
            <p className="mt-1 text-xl font-black tracking-[0.06em]">TFG Control</p>
          </div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const to = item.to === 'dashboard' ? dashboardPath : item.to
              const active = location.pathname === to
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'bg-[#E21A2C]/20 text-white ring-1 ring-[#E21A2C]/60'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="w-full rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-[20px] md:p-6">
          <header className="mb-5 border-b border-white/10 pb-4">
            <h1 className="text-xl font-black uppercase tracking-[0.12em] md:text-2xl">{title}</h1>
          </header>
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
