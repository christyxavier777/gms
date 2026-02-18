import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

export default function MemberDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <DashboardLayout title="Member">
      <div className="p-4 bg-white rounded-md shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Member Dashboard</h2>
          <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-blue-600 font-medium">Logout</button>
        </div>
        <p className="text-base font-medium mt-4">Welcome to your member dashboard.</p>
      </div>
    </DashboardLayout>
  )
}
