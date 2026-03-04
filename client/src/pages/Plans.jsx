import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function Plans() {
  const { token, user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'TRAINER'

  const [workoutPlans, setWorkoutPlans] = useState([])
  const [dietPlans, setDietPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [workoutTitle, setWorkoutTitle] = useState('')
  const [workoutDescription, setWorkoutDescription] = useState('')
  const [dietTitle, setDietTitle] = useState('')
  const [dietDescription, setDietDescription] = useState('')

  const [workoutAssign, setWorkoutAssign] = useState({})
  const [dietAssign, setDietAssign] = useState({})

  const loadPlans = async () => {
    if (!token) return
    try {
      setLoading(true)
      setError('')
      const [workoutData, dietData] = await Promise.all([
        api.listWorkoutPlans(token),
        api.listDietPlans(token),
      ])
      setWorkoutPlans(workoutData.plans || [])
      setDietPlans(dietData.plans || [])
    } catch (err) {
      setError(err?.message || 'Failed to load plans.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [token])

  const handleCreateWorkout = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      await api.createWorkoutPlan(token, {
        title: workoutTitle,
        description: workoutDescription,
      })
      setWorkoutTitle('')
      setWorkoutDescription('')
      setSuccess('Workout plan created.')
      await loadPlans()
    } catch (err) {
      setError(err?.message || 'Failed to create workout plan.')
    }
  }

  const handleCreateDiet = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      await api.createDietPlan(token, {
        title: dietTitle,
        description: dietDescription,
      })
      setDietTitle('')
      setDietDescription('')
      setSuccess('Diet plan created.')
      await loadPlans()
    } catch (err) {
      setError(err?.message || 'Failed to create diet plan.')
    }
  }

  const handleAssignWorkout = async (planId) => {
    try {
      setError('')
      setSuccess('')
      await api.assignWorkoutPlan(token, planId, workoutAssign[planId] || '')
      setSuccess('Workout plan assigned.')
      await loadPlans()
    } catch (err) {
      setError(err?.message || 'Failed to assign workout plan.')
    }
  }

  const handleAssignDiet = async (planId) => {
    try {
      setError('')
      setSuccess('')
      await api.assignDietPlan(token, planId, dietAssign[planId] || '')
      setSuccess('Diet plan assigned.')
      await loadPlans()
    } catch (err) {
      setError(err?.message || 'Failed to assign diet plan.')
    }
  }

  return (
    <DashboardLayout title="Plans">
      {loading && <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Loading plans...</p>}
      {error && <p className="text-sm font-semibold text-[#E21A2C]">{error}</p>}
      {success && <p className="text-sm font-semibold text-green-400">{success}</p>}

      {canManage && (
        <section className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={handleCreateWorkout} className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Create Workout Plan</h2>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={workoutTitle}
                onChange={(e) => setWorkoutTitle(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
              <textarea
                placeholder="Description"
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
              <button
                type="submit"
                disabled={!workoutTitle || !workoutDescription}
                className="border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
              >
                Create Workout
              </button>
            </div>
          </form>

          <form onSubmit={handleCreateDiet} className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Create Diet Plan</h2>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={dietTitle}
                onChange={(e) => setDietTitle(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
              <textarea
                placeholder="Description"
                value={dietDescription}
                onChange={(e) => setDietDescription(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
              <button
                type="submit"
                disabled={!dietTitle || !dietDescription}
                className="border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
              >
                Create Diet
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Workout Plans</h2>
          <div className="mt-4 space-y-3">
            {workoutPlans.length === 0 && <p className="text-sm text-gray-300">No workout plans found.</p>}
            {workoutPlans.map((plan) => (
              <div key={plan.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{plan.title}</p>
                <p className="mt-1 text-sm text-gray-300">{plan.description}</p>
                <p className="mt-1 text-xs text-gray-400">Assigned To: {plan.assignedToId || 'Not assigned'}</p>
                {canManage && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Member UUID"
                      value={workoutAssign[plan.id] || ''}
                      onChange={(e) =>
                        setWorkoutAssign((prev) => ({ ...prev, [plan.id]: e.target.value }))
                      }
                      className="flex-1 border border-[#333333] bg-[#111111] px-2 py-1 text-sm text-white outline-none focus:border-[#E21A2C]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAssignWorkout(plan.id)}
                      className="border border-[#E21A2C] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>

        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Diet Plans</h2>
          <div className="mt-4 space-y-3">
            {dietPlans.length === 0 && <p className="text-sm text-gray-300">No diet plans found.</p>}
            {dietPlans.map((plan) => (
              <div key={plan.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{plan.title}</p>
                <p className="mt-1 text-sm text-gray-300">{plan.description}</p>
                <p className="mt-1 text-xs text-gray-400">Assigned To: {plan.assignedToId || 'Not assigned'}</p>
                {canManage && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Member UUID"
                      value={dietAssign[plan.id] || ''}
                      onChange={(e) => setDietAssign((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                      className="flex-1 border border-[#333333] bg-[#111111] px-2 py-1 text-sm text-white outline-none focus:border-[#E21A2C]"
                    />
                    <button
                      type="button"
                      onClick={() => handleAssignDiet(plan.id)}
                      className="border border-[#E21A2C] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white"
                    >
                      Assign
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>
    </DashboardLayout>
  )
}
