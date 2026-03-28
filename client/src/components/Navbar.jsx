import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getWorkspaceNavItems } from '../navigation/workspaceNavigation'

export default function Navbar() {
  const { user, logout, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const workspaceNavItems = getWorkspaceNavItems(user?.role)
  const publicNavItems = [
    { to: '/login', label: 'Login' },
    { to: '/register', label: 'Register' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E21A2C]/30 bg-[#1A1A1A] py-3">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4">
        <h2 className="text-xl font-black uppercase tracking-[0.14em] text-white md:text-2xl">Gym Management</h2>
        <ul className="flex flex-wrap items-center gap-4 md:gap-6">
          {loading ? (
            <li>
              <span className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-400">
                Checking session...
              </span>
            </li>
          ) : user === null ? (
            publicNavItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`text-sm font-semibold uppercase tracking-[0.08em] transition-colors ${
                    location.pathname === item.to ? 'text-[#ff8b5f]' : 'text-white hover:text-[#E21A2C]'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))
          ) : (
            <>
              {workspaceNavItems.map((item) => (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    className={`text-sm font-semibold uppercase tracking-[0.08em] transition-colors ${
                      location.pathname === item.to ? 'text-[#ff8b5f]' : 'text-white hover:text-[#E21A2C]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="border border-[#E21A2C] bg-[#1A1A1A] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#E21A2C]"
                >
                  Logout
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  )
}
