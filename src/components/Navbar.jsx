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
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h2 className="text-white text-xl font-bold">Gym Management</h2>
        <ul className="flex space-x-4 items-center">
          {user === null ? (
            <>
              <li><Link to="/" className="text-white hover:text-gray-200">Login</Link></li>
              <li><Link to="/register" className="text-white hover:text-gray-200">Register</Link></li>
            </>
          ) : (
            <>
              <li>
                <Link to={dashboardPath} className="text-white hover:text-gray-200">Dashboard</Link>
              </li>
              <li>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-white hover:text-gray-200 bg-transparent"
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
