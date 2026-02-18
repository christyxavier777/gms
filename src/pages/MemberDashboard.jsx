import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

export default function MemberDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <DashboardLayout title="Member">
      <div>
        Member Dashboard
        <button onClick={() => { logout(); navigate('/'); }} className="ml-4 text-sm text-blue-600">Logout</button>
      </div>
    </DashboardLayout>
  )
}
