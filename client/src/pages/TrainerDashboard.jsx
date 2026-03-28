import DashboardLoadingState from '../components/DashboardLoadingState'
import DashboardLayout from '../components/DashboardLayout'
import StatusBanner from '../components/StatusBanner'
import WorkflowEmptyState from '../components/WorkflowEmptyState'
import { useAuth } from '../context/AuthContext'
import { getCombinedServerStateError } from '../server-state/errors'
import { useAccessibleMembersQuery, useTrainerDashboardQuery } from '../server-state/queries'

function formatDate(date) {
  try {
    return new Date(date).toLocaleString()
  } catch {
    return date
  }
}

export default function TrainerDashboard() {
  const { token } = useAuth()
  const dashboardQuery = useTrainerDashboardQuery(token, 8)
  const membersQuery = useAccessibleMembersQuery(token)
  const dashboard = dashboardQuery.data?.dashboard ?? null
  const rosterMembers = membersQuery.data?.members ?? []
  const loading = dashboardQuery.isPending || membersQuery.isPending
  const error = getCombinedServerStateError(
    [dashboardQuery, membersQuery],
    'Failed to load trainer dashboard.',
  )

  if (loading) {
    return (
      <DashboardLayout title="Trainer">
        <DashboardLoadingState label="Loading trainer dashboard" summaryCount={3} />
      </DashboardLayout>
    )
  }

  const liveEntries = dashboard?.recentProgressEntries || []
  const entries = liveEntries

  const assignedMembers = rosterMembers.length
  const plansCreated = Number(dashboard?.plansCreatedByTrainer ?? 0)
  const noRoster = assignedMembers === 0
  const noPlans = plansCreated === 0
  const noProgress = entries.length === 0

  const formatMemberLabel = (memberId) => {
    const member = rosterMembers.find((item) => item.id === memberId)
    return member ? `${member.name} (${member.email})` : memberId
  }

  const stats = [
    { label: 'Roster Members', value: assignedMembers, hint: 'Assigned by admin' },
    { label: 'Plans Created', value: plansCreated, hint: 'Workout + diet' },
    { label: 'Recent Progress Entries', value: entries.length, hint: 'Latest updates' },
  ]

  const todaySchedule = []

  return (
    <DashboardLayout title="Trainer">
      {error && <StatusBanner message={error} />}

      {!loading && noRoster && (
        <WorkflowEmptyState
          eyebrow="Trainer Setup"
          title="Your coaching roster is waiting on admin assignment"
          description="You can log progress only after members are assigned to your trainer roster. Once those members are visible, create plan templates and start recording their first assessment check-ins."
          notes={[
            'Admins assign members to your trainer roster before they appear in your workflow.',
            'You can create workout and diet templates now in the Plans area.',
            'After your roster is ready, use Progress to log the first metrics and notes.',
          ]}
          actions={[
            { label: 'Open Plans', to: '/plans' },
            { label: 'Open Progress', to: '/progress', variant: 'secondary' },
          ]}
        />
      )}

      {!loading && !noRoster && noPlans && (
        <WorkflowEmptyState
          eyebrow="Next Step"
          title="Your roster is ready for its first plan templates"
          description="Members are assigned to you, but they still need workout and diet plans. Create the templates now so admin can attach them to your roster and members can see them in their dashboards."
          notes={[
            `${assignedMembers} member${assignedMembers === 1 ? '' : 's'} currently assigned to your trainer roster.`,
            'Workout and diet plans you create stay under your ownership.',
            'Admins handle final plan assignment to members in the current workflow.',
          ]}
          actions={[
            { label: 'Create Plans', to: '/plans' },
            { label: 'Log Progress Later', to: '/progress', variant: 'secondary' },
          ]}
        />
      )}

      {!loading && !noRoster && !noPlans && noProgress && (
        <WorkflowEmptyState
          eyebrow="First Check-In"
          title="Plans are in place; start logging assessments"
          description="Your setup is ready for real coaching work. Open the progress page, choose a roster member, and record the first assessment so the dashboard begins to reflect live results."
          notes={[
            'Use the BMI and body-fat tools on the progress page if you are starting from measurements.',
            'Progress history fills this dashboard automatically after the first check-in.',
            'Recent entries stay scoped to members connected to your coaching workflow.',
          ]}
          actions={[
            { label: 'Record Progress', to: '/progress' },
            { label: 'Review Plans', to: '/plans', variant: 'secondary' },
          ]}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="border border-white/10 bg-white/5 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-[10px]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">{item.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px] lg:col-span-2">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Recent Progress</h2>
          <div className="mt-4 space-y-3">
            {entries.length === 0 && (
              <p className="text-sm text-gray-300">
                {noRoster
                  ? 'Admins need to assign members to your trainer roster before progress can appear here.'
                  : noPlans
                    ? 'Create workout and diet plans first so your coaching workflow can start feeding this dashboard.'
                    : 'No recent progress entries yet. Record the first assessment from the Progress page.'}
              </p>
            )}
            {entries.map((entry) => (
              <div key={entry.id} className="border border-white/10 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#ff8b5f]">
                  Member: {formatMemberLabel(entry.userId)}
                </p>
                <p className="mt-1 text-sm text-gray-300">Recorded: {formatDate(entry.recordedAt)}</p>
                <p className="mt-1 text-sm text-gray-300">
                  Weight: {entry.weight ?? '-'} | Body Fat: {entry.bodyFat ?? '-'} | BMI: {entry.bmi ?? '-'}
                </p>
                {entry.notes && <p className="mt-1 text-sm text-gray-300">Notes: {entry.notes}</p>}
              </div>
            ))}
          </div>
        </article>

        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Today Schedule</h2>
          <div className="mt-4 space-y-3">
            {todaySchedule.length === 0 && (
              <p className="text-sm text-gray-300">
                Scheduling is not live yet. Use your roster, plans, and progress entries to run sessions until the timetable workflow is added.
              </p>
            )}
            {todaySchedule.map((session) => (
              <div key={`${session.time}-${session.member}`} className="border border-white/10 bg-black/30 p-3">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#ff8b5f]">{session.time}</p>
                <p className="mt-1 text-sm font-semibold text-white">{session.member}</p>
                <p className="text-sm text-gray-300">{session.focus}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Coach Checklist</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            'Assign at least one workout and diet plan to each active member',
            'Record progress after assessment sessions to populate reporting',
            'Review member adherence before publishing new training blocks',
          ].map((note) => (
            <div key={note} className="border-l-2 border-[#ff8b5f] bg-black/30 px-3 py-2">
              <p className="text-sm text-gray-300">{note}</p>
            </div>
          ))}
        </div>
      </section>
    </DashboardLayout>
  )
}
