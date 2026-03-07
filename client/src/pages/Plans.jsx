import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

export default function Plans() {
  const { token, user } = useAuth()
  const canCreate = user?.role === 'ADMIN' || user?.role === 'TRAINER'
  const canAssign = user?.role === 'ADMIN'
  const isAdmin = user?.role === 'ADMIN'

  const [workoutPlans, setWorkoutPlans] = useState([])
  const [dietPlans, setDietPlans] = useState([])
  const [members, setMembers] = useState([])
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
      const requests = [
        api.listWorkoutPlans(token),
        api.listDietPlans(token),
      ]
      if (isAdmin) {
        requests.push(api.listUsers(token))
      }
      const [workoutData, dietData, usersData] = await Promise.all(requests)
      setWorkoutPlans(workoutData.plans || [])
      setDietPlans(dietData.plans || [])
      if (isAdmin) {
        const memberUsers = (usersData?.users || []).filter((u) => u.role === 'MEMBER')
        setMembers(memberUsers)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load plans.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [token, isAdmin])

  const hasLiveData = workoutPlans.length > 0 || dietPlans.length > 0
  const demoWorkoutPlans = [
    { id: 'dw-1', title: 'Strength Foundation', description: '4-day split for beginner-to-intermediate members', assignedToId: 'MEM-108' },
    { id: 'dw-2', title: 'Fat Loss Conditioning', description: 'Circuit-based conditioning with progressive overload', assignedToId: 'MEM-204' },
  ]
  const demoDietPlans = [
    { id: 'dd-1', title: 'Lean Muscle Plan', description: 'High-protein balanced meal strategy', assignedToId: 'MEM-108' },
    { id: 'dd-2', title: 'Cutting Support Plan', description: 'Calorie-deficit friendly meal timing', assignedToId: 'MEM-204' },
  ]
  const displayedWorkoutPlans = hasLiveData ? workoutPlans : demoWorkoutPlans
  const displayedDietPlans = hasLiveData ? dietPlans : demoDietPlans

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
      {!hasLiveData && !loading && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
          Presentation mode: showing representative workout and diet plans.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-[#2f2f2f] bg-[#111111] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Workout Plans</p>
          <p className="mt-2 text-2xl font-black text-white">{displayedWorkoutPlans.length}</p>
        </article>
        <article className="border border-[#2f2f2f] bg-[#111111] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Diet Plans</p>
          <p className="mt-2 text-2xl font-black text-white">{displayedDietPlans.length}</p>
        </article>
        <article className="border border-[#2f2f2f] bg-[#111111] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Assigned Workout</p>
          <p className="mt-2 text-2xl font-black text-white">
            {displayedWorkoutPlans.filter((p) => p.assignedToId).length}
          </p>
        </article>
        <article className="border border-[#2f2f2f] bg-[#111111] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Assigned Diet</p>
          <p className="mt-2 text-2xl font-black text-white">
            {displayedDietPlans.filter((p) => p.assignedToId).length}
          </p>
        </article>
      </section>

      {canCreate && (
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
            {displayedWorkoutPlans.length === 0 && <p className="text-sm text-gray-300">No workout plans found.</p>}
            {displayedWorkoutPlans.map((plan) => (
              <div key={plan.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{plan.title}</p>
                <p className="mt-1 text-sm text-gray-300">{plan.description}</p>
                <p className="mt-1 text-xs text-gray-400">Assigned To: {plan.assignedToId || 'Not assigned'}</p>
                {canAssign && (
                  <div className="mt-3 flex gap-2">
                    {isAdmin ? (
                      <select
                        value={workoutAssign[plan.id] || ''}
                        onChange={(e) =>
                          setWorkoutAssign((prev) => ({ ...prev, [plan.id]: e.target.value }))
                        }
                        className="flex-1 border border-[#333333] bg-[#111111] px-2 py-1 text-sm text-white outline-none focus:border-[#E21A2C]"
                      >
                        <option value="">Select member</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Member UUID"
                        value={workoutAssign[plan.id] || ''}
                        onChange={(e) =>
                          setWorkoutAssign((prev) => ({ ...prev, [plan.id]: e.target.value }))
                        }
                        className="flex-1 border border-[#333333] bg-[#111111] px-2 py-1 text-sm text-white outline-none focus:border-[#E21A2C]"
                      />
                    )}
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
            {displayedDietPlans.length === 0 && <p className="text-sm text-gray-300">No diet plans found.</p>}
            {displayedDietPlans.map((plan) => (
              <div key={plan.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{plan.title}</p>
                <p className="mt-1 text-sm text-gray-300">{plan.description}</p>
                <p className="mt-1 text-xs text-gray-400">Assigned To: {plan.assignedToId || 'Not assigned'}</p>
                {canAssign && (
                  <div className="mt-3 flex gap-2">
                    {isAdmin ? (
                      <select
                        value={dietAssign[plan.id] || ''}
                        onChange={(e) => setDietAssign((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                        className="flex-1 border border-[#333333] bg-[#111111] px-2 py-1 text-sm text-white outline-none focus:border-[#E21A2C]"
                      >
                        <option value="">Select member</option>
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Member UUID"
                        value={dietAssign[plan.id] || ''}
                        onChange={(e) => setDietAssign((prev) => ({ ...prev, [plan.id]: e.target.value }))}
                        className="flex-1 border border-[#333333] bg-[#111111] px-2 py-1 text-sm text-white outline-none focus:border-[#E21A2C]"
                      />
                    )}
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




