import DashboardLayout from '../components/DashboardLayout'

export default function TrainerDashboard() {
  return (
    <DashboardLayout title="Trainer">
      <div className="p-4 bg-white rounded-md shadow-sm">
        <h2 className="text-xl font-semibold">Trainer Dashboard</h2>
        <p className="text-base font-medium">Your schedule and trainees appear here.</p>
      </div>
    </DashboardLayout>
  )
}
