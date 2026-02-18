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
    <nav className="bg-blue-600 py-3">
      <div className="container mx-auto flex justify-between items-center px-4">
        <h2 className="text-white text-2xl font-semibold">Gym Management</h2>
        <ul className="flex space-x-6 items-center">
          {user === null ? (
            <>
              <li><Link to="/" className="text-white hover:text-gray-200 text-base font-medium">Login</Link></li>
              <li><Link to="/register" className="text-white hover:text-gray-200 text-base font-medium">Register</Link></li>
            </>
          ) : (
            <>
              <li>
                <Link to={dashboardPath} className="text-white hover:text-gray-200 text-base font-medium">Dashboard</Link>
              </li>
              <li>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-white hover:text-gray-200 bg-transparent text-base font-medium"
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
