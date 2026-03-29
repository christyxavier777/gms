import { useId, useState } from 'react'
import DashboardLoadingState from '../components/DashboardLoadingState'
import DashboardLayout from '../components/DashboardLayout'
import MemberSelector from '../components/MemberSelector'
import StatusStack from '../components/StatusStack'
import WorkflowEmptyState from '../components/WorkflowEmptyState'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { getCombinedServerStateError } from '../server-state/errors'
import { useActionStatus } from '../server-state/action-status'
import { invalidatePlansQueries } from '../server-state/invalidation'
import { useServerActionMutation } from '../server-state/mutations'
import {
  useAccessibleMembersQuery,
  useDietPlansQuery,
  useWorkoutPlansQuery,
} from '../server-state/queries'

export default function Plans() {
  const baseId = useId()
  const { token, user } = useAuth()
  const canCreate = user?.role === 'ADMIN' || user?.role === 'TRAINER'
  const canAssign = user?.role === 'ADMIN'
  const canViewMemberDirectory = user?.role === 'ADMIN' || user?.role === 'TRAINER'
  const actionStatus = useActionStatus()

  const [workoutTitle, setWorkoutTitle] = useState('')
  const [workoutDescription, setWorkoutDescription] = useState('')
  const [dietTitle, setDietTitle] = useState('')
  const [dietDescription, setDietDescription] = useState('')

  const [workoutAssign, setWorkoutAssign] = useState({})
  const [dietAssign, setDietAssign] = useState({})
  const ids = {
    status: `${baseId}-status`,
    workoutTitle: `${baseId}-workout-title`,
    workoutDescription: `${baseId}-workout-description`,
    dietTitle: `${baseId}-diet-title`,
    dietDescription: `${baseId}-diet-description`,
  }
  const workoutPlansQuery = useWorkoutPlansQuery(token)
  const dietPlansQuery = useDietPlansQuery(token)
  const membersQuery = useAccessibleMembersQuery(token, { enabled: canViewMemberDirectory })
  const createWorkoutMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (payload) => api.createWorkoutPlan(token, payload),
    getSuccessMessage: 'Workout plan created.',
    getErrorMessage: 'Failed to create workout plan.',
    invalidate: ({ queryClient }) => invalidatePlansQueries(queryClient),
  })
  const createDietMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (payload) => api.createDietPlan(token, payload),
    getSuccessMessage: 'Diet plan created.',
    getErrorMessage: 'Failed to create diet plan.',
    invalidate: ({ queryClient }) => invalidatePlansQueries(queryClient),
  })
  const assignWorkoutMutation = useServerActionMutation({
    actionStatus,
    mutationFn: ({ planId, memberId }) => api.assignWorkoutPlan(token, planId, memberId),
    getSuccessMessage: 'Workout plan assigned.',
    getErrorMessage: 'Failed to assign workout plan.',
    invalidate: ({ queryClient }) => invalidatePlansQueries(queryClient),
  })
  const assignDietMutation = useServerActionMutation({
    actionStatus,
    mutationFn: ({ planId, memberId }) => api.assignDietPlan(token, planId, memberId),
    getSuccessMessage: 'Diet plan assigned.',
    getErrorMessage: 'Failed to assign diet plan.',
    invalidate: ({ queryClient }) => invalidatePlansQueries(queryClient),
  })
  const workoutPlans = workoutPlansQuery.data?.plans ?? []
  const dietPlans = dietPlansQuery.data?.plans ?? []
  const members = membersQuery.data?.members ?? []
  const loading =
    workoutPlansQuery.isPending ||
    dietPlansQuery.isPending ||
    (canViewMemberDirectory && membersQuery.isPending)
  const queryError = getCombinedServerStateError(
    [workoutPlansQuery, dietPlansQuery, membersQuery],
    'Failed to load plans.',
  )
  const hasStatusMessage = Boolean(actionStatus.errorMessage || actionStatus.successMessage || queryError)

  const hasLiveData = workoutPlans.length > 0 || dietPlans.length > 0
  const displayedWorkoutPlans = workoutPlans
  const displayedDietPlans = dietPlans
  const isTrainer = user?.role === 'TRAINER'
  const trainerHasNoRoster = isTrainer && members.length === 0
  const trainerHasNoPlans = isTrainer && !hasLiveData

  const getMemberSummary = (memberId) => members.find((member) => member.id === memberId) || null
  const formatAssignedMember = (memberId) => {
    if (!memberId) return 'Not assigned'
    if (user?.id === memberId) return `${user.name || 'Current member'} (${user.email})`
    const member = getMemberSummary(memberId)
    return member ? `${member.name} (${member.email})` : memberId
  }

  const handleCreateWorkout = async (e) => {
    e.preventDefault()
    try {
      await createWorkoutMutation.mutateAsync({
        title: workoutTitle,
        description: workoutDescription,
      })
      setWorkoutTitle('')
      setWorkoutDescription('')
    } catch (error) {
      void error
    }
  }

  const handleCreateDiet = async (e) => {
    e.preventDefault()
    try {
      await createDietMutation.mutateAsync({
        title: dietTitle,
        description: dietDescription,
      })
      setDietTitle('')
      setDietDescription('')
    } catch (error) {
      void error
    }
  }

  const handleAssignWorkout = async (planId) => {
    const memberId = workoutAssign[planId] || ''
    if (!memberId) {
      actionStatus.showError('Select a member before assigning a workout plan.')
      return
    }
    try {
      await assignWorkoutMutation.mutateAsync({ planId, memberId })
    } catch (error) {
      void error
    }
  }

  const handleAssignDiet = async (planId) => {
    const memberId = dietAssign[planId] || ''
    if (!memberId) {
      actionStatus.showError('Select a member before assigning a diet plan.')
      return
    }
    try {
      await assignDietMutation.mutateAsync({ planId, memberId })
    } catch (error) {
      void error
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Plans">
        <DashboardLoadingState label="Loading plans workspace" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Plans">
      <StatusStack
        id={ids.status}
        errorMessage={actionStatus.errorMessage || queryError}
        successMessage={actionStatus.successMessage}
      />
      {!hasLiveData && !loading && !isTrainer && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
          Live mode: this page will populate after workout and diet plans are created.
        </p>
      )}

      {!loading && trainerHasNoRoster && (
        <WorkflowEmptyState
          eyebrow="Trainer Workflow"
          title="Create plan templates while your roster is being assigned"
          description="You can already draft workout and diet plans here, but member assignment starts with admin. Once members are added to your trainer roster, admin can attach your plans to them."
          notes={[
            'Admins assign members to your trainer roster before they show up in your coaching directory.',
            'Plans you create now are reusable templates for those future assignments.',
            'Progress logging unlocks after roster members are available on the Progress page.',
          ]}
          actions={[
            { label: 'Open Trainer Dashboard', to: '/trainer' },
            { label: 'Open Progress', to: '/progress', variant: 'secondary' },
          ]}
        />
      )}

      {!loading && !trainerHasNoRoster && trainerHasNoPlans && (
        <WorkflowEmptyState
          eyebrow="First Plans"
          title="Your roster is ready for its first workout and diet templates"
          description="You already have assigned members. Create the first coaching plans now so admin can connect them to the right people and members can start seeing guidance in their dashboards."
          notes={[
            `${members.length} member${members.length === 1 ? '' : 's'} currently available in your trainer directory.`,
            'Workout and diet templates you create belong to your coaching workspace.',
            'Admins handle the final plan-to-member assignment in the current system.',
          ]}
          actions={[
            { label: 'Stay Here And Create Plans', to: '/plans' },
            { label: 'Open Dashboard', to: '/trainer', variant: 'secondary' },
          ]}
        />
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
          <form
            onSubmit={handleCreateWorkout}
            noValidate
            aria-describedby={hasStatusMessage ? ids.status : undefined}
            className="border border-[#2f2f2f] bg-[#111111] p-5"
          >
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Create Workout Plan</h2>
            {isTrainer && (
              <p className="mt-2 text-sm text-gray-300">
                Build the workout template here. Admin currently completes the final member assignment step.
              </p>
            )}
            <fieldset className="mt-4 space-y-3">
              <legend className="sr-only">Workout plan details</legend>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Title</span>
                <input
                  id={ids.workoutTitle}
                  type="text"
                  placeholder="Title"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Description</span>
                <textarea
                  id={ids.workoutDescription}
                  placeholder="Description"
                  value={workoutDescription}
                  onChange={(e) => setWorkoutDescription(e.target.value)}
                  className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
              </label>
              <button
                type="submit"
                disabled={!workoutTitle || !workoutDescription}
                className="border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
              >
                Create Workout
              </button>
            </fieldset>
          </form>

          <form
            onSubmit={handleCreateDiet}
            noValidate
            aria-describedby={hasStatusMessage ? ids.status : undefined}
            className="border border-[#2f2f2f] bg-[#111111] p-5"
          >
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Create Diet Plan</h2>
            {isTrainer && (
              <p className="mt-2 text-sm text-gray-300">
                Create nutrition guidance now so it is ready when admin links it to your roster members.
              </p>
            )}
            <fieldset className="mt-4 space-y-3">
              <legend className="sr-only">Diet plan details</legend>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Title</span>
                <input
                  id={ids.dietTitle}
                  type="text"
                  placeholder="Title"
                  value={dietTitle}
                  onChange={(e) => setDietTitle(e.target.value)}
                  className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Description</span>
                <textarea
                  id={ids.dietDescription}
                  placeholder="Description"
                  value={dietDescription}
                  onChange={(e) => setDietDescription(e.target.value)}
                  className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
              </label>
              <button
                type="submit"
                disabled={!dietTitle || !dietDescription}
                className="border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
              >
                Create Diet
              </button>
            </fieldset>
          </form>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Workout Plans</h2>
          <div className="mt-4 space-y-3">
            {displayedWorkoutPlans.length === 0 && (
              <p className="text-sm text-gray-300">
                {isTrainer
                  ? 'No workout plans created by you yet. Start with a reusable template above, then admin can assign it to members.'
                  : 'No workout plans found.'}
              </p>
            )}
            {displayedWorkoutPlans.map((plan) => (
              <div key={plan.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{plan.title}</p>
                <p className="mt-1 text-sm text-gray-300">{plan.description}</p>
                <p className="mt-1 text-xs text-gray-400">Assigned To: {formatAssignedMember(plan.assignedToId)}</p>
                {canAssign && (
                  <div className="mt-3 space-y-3">
                    <MemberSelector
                      label="Assign Workout To"
                      members={members}
                      selectedId={workoutAssign[plan.id] || ''}
                      onChange={(value) => setWorkoutAssign((prev) => ({ ...prev, [plan.id]: value }))}
                      hint="Search the member directory before assigning this workout plan."
                      emptyMessage="No members are available to assign right now."
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
            {displayedDietPlans.length === 0 && (
              <p className="text-sm text-gray-300">
                {isTrainer
                  ? 'No diet plans created by you yet. Add the first one above so admin can place it on the right member account.'
                  : 'No diet plans found.'}
              </p>
            )}
            {displayedDietPlans.map((plan) => (
              <div key={plan.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{plan.title}</p>
                <p className="mt-1 text-sm text-gray-300">{plan.description}</p>
                <p className="mt-1 text-xs text-gray-400">Assigned To: {formatAssignedMember(plan.assignedToId)}</p>
                {canAssign && (
                  <div className="mt-3 space-y-3">
                    <MemberSelector
                      label="Assign Diet To"
                      members={members}
                      selectedId={dietAssign[plan.id] || ''}
                      onChange={(value) => setDietAssign((prev) => ({ ...prev, [plan.id]: value }))}
                      hint="Search the member directory before assigning this diet plan."
                      emptyMessage="No members are available to assign right now."
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




