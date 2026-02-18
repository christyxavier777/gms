import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function MemberDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div>
      Member Dashboard
      <button onClick={() => { logout(); navigate('/'); }}>Logout</button>
    </div>
  )
}
