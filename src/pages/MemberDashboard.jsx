import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

export default function MemberDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <DashboardLayout title="Member">
      <div className="border border-[#2f2f2f] bg-[#111111] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-[0.08em] text-white">Member Dashboard</h2>
          <button onClick={() => { logout(); navigate('/login'); }} className="border border-[#E21A2C] bg-[#1A1A1A] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#E21A2C]">Logout</button>
        </div>
        <p className="mt-4 border-l-4 border-[#E21A2C] pl-3 text-base font-semibold text-gray-300">Welcome to your member dashboard.</p>
      </div>
    </DashboardLayout>
  )
}
