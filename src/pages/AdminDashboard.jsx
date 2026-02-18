import DashboardLayout from '../components/DashboardLayout'

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin">
      <div className="p-4 bg-white rounded-md shadow-sm">
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        <p className="text-base font-medium">Overview and admin controls go here.</p>
      </div>
    </DashboardLayout>
  )
}
