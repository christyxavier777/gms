import DashboardLayout from '../components/DashboardLayout'

export default function TrainerDashboard() {
  return (
    <DashboardLayout title="Trainer">
      <div className="border border-[#2f2f2f] bg-[#111111] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <h2 className="text-xl font-black uppercase tracking-[0.08em] text-white">Trainer Dashboard</h2>
        <p className="mt-3 border-l-4 border-[#E21A2C] pl-3 text-base font-semibold text-gray-300">Your schedule and trainees appear here.</p>
      </div>
    </DashboardLayout>
  )
}
