import { useEffect, useId, useMemo, useState } from 'react'
import DashboardLoadingState from '../components/DashboardLoadingState'
import DashboardLayout from '../components/DashboardLayout'
import StatusStack from '../components/StatusStack'
import WorkflowEmptyState from '../components/WorkflowEmptyState'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { useActionStatus } from '../server-state/action-status'
import { getServerStateErrorMessage } from '../server-state/errors'
import { invalidateScheduleQueries } from '../server-state/invalidation'
import { useServerActionMutation } from '../server-state/mutations'
import { queryKeys } from '../server-state/queryKeys'
import { useScheduleWorkspaceQuery } from '../server-state/queries'

const sessionTypeLabels = {
  CLASS: 'Class',
  PERSONAL_TRAINING: 'Personal Training',
  ASSESSMENT: 'Assessment',
  RECOVERY: 'Recovery',
}

const sessionTypeStyles = {
  CLASS: 'border-[#ff8b5f]/50 bg-[#ff8b5f]/10 text-[#ffd4c1]',
  PERSONAL_TRAINING: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  ASSESSMENT: 'border-sky-400/40 bg-sky-500/10 text-sky-200',
  RECOVERY: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
}

const bookingStatusStyles = {
  BOOKED: 'border-yellow-400/40 bg-yellow-500/10 text-yellow-200',
  ATTENDED: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
  MISSED: 'border-[#E21A2C]/40 bg-[#E21A2C]/10 text-[#ffd3d8]',
  CANCELLED: 'border-white/15 bg-white/5 text-gray-200',
}

function toDateTimeLocalValue(value) {
  try {
    const date = new Date(value)
    const timezoneOffsetMs = date.getTimezoneOffset() * 60000
    const localDate = new Date(date.getTime() - timezoneOffsetMs)
    return localDate.toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

function buildDefaultScheduleWindow() {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  return {
    startsAt: toDateTimeLocalValue(start),
    endsAt: toDateTimeLocalValue(end),
  }
}

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return value
  }
}

function formatSessionWindow(startsAt, endsAt) {
  try {
    const start = new Date(startsAt)
    const end = new Date(endsAt)
    return `${start.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })} to ${end.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    })}`
  } catch {
    return `${startsAt} to ${endsAt}`
  }
}

function formatBookingStatus(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function isReservedBookingStatus(status) {
  return status !== 'CANCELLED'
}

function updateScheduleWorkspaceCache(queryClient, updateWorkspace) {
  const previous = queryClient.getQueryData(queryKeys.schedule.workspace)

  if (!previous?.workspace) {
    return null
  }

  queryClient.setQueryData(queryKeys.schedule.workspace, {
    ...previous,
    workspace: updateWorkspace(previous.workspace),
  })

  return {
    rollback: () => queryClient.setQueryData(queryKeys.schedule.workspace, previous),
  }
}

function SessionCard({ session, userRole, onBook, onUpdateBookingStatus, actionKey }) {
  const currentBooking = session.currentUserBooking
  const memberCanBook = userRole === 'MEMBER' && (!currentBooking || currentBooking.status === 'CANCELLED')
  const memberCanCancel = userRole === 'MEMBER' && currentBooking?.status === 'BOOKED'
  const memberBookingBusy = actionKey === `book:${session.id}`

  return (
    <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                sessionTypeStyles[session.sessionType] || 'border-white/15 bg-white/5 text-white'
              }`}
            >
              {sessionTypeLabels[session.sessionType] || session.sessionType}
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              {session.location || 'Location to be confirmed'}
            </p>
          </div>
          <h3 className="mt-2 text-lg font-black text-white">{session.title}</h3>
          <p className="mt-2 text-sm text-gray-300">{formatSessionWindow(session.startsAt, session.endsAt)}</p>
          <p className="mt-1 text-sm text-gray-300">Coach: {session.trainer.name}</p>
          {session.description && <p className="mt-3 text-sm text-gray-300">{session.description}</p>}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <div className="border border-white/10 bg-black/30 px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Booked Seats</p>
            <p className="mt-1 text-lg font-black text-white">
              {session.bookedCount}/{session.capacity}
            </p>
          </div>
          <div className="border border-white/10 bg-black/30 px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Seats Left</p>
            <p className="mt-1 text-lg font-black text-white">{session.remainingSeats}</p>
          </div>
        </div>
      </div>

      {userRole === 'MEMBER' && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {currentBooking && (
            <span
              className={`inline-flex border px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] ${
                bookingStatusStyles[currentBooking.status] || 'border-white/15 bg-white/5 text-white'
              }`}
            >
              {formatBookingStatus(currentBooking.status)}
            </span>
          )}
          {memberCanBook && (
            <button
              type="button"
              disabled={session.remainingSeats === 0 || memberBookingBusy}
              onClick={() => onBook(session.id)}
              className="border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#c31626] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {memberBookingBusy
                ? 'Saving...'
                : currentBooking?.status === 'CANCELLED'
                  ? 'Book Again'
                  : 'Book Session'}
            </button>
          )}
          {memberCanCancel && (
            <button
              type="button"
              disabled={actionKey === `booking:${currentBooking.id}:CANCELLED`}
              onClick={() => onUpdateBookingStatus(currentBooking.id, 'CANCELLED')}
              className="border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionKey === `booking:${currentBooking.id}:CANCELLED` ? 'Saving...' : 'Cancel Booking'}
            </button>
          )}
          {!currentBooking && session.remainingSeats === 0 && (
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
              Full right now
            </span>
          )}
        </div>
      )}

      {userRole !== 'MEMBER' && (
        <div className="mt-4 border border-white/10 bg-black/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Attendee Roster</p>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]">
              {session.attendees.length} booking{session.attendees.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="mt-3 space-y-3">
            {session.attendees.length === 0 && (
              <p className="text-sm text-gray-300">No members booked yet for this session.</p>
            )}
            {session.attendees.map((attendee) => (
              <div key={attendee.bookingId} className="border border-white/10 bg-white/5 p-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{attendee.member.name}</p>
                    <p className="mt-1 text-sm text-gray-300">{attendee.member.email}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-gray-400">
                      Booked {formatDateTime(attendee.bookedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                        bookingStatusStyles[attendee.status] || 'border-white/15 bg-white/5 text-white'
                      }`}
                    >
                      {formatBookingStatus(attendee.status)}
                    </span>
                    {attendee.status === 'BOOKED' && (
                      <>
                        <button
                          type="button"
                          disabled={actionKey === `booking:${attendee.bookingId}:ATTENDED`}
                          onClick={() => onUpdateBookingStatus(attendee.bookingId, 'ATTENDED')}
                          className="border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-200 transition hover:border-emerald-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionKey === `booking:${attendee.bookingId}:ATTENDED` ? 'Saving...' : 'Attended'}
                        </button>
                        <button
                          type="button"
                          disabled={actionKey === `booking:${attendee.bookingId}:MISSED`}
                          onClick={() => onUpdateBookingStatus(attendee.bookingId, 'MISSED')}
                          className="border border-[#E21A2C]/40 bg-[#E21A2C]/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#ffd3d8] transition hover:border-[#ff8b5f] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionKey === `booking:${attendee.bookingId}:MISSED` ? 'Saving...' : 'Missed'}
                        </button>
                        <button
                          type="button"
                          disabled={actionKey === `booking:${attendee.bookingId}:CANCELLED`}
                          onClick={() => onUpdateBookingStatus(attendee.bookingId, 'CANCELLED')}
                          className="border border-white/20 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionKey === `booking:${attendee.bookingId}:CANCELLED` ? 'Saving...' : 'Cancel'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

export default function Schedule() {
  const baseId = useId()
  const { token, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isTrainer = user?.role === 'TRAINER'
  const isMember = user?.role === 'MEMBER'
  const canCreate = isAdmin || isTrainer
  const actionStatus = useActionStatus()
  const workspaceQuery = useScheduleWorkspaceQuery(token)
  const createSessionMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (payload) => api.createScheduleSession(token, payload),
    getActionKey: () => 'create-session',
    getSuccessMessage: ({ variables }) => `Scheduled "${variables.title}" successfully.`,
    getErrorMessage: 'Failed to create scheduled session.',
    invalidate: ({ queryClient }) => invalidateScheduleQueries(queryClient),
  })
  const bookSessionMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (sessionId) => api.bookScheduleSession(token, sessionId),
    getActionKey: (sessionId) => `book:${sessionId}`,
    getSuccessMessage: 'Session booking updated.',
    getErrorMessage: 'Failed to update the booking.',
    optimisticUpdate: ({ queryClient, variables: sessionId }) =>
      updateScheduleWorkspaceCache(queryClient, (workspace) => ({
        ...workspace,
        upcomingSessions: workspace.upcomingSessions.map((session) => {
          if (session.id !== sessionId) {
            return session
          }

          const nextBookedCount =
            session.currentUserBooking?.status === 'BOOKED'
              ? session.bookedCount
              : session.bookedCount + 1
          const nextRemainingSeats =
            session.currentUserBooking?.status === 'BOOKED'
              ? session.remainingSeats
              : Math.max(session.remainingSeats - 1, 0)

          return {
            ...session,
            bookedCount: nextBookedCount,
            remainingSeats: nextRemainingSeats,
            currentUserBooking: {
              id: session.currentUserBooking?.id || `pending-booking:${sessionId}`,
              status: 'BOOKED',
            },
          }
        }),
      })),
    invalidate: ({ queryClient }) => invalidateScheduleQueries(queryClient),
  })
  const updateBookingMutation = useServerActionMutation({
    actionStatus,
    mutationFn: ({ bookingId, status }) => api.updateScheduleBookingStatus(token, bookingId, status),
    getActionKey: ({ bookingId, status }) => `booking:${bookingId}:${status}`,
    getSuccessMessage: ({ variables }) =>
      `Booking marked ${formatBookingStatus(variables.status).toLowerCase()}.`,
    getErrorMessage: 'Failed to update the booking.',
    optimisticUpdate: ({ queryClient, variables }) =>
      updateScheduleWorkspaceCache(queryClient, (workspace) => ({
        ...workspace,
        upcomingSessions: workspace.upcomingSessions.map((session) => {
          const currentUserBooking =
            session.currentUserBooking?.id === variables.bookingId
              ? session.currentUserBooking
              : null
          const attendee = session.attendees.find((item) => item.bookingId === variables.bookingId) || null
          const previousStatus = currentUserBooking?.status || attendee?.status

          if (!previousStatus) {
            return session
          }

          const nextBookedCount =
            isReservedBookingStatus(previousStatus) && !isReservedBookingStatus(variables.status)
              ? Math.max(session.bookedCount - 1, 0)
              : !isReservedBookingStatus(previousStatus) && isReservedBookingStatus(variables.status)
                ? session.bookedCount + 1
                : session.bookedCount

          const nextRemainingSeats =
            isReservedBookingStatus(previousStatus) && !isReservedBookingStatus(variables.status)
              ? session.remainingSeats + 1
              : !isReservedBookingStatus(previousStatus) && isReservedBookingStatus(variables.status)
                ? Math.max(session.remainingSeats - 1, 0)
                : session.remainingSeats

          return {
            ...session,
            bookedCount: nextBookedCount,
            remainingSeats: nextRemainingSeats,
            currentUserBooking:
              currentUserBooking
                ? { ...currentUserBooking, status: variables.status }
                : session.currentUserBooking,
            attendees: session.attendees.map((item) =>
              item.bookingId === variables.bookingId ? { ...item, status: variables.status } : item,
            ),
          }
        }),
      })),
    invalidate: ({ queryClient }) => invalidateScheduleQueries(queryClient),
  })
  const initialWindow = useMemo(() => buildDefaultScheduleWindow(), [])
  const [form, setForm] = useState({
    title: '',
    description: '',
    sessionType: 'CLASS',
    location: '',
    trainerId: '',
    startsAt: initialWindow.startsAt,
    endsAt: initialWindow.endsAt,
    capacity: '12',
  })
  const workspace = workspaceQuery.data?.workspace || {
    upcomingSessions: [],
    attendanceHistory: [],
    trainerAvailability: [],
    trainers: [],
  }
  const loading = workspaceQuery.isPending
  const queryError = workspaceQuery.error
    ? getServerStateErrorMessage(workspaceQuery.error, 'Failed to load the schedule workspace.')
    : ''
  const ids = {
    status: `${baseId}-status`,
    title: `${baseId}-title`,
    description: `${baseId}-description`,
    sessionType: `${baseId}-session-type`,
    location: `${baseId}-location`,
    trainerId: `${baseId}-trainer`,
    startsAt: `${baseId}-starts-at`,
    endsAt: `${baseId}-ends-at`,
    capacity: `${baseId}-capacity`,
  }

  const upcomingSessions = workspace.upcomingSessions
  const trainerAvailability = workspace.trainerAvailability
  const attendanceHistory = workspace.attendanceHistory
  const trainers = workspace.trainers

  useEffect(() => {
    if (!workspaceQuery.data) return

    setForm((current) => {
      if (isTrainer && user?.id && current.trainerId !== user.id) {
        return { ...current, trainerId: user.id }
      }
      if (isAdmin && !current.trainerId && trainers[0]?.id) {
        return { ...current, trainerId: trainers[0].id }
      }
      return current
    })
  }, [workspaceQuery.data, isAdmin, isTrainer, trainers, user?.id])

  const reservedSeats = useMemo(
    () => upcomingSessions.reduce((sum, session) => sum + Number(session.bookedCount || 0), 0),
    [upcomingSessions],
  )
  const openSeats = useMemo(
    () => upcomingSessions.reduce((sum, session) => sum + Number(session.remainingSeats || 0), 0),
    [upcomingSessions],
  )
  const memberBookedCount = useMemo(
    () => upcomingSessions.filter((session) => session.currentUserBooking?.status === 'BOOKED').length,
    [upcomingSessions],
  )
  const trainerHostedCount = useMemo(
    () => upcomingSessions.filter((session) => session.trainer.id === user?.id).length,
    [upcomingSessions, user?.id],
  )

  const summaryCards = [
    {
      label: 'Upcoming Sessions',
      value: upcomingSessions.length,
      hint: 'Visible in the live timetable',
    },
    {
      label: 'Reserved Seats',
      value: reservedSeats,
      hint: 'Bookings across upcoming sessions',
    },
    {
      label: 'Open Seats',
      value: openSeats,
      hint: 'Immediate scheduling capacity',
    },
    isMember
      ? {
          label: 'My Bookings',
          value: memberBookedCount,
          hint: 'Upcoming sessions on your calendar',
        }
      : isTrainer
        ? {
            label: 'Hosted By Me',
            value: trainerHostedCount,
            hint: 'Sessions under your coaching load',
          }
        : {
            label: 'Active Trainers',
            value: trainerAvailability.length,
            hint: 'Coaches visible in availability board',
          },
  ]

  const resetForm = () => {
    const nextWindow = buildDefaultScheduleWindow()
    setForm((current) => ({
      ...current,
      title: '',
      description: '',
      sessionType: 'CLASS',
      location: '',
      startsAt: nextWindow.startsAt,
      endsAt: nextWindow.endsAt,
      capacity: '12',
    }))
  }

  const handleCreateSession = async (event) => {
    event.preventDefault()
    if (!canCreate) return

    try {
      await createSessionMutation.mutateAsync({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        sessionType: form.sessionType,
        location: form.location.trim() || undefined,
        trainerId: isAdmin ? form.trainerId || undefined : user?.id,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        capacity: Number(form.capacity),
      })
      resetForm()
    } catch {}
  }

  const handleBookSession = async (sessionId) => {
    try {
      await bookSessionMutation.mutateAsync(sessionId)
    } catch {}
  }

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await updateBookingMutation.mutateAsync({ bookingId, status })
    } catch {}
  }

  if (loading) {
    return (
      <DashboardLayout title="Schedule">
        <DashboardLoadingState label="Loading schedule workspace" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Schedule">
      <StatusStack
        id={ids.status}
        errorMessage={actionStatus.errorMessage || queryError}
        successMessage={actionStatus.successMessage}
      />

      {!loading && isMember && upcomingSessions.length === 0 && attendanceHistory.length === 0 && (
        <WorkflowEmptyState
          eyebrow="Scheduling"
          title="Class booking opens here as soon as sessions are published"
          description="Your member workspace is ready for class and personal-training booking, but there are no upcoming sessions on the live timetable yet."
          notes={[
            'Admins and trainers can publish sessions from this same schedule workspace.',
            'Once a session is live, you can book it and track attendance history here.',
            'Your upcoming bookings and attendance results will stay grouped in one place.',
          ]}
          actions={[{ label: 'Open Memberships', to: '/subscriptions' }]}
        />
      )}

      {!loading && isAdmin && trainers.length === 0 && (
        <WorkflowEmptyState
          eyebrow="Scheduling Setup"
          title="Create trainer accounts before publishing sessions"
          description="Scheduling is live, but the workspace does not have any active trainers yet. Invite or activate a trainer first so sessions can be assigned correctly."
          notes={[
            'Each scheduled session belongs to a trainer for timetable and attendance ownership.',
            'Members will see coach availability once trainers begin receiving sessions.',
            'This keeps the scheduling workflow aligned with your current staff model.',
          ]}
          actions={[{ label: 'Open Dashboard', to: '/admin' }]}
        />
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <article key={item.label} className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">{item.hint}</p>
          </article>
        ))}
      </section>

      {canCreate && (
        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <form
            onSubmit={handleCreateSession}
            noValidate
            aria-describedby={error || success ? ids.status : undefined}
            className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]"
          >
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">
              {isTrainer ? 'Publish Coaching Session' : 'Create Scheduled Session'}
            </h2>
            <p className="mt-2 text-sm text-gray-300">
              {isTrainer
                ? 'Create a session on your own coaching calendar, then manage attendance from the timetable below.'
                : 'Publish the next class, assessment, or training slot and assign the responsible trainer up front.'}
            </p>

            <fieldset className="mt-4 grid gap-3 md:grid-cols-2">
              <legend className="sr-only">Session details</legend>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Title</span>
                <input
                  id={ids.title}
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                  placeholder="Strength fundamentals, member assessment, recovery hour"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Session Type</span>
                <select
                  id={ids.sessionType}
                  value={form.sessionType}
                  onChange={(event) => setForm((current) => ({ ...current, sessionType: event.target.value }))}
                  className="w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                >
                  {Object.entries(sessionTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              {isAdmin ? (
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Trainer</span>
                  <select
                    id={ids.trainerId}
                    value={form.trainerId}
                    onChange={(event) => setForm((current) => ({ ...current, trainerId: event.target.value }))}
                    className="w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                  >
                    <option value="">Select trainer</option>
                    {trainers.map((trainer) => (
                      <option key={trainer.id} value={trainer.id}>
                        {trainer.name} ({trainer.email})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="border border-white/10 bg-black/30 px-3 py-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Trainer</p>
                  <p className="mt-1 text-sm font-semibold text-white">{user?.name || 'Assigned trainer'}</p>
                  <p className="mt-1 text-xs text-gray-400">{user?.email}</p>
                </div>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Starts At</span>
                <input
                  id={ids.startsAt}
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))}
                  className="w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Ends At</span>
                <input
                  id={ids.endsAt}
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))}
                  className="w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Capacity</span>
                <input
                  id={ids.capacity}
                  type="number"
                  min="1"
                  max="40"
                  value={form.capacity}
                  onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))}
                  className="w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Location</span>
                <input
                  id={ids.location}
                  type="text"
                  value={form.location}
                  onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  className="w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                  placeholder="Main floor, recovery zone, PT studio"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Description</span>
                <textarea
                  id={ids.description}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                  placeholder="What members should expect, who this is for, and what to bring."
                  rows={4}
                />
              </label>
            </fieldset>

            <button
              type="submit"
                disabled={
                  actionStatus.actionKey === 'create-session' ||
                  !form.title.trim() ||
                  !form.startsAt ||
                  !form.endsAt ||
                  !form.capacity ||
                  (isAdmin && !form.trainerId)
              }
              className="mt-4 border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#c31626] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionStatus.actionKey === 'create-session' ? 'Publishing...' : 'Publish Session'}
            </button>
          </form>

          <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Trainer Availability</h2>
            <p className="mt-2 text-sm text-gray-300">
              A quick operational view of who is already on the calendar, how many seats are reserved, and where more sessions can still fit.
            </p>
            <div className="mt-4 grid gap-3">
              {trainerAvailability.length === 0 && (
                <p className="text-sm text-gray-300">
                  No trainer availability data yet. Publish the first session to start building the scheduling grid.
                </p>
              )}
              {trainerAvailability.map((item) => (
                <div key={item.trainer.id} className="border border-white/10 bg-black/30 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{item.trainer.name}</p>
                      <p className="mt-1 text-sm text-gray-300">{item.trainer.email}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Sessions</p>
                        <p className="mt-1 text-lg font-black text-white">{item.upcomingSessions}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Booked</p>
                        <p className="mt-1 text-lg font-black text-white">{item.bookedSeats}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Open</p>
                        <p className="mt-1 text-lg font-black text-white">{item.remainingSeats}</p>
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">
                    {item.nextSessionStartsAt
                      ? `Next session ${formatDateTime(item.nextSessionStartsAt)}`
                      : 'No upcoming session published yet'}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

      {!canCreate && (
        <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Trainer Availability</h2>
          <div className="mt-4 grid gap-3">
            {trainerAvailability.length === 0 && (
              <p className="text-sm text-gray-300">No coach availability published yet.</p>
            )}
            {trainerAvailability.map((item) => (
              <div key={item.trainer.id} className="border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{item.trainer.name}</p>
                    <p className="mt-1 text-sm text-gray-300">{item.trainer.email}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">
                    {item.nextSessionStartsAt
                      ? `Next slot ${formatDateTime(item.nextSessionStartsAt)}`
                      : 'Awaiting published sessions'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Live Timetable</h2>
            <p className="text-sm text-gray-300">
              {isMember
                ? 'Browse upcoming sessions, book what fits your schedule, and manage your current reservations.'
                : 'Review the upcoming schedule, keep sessions filled, and manage attendance from each session card.'}
            </p>
          </div>
          {upcomingSessions.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]">
              {upcomingSessions.length} upcoming session{upcomingSessions.length === 1 ? '' : 's'}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-4">
          {upcomingSessions.length === 0 && (
            <p className="text-sm text-gray-300">
              No sessions are on the calendar yet. The first published session will appear here automatically.
            </p>
          )}
          {upcomingSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              userRole={user?.role}
              onBook={handleBookSession}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              actionKey={actionStatus.actionKey}
            />
          ))}
        </div>
      </section>

      {isMember && (
        <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Attendance History</h2>
              <p className="text-sm text-gray-300">
                A running record of sessions you attended, missed, or cancelled after booking.
              </p>
            </div>
            {attendanceHistory.length > 0 && (
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]">
                {attendanceHistory.length} recent record{attendanceHistory.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
          <div className="mt-4 grid gap-3">
            {attendanceHistory.length === 0 && (
              <p className="text-sm text-gray-300">
                Attendance history will appear here after your first booked session concludes or is cancelled.
              </p>
            )}
            {attendanceHistory.map((entry) => (
              <article key={entry.id} className="border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{entry.session.title}</p>
                    <p className="mt-1 text-sm text-gray-300">
                      {sessionTypeLabels[entry.session.sessionType] || entry.session.sessionType}
                    </p>
                    <p className="mt-1 text-sm text-gray-300">
                      {formatSessionWindow(entry.session.startsAt, entry.session.endsAt)}
                    </p>
                    <p className="mt-1 text-sm text-gray-300">Coach: {entry.session.trainer.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-gray-400">
                      Updated {formatDateTime(entry.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex w-fit border px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] ${
                      bookingStatusStyles[entry.status] || 'border-white/15 bg-white/5 text-white'
                    }`}
                  >
                    {formatBookingStatus(entry.status)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </DashboardLayout>
  )
}
