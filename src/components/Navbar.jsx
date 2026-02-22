import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  let dashboardPath = null
  if (user) {
    const role = user.role
    if (role === 'admin') dashboardPath = '/admin'
    else if (role === 'trainer') dashboardPath = '/trainer'
    else dashboardPath = '/member'
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E21A2C]/30 bg-[#1A1A1A] py-3">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4">
        <h2 className="text-xl font-black uppercase tracking-[0.14em] text-white md:text-2xl">Gym Management</h2>
        <ul className="flex space-x-6 items-center">
          {user === null ? (
            <>
              <li><Link to="/login" className="text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:text-[#E21A2C]">Login</Link></li>
              <li><Link to="/register" className="text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:text-[#E21A2C]">Register</Link></li>
            </>
          ) : (
            <>
              <li>
                <Link to={dashboardPath} className="text-sm font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:text-[#E21A2C]">Dashboard</Link>
              </li>
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
