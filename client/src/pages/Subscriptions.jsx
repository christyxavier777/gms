import { useDeferredValue, useId, useState } from 'react'
import DashboardLoadingState from '../components/DashboardLoadingState'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import MemberSelector from '../components/MemberSelector'
import PaginationControls from '../components/PaginationControls'
import StatusBanner from '../components/StatusBanner'
import StatusStack from '../components/StatusStack'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { useActionStatus } from '../server-state/action-status'
import { getCombinedServerStateError } from '../server-state/errors'
import { invalidateSubscriptionsQueries } from '../server-state/invalidation'
import { useServerActionMutation } from '../server-state/mutations'
import {
  useAccessibleMembersQuery,
  useMembershipPlansQuery,
  useMySubscriptionQuery,
  useMySubscriptionsQuery,
  useSubscriptionsQuery,
} from '../server-state/queries'

function toInputDate(value) {
  try {
    return new Date(value).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function addDays(dateInput, days) {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return dateInput
  date.setDate(date.getDate() + days)
  return toInputDate(date.toISOString())
}

function formatAmount(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Rs -'
  return `Rs ${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatStatusLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getPreferredPlan(plans, preferredPlanId) {
  return plans.find((plan) => plan.id === preferredPlanId) || plans[0] || null
}

function getSubscriptionCount(summary, status) {
  if (status === 'PENDING_ACTIVATION') return summary.pendingActivation
  if (status === 'ACTIVE') return summary.active
  if (status === 'CANCELLED_AT_PERIOD_END') return summary.cancelledAtPeriodEnd
  if (status === 'EXPIRED') return summary.expired
  if (status === 'CANCELLED') return summary.cancelled
  return summary.total
}

function getCancellationAction(status) {
  if (status === 'ACTIVE') {
    return {
      label: 'End At Period Close',
      helper: 'Keeps access live until the current membership period ends.',
    }
  }

  if (status === 'PENDING_ACTIVATION') {
    return {
      label: 'Cancel Activation',
      helper: 'Stops this pending membership before it becomes active.',
    }
  }

  return null
}

const EMPTY_MEMBERS = []
const EMPTY_PLANS = []
const EMPTY_SUBSCRIPTIONS = []

export default function Subscriptions() {
  const baseId = useId()
  const { token, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const isMember = user?.role === 'MEMBER'
  const actionStatus = useActionStatus()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)

  const today = new Date().toISOString().slice(0, 10)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [form, setForm] = useState({
    userId: '',
    startDate: today,
  })
  const ids = {
    status: `${baseId}-status`,
    search: `${baseId}-search`,
    startDate: `${baseId}-start-date`,
    endDate: `${baseId}-end-date`,
    endDateHint: `${baseId}-end-date-hint`,
  }
  const deferredSearchTerm = useDeferredValue(searchTerm.trim())
  const pageSize = 8
  const subscriptionFilters = [
    'ALL',
    'PENDING_ACTIVATION',
    'ACTIVE',
    'CANCELLED_AT_PERIOD_END',
    'EXPIRED',
    'CANCELLED',
  ]
  const subscriptionParams = {
    page,
    pageSize,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...(deferredSearchTerm ? { search: deferredSearchTerm } : {}),
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
  }
  const membershipPlansQuery = useMembershipPlansQuery()
  const membersQuery = useAccessibleMembersQuery(token, { enabled: isAdmin })
  const subscriptionsQuery = useSubscriptionsQuery(token, subscriptionParams, { enabled: isAdmin })
  const mySubscriptionQuery = useMySubscriptionQuery(token, { enabled: isMember })
  const mySubscriptionsQuery = useMySubscriptionsQuery(token, { enabled: isMember })
  const createSubscriptionMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (payload) => api.createSubscription(token, payload),
    getSuccessMessage: 'Subscription created.',
    getErrorMessage: 'Failed to create subscription.',
    invalidate: ({ queryClient }) => invalidateSubscriptionsQueries(queryClient),
  })
  const cancelSubscriptionMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (subscriptionId) => api.cancelSubscription(token, subscriptionId),
    getSuccessMessage: 'Subscription cancelled.',
    getErrorMessage: 'Failed to cancel subscription.',
    invalidate: ({ queryClient }) => invalidateSubscriptionsQueries(queryClient),
  })
  const membershipPlans = membershipPlansQuery.data?.plans ?? EMPTY_PLANS
  const members = membersQuery.data?.members ?? EMPTY_MEMBERS
  const subscriptions = subscriptionsQuery.data?.subscriptions ?? EMPTY_SUBSCRIPTIONS
  const pagination = subscriptionsQuery.data?.pagination || {
    page,
    pageSize,
    total: subscriptions.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  }
  const summary = subscriptionsQuery.data?.summary || {
    total: subscriptions.length,
    pendingActivation: 0,
    active: 0,
    cancelledAtPeriodEnd: 0,
    expired: 0,
    cancelled: 0,
  }
  const mySubscription = mySubscriptionQuery.data?.subscription ?? null
  const loading =
    membershipPlansQuery.isPending ||
    (isAdmin && (membersQuery.isPending || subscriptionsQuery.isPending)) ||
    (isMember && (mySubscriptionQuery.isPending || mySubscriptionsQuery.isPending))
  const queryError = getCombinedServerStateError(
    [membershipPlansQuery, membersQuery, subscriptionsQuery, mySubscriptionQuery, mySubscriptionsQuery],
    'Failed to load subscriptions.',
  )
  const hasStatusMessage = Boolean(actionStatus.errorMessage || actionStatus.successMessage || queryError)
  const preselectedPlanId = location.state?.preselectedPlanId || location.state?.preselectedPlanKey || 'basic-monthly'
  const selectedPlan = getPreferredPlan(membershipPlans, selectedPlanId || preselectedPlanId)
  const effectiveSelectedPlanId = selectedPlan?.id || ''
  const calculatedEndDate = selectedPlan ? addDays(form.startDate, selectedPlan.durationDays) : ''

  const hasLiveAdminData = summary.total > 0
  const displaySubscriptions = subscriptions
  const displayMySubscription = mySubscription
  const mySubscriptions = mySubscriptionsQuery.data?.subscriptions ?? EMPTY_SUBSCRIPTIONS
  const upcomingRenewal =
    mySubscriptions.find((subscription) => {
      if (subscription.status !== 'PENDING_ACTIVATION') return false
      if (!displayMySubscription) return true
      return new Date(subscription.startDate) > new Date(displayMySubscription.endDate)
    }) || null
  const getMemberSummary = (memberId) => members.find((member) => member.id === memberId) || null
  const formatMemberLabel = (memberId, memberSummary = null) => {
    if (memberSummary?.name && memberSummary?.email) {
      return `${memberSummary.name} (${memberSummary.email})`
    }
    const member = getMemberSummary(memberId)
    return member ? `${member.name} (${member.email})` : memberId
  }
  const hasActiveAdminFilters = statusFilter !== 'ALL' || deferredSearchTerm.length > 0

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
    setPage(1)
  }

  const handleStatusFilterChange = (nextFilter) => {
    setStatusFilter(nextFilter)
    setPage(1)
  }

  const clearAdminFilters = () => {
    setStatusFilter('ALL')
    setSearchTerm('')
    setPage(1)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.userId) {
      actionStatus.showError('Select a member before creating a subscription.')
      return
    }
    if (!selectedPlan) {
      actionStatus.showError('Choose a membership plan before creating a subscription.')
      return
    }
    try {
      await createSubscriptionMutation.mutateAsync({
        userId: form.userId,
        planId: selectedPlan.id,
        startDate: form.startDate,
      })
    } catch (error) {
      void error
    }
  }

  const handleCancel = async (subscriptionId) => {
    try {
      await cancelSubscriptionMutation.mutateAsync(subscriptionId)
    } catch (error) {
      void error
    }
  }

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId)
  }

  const handleOpenPaymentsForPlan = (plan) => {
    navigate('/payments', {
      state: {
        preselectedPlanId: plan.id,
        preselectedPlanName: plan.name,
        preselectedPlanAmount: plan.priceInr,
        preselectedPlanDurationDays: plan.durationDays,
      },
    })
  }

  const handleStartDateChange = (nextDate) => {
    setForm((prev) => ({
      ...prev,
      startDate: nextDate,
    }))
  }

  if (loading) {
    return (
      <DashboardLayout title="Subscriptions">
        <DashboardLoadingState label="Loading memberships workspace" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Subscriptions">
      <StatusStack
        id={ids.status}
        errorMessage={actionStatus.errorMessage || queryError}
        successMessage={actionStatus.successMessage}
      />
      {isAdmin && !hasLiveAdminData && !loading && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
          Live mode: this page will populate after subscriptions are created.
        </p>
      )}

      {isAdmin && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Total Subscriptions</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.total}</p>
            </article>
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Pending Activation</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.pendingActivation}</p>
            </article>
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Active</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.active}</p>
            </article>
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Ending At Period Close</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.cancelledAtPeriodEnd}</p>
            </article>
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Expired</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.expired}</p>
            </article>
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Cancelled</p>
              <p className="mt-2 text-2xl font-black text-white">{summary.cancelled}</p>
            </article>
          </section>

          <form onSubmit={handleCreate} noValidate aria-describedby={hasStatusMessage ? ids.status : undefined} className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Create Subscription</h2>
            {location.state?.onboardingName && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#ff7a45]">
                Welcome {location.state.onboardingName}. Package preference preselected from onboarding.
              </p>
            )}
            <fieldset className="mt-4 grid gap-3 md:grid-cols-3">
              <legend className="sr-only">Choose subscription package</legend>
              {membershipPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  role="radio"
                  aria-checked={effectiveSelectedPlanId === plan.id}
                  className={`border p-3 text-left transition-colors ${
                    effectiveSelectedPlanId === plan.id
                      ? 'border-[#E21A2C] bg-[#1A1A1A]'
                      : 'border-[#2f2f2f] bg-[#141414] hover:border-[#E21A2C]/60'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#E21A2C]">{plan.name}</p>
                  <p className="mt-1 text-lg font-black text-white">{formatAmount(plan.priceInr)}</p>
                  <p className="mt-1 text-xs text-gray-300">{plan.durationDays} days</p>
                  <p className="mt-1 text-xs text-gray-400">{plan.perks}</p>
                </button>
              ))}
            </fieldset>
            {membershipPlans.length === 0 && (
              <StatusBanner
                variant="info"
                title="Plan Catalog"
                message="No active membership plans are available from the backend catalog yet."
                className="mt-4"
              />
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <MemberSelector
                className="md:col-span-2"
                label="Member"
                members={members}
                selectedId={form.userId}
                onChange={(value) => setForm((prev) => ({ ...prev, userId: value }))}
                hint="Search the member directory before creating a subscription."
                emptyMessage="No members are available for subscription setup right now."
              />
              <div className="border border-[#333333] bg-[#1A1A1A] p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Selected Plan</p>
                <p className="text-lg font-black text-white">{selectedPlan?.name || 'Choose a plan'}</p>
                <p className="mt-1 text-sm text-gray-300">
                  {selectedPlan ? formatAmount(selectedPlan.priceInr) : 'No plan selected yet'}
                </p>
                {selectedPlan && (
                  <>
                    <p className="mt-1 text-xs text-gray-400">{selectedPlan.durationDays} days</p>
                    <p className="mt-2 text-xs text-gray-400">{selectedPlan.perks}</p>
                  </>
                )}
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Start Date</span>
                <input
                  id={ids.startDate}
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">End Date</span>
                <input
                  id={ids.endDate}
                  type="date"
                  value={calculatedEndDate}
                  readOnly
                  aria-describedby={ids.endDateHint}
                  className="w-full border border-[#333333] bg-[#121212] px-3 py-2 text-white outline-none"
                />
              </label>
            </div>
            <p id={ids.endDateHint} className="mt-2 text-xs text-gray-400">
              End date is auto-calculated based on the selected plan duration.
            </p>
            <button
              type="submit"
              disabled={!form.userId || !selectedPlan || !form.startDate || !calculatedEndDate}
              className="mt-4 border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
            >
              Create Subscription
            </button>
          </form>

          <section className="border border-[#2f2f2f] bg-[#111111] p-5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Subscription Filters</h2>
                <p className="text-sm text-gray-300">
                  Search members or plans, then focus the workspace on the subscription state you need.
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff7a45]">
                Showing {displaySubscriptions.length} of {pagination.total} records
              </p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-300">Search Subscriptions</span>
                <input
                  id={ids.search}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="mt-2 w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
                  placeholder="Member name, email, phone, or plan"
                />
              </label>

              <div className="border border-[#333333] bg-[#1A1A1A] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Status Focus</p>
                <p className="mt-1 text-base font-bold text-white">
                  {statusFilter === 'ALL' ? 'All subscription states' : `${formatStatusLabel(statusFilter)} only`}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Use this to separate current memberships from expired or cancelled follow-up work.
                </p>
                {hasActiveAdminFilters && (
                  <button
                    type="button"
                    onClick={clearAdminFilters}
                    className="mt-3 border border-[#333333] bg-[#141414] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-200 transition hover:border-[#E21A2C]/70 hover:text-white"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {subscriptionFilters.map((filter) => {
                const isActive = statusFilter === filter
                const count = getSubscriptionCount(summary, filter)

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => handleStatusFilterChange(filter)}
                    aria-pressed={isActive}
                    className={`border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition ${
                      isActive
                        ? 'border-[#E21A2C] bg-[#E21A2C]/15 text-white'
                        : 'border-[#333333] bg-[#141414] text-gray-200 hover:border-[#E21A2C]/70 hover:text-white'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : formatStatusLabel(filter)} ({count})
                  </button>
                )
              })}
            </div>
          </section>

          <section className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">All Subscriptions</h2>
            <div className="mt-4 space-y-3">
              {displaySubscriptions.length === 0 && (
                <p className="text-sm text-gray-300">
                  {hasActiveAdminFilters ? 'No subscriptions match the current filters.' : 'No subscriptions found.'}
                </p>
              )}
              {displaySubscriptions.map((sub) => (
                <div key={sub.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{sub.planName}</p>
                  <p className="mt-1 text-sm text-gray-300">Member: {formatMemberLabel(sub.userId, sub.member)}</p>
                  <p className="mt-1 text-sm text-gray-300">
                    {toInputDate(sub.startDate)} to {toInputDate(sub.endDate)} | Status: {formatStatusLabel(sub.status)}
                  </p>
                  {sub.status === 'PENDING_ACTIVATION' && (
                    <p className="mt-2 text-xs uppercase tracking-[0.08em] text-yellow-300">
                      Waiting for payment submission to complete activation.
                    </p>
                  )}
                  {sub.status === 'CANCELLED_AT_PERIOD_END' && (
                    <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[#ff7a45]">
                      Cancellation is scheduled. Access stays live until this period ends.
                    </p>
                  )}
                  {getCancellationAction(sub.status) && hasLiveAdminData && (
                    <button
                      type="button"
                      onClick={() => handleCancel(sub.id)}
                      className="mt-3 border border-[#E21A2C] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white"
                    >
                      {getCancellationAction(sub.status).label}
                    </button>
                  )}
                  {getCancellationAction(sub.status) && (
                    <p className="mt-2 text-xs text-gray-400">{getCancellationAction(sub.status).helper}</p>
                  )}
                </div>
              ))}
            </div>
            <PaginationControls
              page={pagination.page}
              pageSize={pagination.pageSize}
              totalItems={pagination.total}
              totalPages={pagination.totalPages}
              itemLabel="subscriptions"
              onPageChange={setPage}
            />
          </section>
        </>
      )}

      {isMember && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Available Plans</h2>
            <div className="mt-4 space-y-3">
              {membershipPlans.length === 0 && (
                <p className="text-sm text-gray-300">No active plans are published in the catalog yet.</p>
              )}
              {membershipPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleOpenPaymentsForPlan(plan)}
                  className="w-full border border-[#2f2f2f] bg-[#1A1A1A] p-3 text-left transition-colors hover:border-[#E21A2C]/70 focus:border-[#E21A2C] focus:outline-none"
                >
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{plan.name}</p>
                  <p className="mt-1 text-lg font-black text-white underline decoration-[#E21A2C]/35 underline-offset-4">
                    {formatAmount(plan.priceInr)}
                  </p>
                  <p className="text-sm text-gray-300">{plan.durationDays} days</p>
                  <p className="text-xs text-gray-400">{plan.perks}</p>
                </button>
              ))}
            </div>
          </article>

          <article className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">My Subscription</h2>
            {!mySubscription && !loading && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
                No current subscription found for this account yet.
              </p>
            )}
            {displayMySubscription ? (
              <div className="mt-4 border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{displayMySubscription.planName}</p>
                <p className="mt-1 text-sm text-gray-300">
                  {toInputDate(displayMySubscription.startDate)} to {toInputDate(displayMySubscription.endDate)}
                </p>
                {(displayMySubscription.status === 'ACTIVE' || displayMySubscription.status === 'CANCELLED_AT_PERIOD_END') && (
                  <div className="mt-3 border border-[#3a2a1f] bg-[#211612] px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#ffb48d]">Membership Valid Till</p>
                    <p className="mt-1 text-xl font-black text-white">{toInputDate(displayMySubscription.endDate)}</p>
                  </div>
                )}
                <p className="mt-1 text-sm text-gray-300">
                  Status: {formatStatusLabel(displayMySubscription.status)}
                </p>
                {displayMySubscription.status === 'PENDING_ACTIVATION' && (
                  <p className="mt-2 text-xs uppercase tracking-[0.08em] text-yellow-300">
                    This membership activates as soon as you complete payment.
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 border border-dashed border-[#2f2f2f] bg-[#161616] p-4">
                <p className="text-sm text-gray-300">
                  Choose a package during onboarding or ask an admin to create your subscription.
                </p>
              </div>
            )}
            {upcomingRenewal && (
              <div className="mt-4 border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">Upcoming Renewal</p>
                <p className="mt-1 text-sm font-semibold text-white">{upcomingRenewal.planName}</p>
                <p className="mt-1 text-sm text-gray-300">
                  {toInputDate(upcomingRenewal.startDate)} to {toInputDate(upcomingRenewal.endDate)}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.08em] text-yellow-300">
                  Paid early. This next period begins automatically after your current one ends.
                </p>
              </div>
            )}
          </article>
        </section>
      )}

      {!isAdmin && !isMember && (
        <section className="border border-[#2f2f2f] bg-[#111111] p-5">
          <p className="text-sm text-gray-300">Subscription management is currently available for Admin and Member roles.</p>
        </section>
      )}
    </DashboardLayout>
  )
}
