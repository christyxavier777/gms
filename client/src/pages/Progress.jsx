import { useDeferredValue, useEffect, useId, useState } from 'react'
import DashboardLoadingState from '../components/DashboardLoadingState'
import DashboardLayout from '../components/DashboardLayout'
import MemberSelector from '../components/MemberSelector'
import PaginationControls from '../components/PaginationControls'
import StatusStack from '../components/StatusStack'
import WorkflowEmptyState from '../components/WorkflowEmptyState'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { useActionStatus } from '../server-state/action-status'
import { getCombinedServerStateError } from '../server-state/errors'
import { invalidateProgressQueries } from '../server-state/invalidation'
import { useServerActionMutation } from '../server-state/mutations'
import {
  useAccessibleMembersQuery,
  useAllProgressQuery,
  useMemberProgressQuery,
} from '../server-state/queries'

const EMPTY_MEMBERS = []

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

function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function parseOptionalNumber(value) {
  if (value === '' || value === null || value === undefined) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

function roundTo1(value) {
  return Math.round(value * 10) / 10
}

export default function Progress() {
  const baseId = useId()
  const { token, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isTrainer = user?.role === 'TRAINER'
  const isMember = user?.role === 'MEMBER'
  const canCreate = isAdmin || isTrainer
  const canDelete = isAdmin
  const actionStatus = useActionStatus()
  const [searchTerm, setSearchTerm] = useState('')
  const [dietCategoryFilter, setDietCategoryFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const [memberUserId, setMemberUserId] = useState('')
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [bmi, setBmi] = useState('')
  const [notes, setNotes] = useState('')
  const [recordedAt, setRecordedAt] = useState(toDateTimeLocalValue(new Date()))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bmiWeightKg, setBmiWeightKg] = useState('')
  const [bmiHeightCm, setBmiHeightCm] = useState('')
  const [bodyFatSex, setBodyFatSex] = useState('MALE')
  const [bfHeightCm, setBfHeightCm] = useState('')
  const [bfNeckCm, setBfNeckCm] = useState('')
  const [bfWaistCm, setBfWaistCm] = useState('')
  const [bfHipCm, setBfHipCm] = useState('')
  const ids = {
    status: `${baseId}-status`,
    recordedAt: `${baseId}-recorded-at`,
    weight: `${baseId}-weight`,
    bodyFat: `${baseId}-body-fat`,
    bmi: `${baseId}-bmi`,
    notes: `${baseId}-notes`,
    bmiWeight: `${baseId}-bmi-weight`,
    bmiHeight: `${baseId}-bmi-height`,
    bodyFatSex: `${baseId}-body-fat-sex`,
    bodyFatHeight: `${baseId}-body-fat-height`,
    bodyFatNeck: `${baseId}-body-fat-neck`,
    bodyFatWaist: `${baseId}-body-fat-waist`,
    bodyFatHip: `${baseId}-body-fat-hip`,
    search: `${baseId}-search`,
  }
  const deferredSearchTerm = useDeferredValue(searchTerm.trim())
  const dietFilters = ['ALL', 'UNDERWEIGHT', 'NORMAL', 'OVERWEIGHT', 'OBESE']
  const effectiveMemberId = isMember ? user?.id || '' : memberUserId
  const progressParams = {
    page,
    pageSize: 10,
    sortBy: 'recordedAt',
    sortOrder: 'desc',
    ...(deferredSearchTerm ? { search: deferredSearchTerm } : {}),
    ...(dietCategoryFilter !== 'ALL' ? { dietCategory: dietCategoryFilter } : {}),
  }
  const membersQuery = useAccessibleMembersQuery(token, { enabled: !isMember })
  const adminProgressQuery = useAllProgressQuery(token, progressParams, { enabled: isAdmin })
  const memberProgressQuery = useMemberProgressQuery(token, effectiveMemberId, progressParams, {
    enabled: !isAdmin && Boolean(effectiveMemberId),
  })
  const createProgressMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (payload) => api.createProgress(token, payload),
    getSuccessMessage: 'Progress entry created.',
    getErrorMessage: 'Failed to create progress entry.',
    invalidate: ({ queryClient }) => invalidateProgressQueries(queryClient),
  })
  const deleteProgressMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (entryId) => api.deleteProgress(token, entryId),
    getSuccessMessage: 'Progress entry deleted.',
    getErrorMessage: 'Failed to delete progress entry.',
    invalidate: ({ queryClient }) => invalidateProgressQueries(queryClient),
  })
  const members = membersQuery.data?.members ?? EMPTY_MEMBERS
  const progressData = isAdmin ? adminProgressQuery.data : memberProgressQuery.data
  const entries = progressData?.progress ?? []
  const pagination = progressData?.pagination || {
    page,
    pageSize: 10,
    total: entries.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  }
  const loading =
    (!isMember && membersQuery.isPending) ||
    (isAdmin && adminProgressQuery.isPending) ||
    (!isAdmin && Boolean(effectiveMemberId) && memberProgressQuery.isPending)
  const queryError = getCombinedServerStateError(
    [membersQuery, adminProgressQuery, memberProgressQuery],
    'Failed to load progress entries.',
  )
  const hasStatusMessage = Boolean(actionStatus.errorMessage || actionStatus.successMessage || queryError)
  const trainerHasNoRoster = isTrainer && members.length === 0
  const trainerHasNoEntries = isTrainer && entries.length === 0
  const getMemberSummary = (memberId) => members.find((member) => member.id === memberId) || null
  const formatMemberLabel = (memberId, memberSummary = null) => {
    if (user?.id === memberId) return `${user.name || 'Current member'} (${user.email})`
    if (memberSummary?.name && memberSummary?.email) {
      return `${memberSummary.name} (${memberSummary.email})`
    }
    const member = getMemberSummary(memberId)
    return member ? `${member.name} (${member.email})` : memberId
  }

  useEffect(() => {
    if (isMember) return

    setMemberUserId((current) => {
      if (current && members.some((member) => member.id === current)) return current
      if (!current && members.length === 1) return members[0].id
      if (current && !members.some((member) => member.id === current)) return ''
      return current
    })
  }, [isMember, members])

  useEffect(() => {
    const totalPages = progressData?.pagination?.totalPages ?? 1
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, progressData?.pagination?.totalPages])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!canCreate) return

    const targetMemberId = memberUserId.trim()
    if (!targetMemberId) {
      actionStatus.showError('Member is required.')
      return
    }

    const payload = {
      userId: targetMemberId,
      weight: parseOptionalNumber(weight),
      bodyFat: parseOptionalNumber(bodyFat),
      bmi: parseOptionalNumber(bmi),
      notes: notes.trim() || undefined,
      recordedAt: recordedAt ? new Date(recordedAt).toISOString() : new Date().toISOString(),
    }

    const hasMetricOrNotes =
      payload.weight !== undefined ||
      payload.bodyFat !== undefined ||
      payload.bmi !== undefined ||
      Boolean(payload.notes)

    if (!hasMetricOrNotes) {
      actionStatus.showError('Provide at least one metric or notes.')
      return
    }

    try {
      setIsSubmitting(true)
      await createProgressMutation.mutateAsync(payload)
      setWeight('')
      setBodyFat('')
      setBmi('')
      setNotes('')
      setRecordedAt(toDateTimeLocalValue(new Date()))
    } catch (error) {
      void error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (entryId) => {
    if (!canDelete) return
    try {
      await deleteProgressMutation.mutateAsync(entryId)
    } catch (error) {
      void error
    }
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
    setPage(1)
  }

  const handleDietCategoryFilterChange = (nextFilter) => {
    setDietCategoryFilter(nextFilter)
    setPage(1)
  }

  const handleMemberChange = (nextMemberId) => {
    setMemberUserId(nextMemberId)
    setPage(1)
  }

  const handleCalculateBmi = () => {
    const weightKg = Number(bmiWeightKg)
    const heightCm = Number(bmiHeightCm)
    if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isFinite(heightCm) || heightCm <= 0) {
      actionStatus.showError('Enter valid weight and height for BMI calculation.')
      return
    }

    const heightM = heightCm / 100
    const calculatedBmi = weightKg / (heightM * heightM)
    setBmi(String(roundTo1(calculatedBmi)))
    actionStatus.showSuccess('BMI calculated and added to the form.')
  }

  const handleCalculateBodyFat = () => {
    const heightCm = Number(bfHeightCm)
    const neckCm = Number(bfNeckCm)
    const waistCm = Number(bfWaistCm)
    const hipCm = Number(bfHipCm)

    if (
      !Number.isFinite(heightCm) ||
      !Number.isFinite(neckCm) ||
      !Number.isFinite(waistCm) ||
      heightCm <= 0 ||
      neckCm <= 0 ||
      waistCm <= 0
    ) {
      actionStatus.showError('Enter valid body measurements for body fat calculation.')
      return
    }

    const heightIn = heightCm / 2.54
    const neckIn = neckCm / 2.54
    const waistIn = waistCm / 2.54
    const hipIn = hipCm / 2.54

    let bodyFatPercent
    if (bodyFatSex === 'MALE') {
      const base = waistIn - neckIn
      if (base <= 0) {
        actionStatus.showError('Waist must be greater than neck for male body fat calculation.')
        return
      }
      bodyFatPercent =
        495 / (1.0324 - 0.19077 * Math.log10(base) + 0.15456 * Math.log10(heightIn)) - 450
    } else {
      if (!Number.isFinite(hipCm) || hipCm <= 0) {
        actionStatus.showError('Hip measurement is required for female body fat calculation.')
        return
      }
      const base = waistIn + hipIn - neckIn
      if (base <= 0) {
        actionStatus.showError('Invalid measurements for female body fat calculation.')
        return
      }
      bodyFatPercent =
        495 / (1.29579 - 0.35004 * Math.log10(base) + 0.221 * Math.log10(heightIn)) - 450
    }

    if (!Number.isFinite(bodyFatPercent) || bodyFatPercent <= 0 || bodyFatPercent > 75) {
      actionStatus.showError('Could not calculate body fat. Please recheck measurements.')
      return
    }

    setBodyFat(String(roundTo1(bodyFatPercent)))
    actionStatus.showSuccess('Body fat calculated and added to the form.')
  }

  if (loading) {
    return (
      <DashboardLayout title="Progress">
        <DashboardLoadingState label="Loading progress workspace" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Progress">
      <StatusStack
        id={ids.status}
        errorMessage={actionStatus.errorMessage || queryError}
        successMessage={actionStatus.successMessage}
      />

      {trainerHasNoRoster && !loading && (
        <WorkflowEmptyState
          eyebrow="Progress Setup"
          title="Progress logging unlocks after members are assigned to your roster"
          description="This page is ready for assessments, but there are no members in your trainer directory yet. Admin needs to assign members to your coaching roster before you can select them and record progress."
          notes={[
            'Roster assignment happens before trainers can log check-ins or body measurements.',
            'You can still prepare workout and diet templates on the Plans page while you wait.',
            'Once a member appears here, choose them and record the first assessment to start the history.',
          ]}
          actions={[
            { label: 'Open Trainer Dashboard', to: '/trainer' },
            { label: 'Open Plans', to: '/plans', variant: 'secondary' },
          ]}
        />
      )}

      {canCreate && !trainerHasNoRoster && (
        <form onSubmit={handleCreate} noValidate aria-describedby={hasStatusMessage ? ids.status : undefined} className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Add Progress Entry</h2>
          {isTrainer && (
            <p className="mt-2 text-sm text-gray-300">
              Select a roster member, record their assessment, and the entry will immediately feed your trainer dashboard.
            </p>
          )}
          <fieldset className="mt-4 grid gap-3 md:grid-cols-2">
            <legend className="sr-only">Progress entry details</legend>
            <MemberSelector
              className="md:col-span-2"
              label="Member"
              members={members}
              selectedId={memberUserId}
              onChange={handleMemberChange}
              hint="Selecting a member also refreshes the progress history below."
              emptyMessage="No members are available for progress tracking right now."
            />
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Recorded At</span>
              <input
                id={ids.recordedAt}
                type="datetime-local"
                value={recordedAt}
                onChange={(e) => setRecordedAt(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Weight (kg)</span>
              <input
                id={ids.weight}
                type="number"
                step="0.1"
                placeholder="Weight (kg)"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Body Fat (%)</span>
              <input
                id={ids.bodyFat}
                type="number"
                step="0.1"
                placeholder="Body Fat (%)"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">BMI</span>
              <input
                id={ids.bmi}
                type="number"
                step="0.1"
                placeholder="BMI"
                value={bmi}
                onChange={(e) => setBmi(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
            </label>
            <label className="block md:col-span-2">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Notes</span>
              <textarea
                id={ids.notes}
                placeholder="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
            </label>
          </fieldset>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <fieldset className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <legend className="text-sm font-black uppercase tracking-[0.08em] text-white">BMI Calculator</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Weight (kg)</span>
                  <input
                    id={ids.bmiWeight}
                    type="number"
                    step="0.1"
                    placeholder="Weight (kg)"
                    value={bmiWeightKg}
                    onChange={(e) => setBmiWeightKg(e.target.value)}
                    className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Height (cm)</span>
                  <input
                    id={ids.bmiHeight}
                    type="number"
                    step="0.1"
                    placeholder="Height (cm)"
                    value={bmiHeightCm}
                    onChange={(e) => setBmiHeightCm(e.target.value)}
                    className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCalculateBmi}
                  className="border border-[#E21A2C] bg-[#111111] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white"
                >
                  Calculate BMI
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Uses BMI calculator weight + height only, then fills the BMI field above.
              </p>
            </fieldset>

            <fieldset className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <legend className="text-sm font-black uppercase tracking-[0.08em] text-white">Body Fat Calculator</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Sex</span>
                  <select
                    id={ids.bodyFatSex}
                    value={bodyFatSex}
                    onChange={(e) => setBodyFatSex(e.target.value)}
                    className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Height (cm)</span>
                  <input
                    id={ids.bodyFatHeight}
                    type="number"
                    step="0.1"
                    placeholder="Height (cm)"
                    value={bfHeightCm}
                    onChange={(e) => setBfHeightCm(e.target.value)}
                    className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Neck (cm)</span>
                  <input
                    id={ids.bodyFatNeck}
                    type="number"
                    step="0.1"
                    placeholder="Neck (cm)"
                    value={bfNeckCm}
                    onChange={(e) => setBfNeckCm(e.target.value)}
                    className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Waist (cm)</span>
                  <input
                    id={ids.bodyFatWaist}
                    type="number"
                    step="0.1"
                    placeholder="Waist (cm)"
                    value={bfWaistCm}
                    onChange={(e) => setBfWaistCm(e.target.value)}
                    className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                  />
                </label>
                {bodyFatSex === 'FEMALE' && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Hip (cm)</span>
                    <input
                      id={ids.bodyFatHip}
                      type="number"
                      step="0.1"
                      placeholder="Hip (cm)"
                      value={bfHipCm}
                      onChange={(e) => setBfHipCm(e.target.value)}
                      className="w-full border border-[#333333] bg-[#111111] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={handleCalculateBodyFat}
                  className="border border-[#E21A2C] bg-[#111111] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white"
                >
                  Calculate Body Fat
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">Uses US Navy formula and fills Body Fat (%) field.</p>
            </fieldset>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !memberUserId}
            className="mt-4 border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Create Progress'}
          </button>
        </form>
      )}

      {isMember && (
        <section className="border border-[#2f2f2f] bg-[#111111] p-5">
          <p className="text-sm text-gray-300">Showing your personal progress history.</p>
        </section>
      )}

      {trainerHasNoEntries && !trainerHasNoRoster && !loading && (
        <WorkflowEmptyState
          eyebrow="First Assessment"
          title="Your roster is ready for its first progress check-in"
          description="Members are available in your trainer directory, but no assessment history has been recorded yet. Use the form above to log the first weight, BMI, body-fat, or coaching notes."
          notes={[
            'The BMI and body-fat calculators can prefill those fields before you save.',
            'Entries appear in the trainer dashboard as soon as the first assessment is recorded.',
            'Clear notes make it easier to plan the next training block for each member.',
          ]}
          actions={[
            { label: 'Create First Entry', to: '/progress' },
            { label: 'Review Plans', to: '/plans', variant: 'secondary' },
          ]}
        />
      )}

      {isAdmin && (
        <section className="border border-[#2f2f2f] bg-[#111111] p-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Progress Filters</h2>
              <p className="text-sm text-gray-300">
                Search notes, members, or recorders and focus the assessment history by BMI category.
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#E21A2C]">
              Showing {entries.length} of {pagination.total} entries
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-300">Search Progress</span>
              <input
                id={ids.search}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="mt-2 w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                placeholder="Member name, recorder, or notes"
              />
            </label>

            <div className="border border-[#333333] bg-[#1A1A1A] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Diet Category</p>
              <p className="mt-1 text-base font-bold text-white">
                {dietCategoryFilter === 'ALL' ? 'All BMI-linked categories' : dietCategoryFilter}
              </p>
              <p className="mt-1 text-sm text-gray-300">
                Filter entries by the category saved with the assessment when BMI was available.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {dietFilters.map((filter) => {
              const isActive = dietCategoryFilter === filter

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => handleDietCategoryFilterChange(filter)}
                  aria-pressed={isActive}
                  className={`border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition ${
                    isActive
                      ? 'border-[#E21A2C] bg-[#E21A2C]/15 text-white'
                      : 'border-[#333333] bg-[#141414] text-gray-200 hover:border-[#E21A2C]/70 hover:text-white'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : filter}
                </button>
              )
            })}
          </div>
        </section>
      )}

      <section className="border border-[#2f2f2f] bg-[#111111] p-5">
        <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Progress Entries</h2>
        <div className="mt-4 space-y-3">
          {entries.length === 0 && !loading && (
            <p className="text-sm text-gray-300">
              {trainerHasNoRoster
                ? 'No progress entries yet because your trainer roster is still empty.'
                : isTrainer
                  ? 'No progress entries found yet. Record the first assessment above to start this history.'
                  : 'No progress entries found.'}
            </p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#E21A2C]">
                Member: {formatMemberLabel(entry.userId, entry.member)}
              </p>
              <p className="mt-1 text-sm text-gray-300">Recorded: {formatDateTime(entry.recordedAt)}</p>
              <p className="mt-1 text-sm text-gray-300">Recorded by: {entry.recorder?.name || entry.recordedById}</p>
              <p className="mt-1 text-sm text-gray-300">Weight: {entry.weight ?? '-'} kg</p>
              <p className="mt-1 text-sm text-gray-300">Body Fat: {entry.bodyFat ?? '-'}%</p>
              <p className="mt-1 text-sm text-gray-300">BMI: {entry.bmi ?? '-'}</p>
              <p className="mt-1 text-sm text-gray-300">Diet Category: {entry.dietCategory || '-'}</p>
              {entry.notes && <p className="mt-1 text-sm text-gray-300">Notes: {entry.notes}</p>}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="mt-3 border border-[#E21A2C] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.total}
          totalPages={pagination.totalPages}
          itemLabel="progress entries"
          onPageChange={setPage}
        />
      </section>
    </DashboardLayout>
  )
}
