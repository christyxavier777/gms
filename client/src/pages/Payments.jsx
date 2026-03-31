import { useDeferredValue, useEffect, useId, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import DashboardLoadingState from '../components/DashboardLoadingState'
import DashboardLayout from '../components/DashboardLayout'
import PaginationControls from '../components/PaginationControls'
import StatusStack from '../components/StatusStack'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { useActionStatus } from '../server-state/action-status'
import { getCombinedServerStateError } from '../server-state/errors'
import { invalidatePaymentsQueries } from '../server-state/invalidation'
import { useServerActionMutation } from '../server-state/mutations'
import {
  useMySubscriptionQuery,
  usePaymentsQuery,
} from '../server-state/queries'

const statusStyles = {
  PENDING: {
    badge: 'border-yellow-400/40 bg-yellow-500/10 text-yellow-200',
    panel: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-100',
  },
  SUCCESS: {
    badge: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200',
    panel: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  },
  FAILED: {
    badge: 'border-[#E21A2C]/50 bg-[#E21A2C]/10 text-[#ffb0b7]',
    panel: 'border-[#E21A2C]/40 bg-[#E21A2C]/10 text-[#ffd3d8]',
  },
}

const subscriptionStatusStyles = {
  PENDING_ACTIVATION: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200',
  ACTIVE: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  CANCELLED_AT_PERIOD_END: 'border-[#ff8b5f]/40 bg-[#ff8b5f]/10 text-[#ffd3c4]',
  EXPIRED: 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200',
  CANCELLED: 'border-[#E21A2C]/40 bg-[#E21A2C]/10 text-[#ffb0b7]',
}

const userStatusStyles = {
  ACTIVE: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  INACTIVE: 'border-white/20 bg-white/10 text-gray-200',
}

const adminStatusCopy = {
  PENDING: 'Awaiting admin verification. Confirm the transfer details, then approve or reject this submission.',
  SUCCESS: 'Verified payment. This record currently counts toward accepted revenue for the member ledger.',
  FAILED: 'Rejected or needs correction. The member should submit a fresh payment after fixing the issue.',
}

const memberStatusCopy = {
  PENDING: 'Your payment has been recorded and is still being finalized.',
  SUCCESS: 'Your payment was verified successfully and accepted into the payment ledger.',
  FAILED: 'This payment was not accepted. Please submit a corrected payment to retry.',
}

const adminFilters = ['ALL', 'PENDING', 'SUCCESS', 'FAILED']
const EMPTY_PAYMENTS = []

function loadRazorpayCheckoutScript() {
  if (window.Razorpay) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    const existing = document.querySelector('script[data-razorpay-checkout="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', () => resolve(false), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function formatAmount(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Rs -'
  return `Rs ${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatAmountMinor(value) {
  const amountMinor = Number(value)
  if (!Number.isFinite(amountMinor)) return 'Rs -'
  return formatAmount(amountMinor / 100)
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

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return 'Dates unavailable'

  try {
    return `${new Date(startDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })} to ${new Date(endDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`
  } catch {
    return `${startDate} to ${endDate}`
  }
}

function formatStatusLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getProofReferenceHref(value) {
  if (!value) return null

  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function getPlanAmount(subscription) {
  return subscription?.plan?.priceInr ?? null
}

function getSubscriptionLinkCopy(subscription, selectedPlanName = '') {
  if (!subscription) {
    if (selectedPlanName) {
      return `This payment will create and activate the ${selectedPlanName} plan you selected from the subscription catalog.`
    }

    return 'You can still submit a standalone payment record while your subscription is being set up.'
  }

  if (subscription.status === 'PENDING_ACTIVATION') {
    return `This payment is linked to your ${subscription.planName} membership and will activate it immediately after submission.`
  }

  if (subscription.status === 'CANCELLED_AT_PERIOD_END') {
    return `This payment stays attached to your ${subscription.planName} membership, which remains active until the current period ends.`
  }

  return `This payment will attach to your ${subscription.planName} membership.`
}

function getReviewActions(status) {
  if (status === 'PENDING') {
    return [
      { nextStatus: 'SUCCESS', label: 'Approve Payment' },
      { nextStatus: 'FAILED', label: 'Reject Payment' },
    ]
  }

  if (status === 'SUCCESS') {
    return [
      { nextStatus: 'PENDING', label: 'Reopen Review' },
      { nextStatus: 'FAILED', label: 'Mark Failed' },
    ]
  }

  return [
    { nextStatus: 'SUCCESS', label: 'Approve Instead' },
    { nextStatus: 'PENDING', label: 'Move To Pending' },
  ]
}

function PaymentCard({
  payment,
  canReview,
  onStatusChange,
  actionKey,
  isAdmin,
  reviewNote,
  onReviewNoteChange,
}) {
  const statusMessage = isAdmin ? adminStatusCopy[payment.status] : memberStatusCopy[payment.status]
  const reviewActions = canReview ? getReviewActions(payment.status) : []
  const statusStyle = statusStyles[payment.status] || {
    badge: 'border-white/20 bg-white/5 text-white',
    panel: 'border-white/20 bg-white/10 text-white',
  }
  const latestEvent = payment.events?.[0] || null
  const proofReferenceHref = getProofReferenceHref(payment.proofReference)

  return (
    <article className="border border-white/10 bg-black/30 p-4 backdrop-blur-[10px]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff8b5f]">Transaction</p>
          <p className="mt-1 text-lg font-black text-white">{payment.transactionId}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-sm text-gray-300">{formatAmountMinor(payment.amountMinor)}</p>
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-400">
              via {payment.upiId}
            </span>
          </div>
        </div>
        <span
          className={`inline-flex w-fit border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${statusStyle.badge}`}
        >
          {payment.status}
        </span>
      </div>

      <div className={`mt-4 border-l-2 px-4 py-3 text-sm ${statusStyle.panel}`}>
        <p className="text-xs font-bold uppercase tracking-[0.12em]">{formatStatusLabel(payment.status)}</p>
        <p className="mt-1 text-sm">{statusMessage}</p>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="border border-white/10 bg-white/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Member</p>
            {payment.member?.status && (
              <span
                className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  userStatusStyles[payment.member.status] || 'border-white/20 bg-white/10 text-white'
                }`}
              >
                {payment.member.status}
              </span>
            )}
          </div>
          <p className="mt-1 text-base font-bold text-white">{payment.member?.name || 'Unknown member'}</p>
          <p className="mt-1 break-all text-sm text-gray-300">{payment.member?.email || 'No email available'}</p>
          <p className="mt-1 text-sm text-gray-300">{payment.member?.phone || 'No phone available'}</p>
        </div>

        <div className="border border-white/10 bg-white/5 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Membership Link</p>
            {payment.subscription?.status && (
              <span
                className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  subscriptionStatusStyles[payment.subscription.status] ||
                  'border-white/20 bg-white/10 text-white'
                }`}
              >
                {formatStatusLabel(payment.subscription.status)}
              </span>
            )}
          </div>
          <p className="mt-1 text-base font-bold text-white">
            {payment.subscription?.planName || 'Standalone payment'}
          </p>
          <p className="mt-1 text-sm text-gray-300">
            {payment.subscription
              ? formatDateRange(payment.subscription.startDate, payment.subscription.endDate)
              : 'Not attached to a subscription record yet.'}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-gray-400">
            {payment.subscription ? 'Linked membership record' : 'Useful for manual follow-up or later linkage'}
          </p>
        </div>

        <div className="border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Timeline</p>
          <p className="mt-1 text-sm text-white">Submitted: {formatDateTime(payment.createdAt)}</p>
          <p className="mt-2 text-sm text-gray-300">Last updated: {formatDateTime(payment.updatedAt)}</p>
          {payment.reviewer && (
            <p className="mt-2 text-sm text-gray-300">
              Reviewed by {payment.reviewer.name} on {formatDateTime(payment.reviewedAt)}
            </p>
          )}
          {payment.verificationNotes && (
            <p className="mt-2 text-sm text-gray-300">Latest note: {payment.verificationNotes}</p>
          )}
          {payment.proofReference && (
            <div className="mt-2 text-sm text-gray-300">
              <span className="text-gray-400">Proof reference: </span>
              {proofReferenceHref ? (
                <a
                  href={proofReferenceHref}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-[#ff8b5f] underline decoration-[#ff8b5f]/40 underline-offset-2"
                >
                  {payment.proofReference}
                </a>
              ) : (
                <span className="break-all">{payment.proofReference}</span>
              )}
            </div>
          )}
          {payment.subscription?.planName && (
            <p className="mt-2 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">
              {payment.subscription.status === 'PENDING_ACTIVATION'
                ? 'Approving this payment can activate the linked membership'
                : 'Subscription plan attached for easier review'}
            </p>
          )}
        </div>
      </div>

      {canReview && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
              Review Note
            </span>
            <textarea
              value={reviewNote}
              onChange={(event) => onReviewNoteChange(payment.id, event.target.value)}
              rows={3}
              className="mt-2 w-full border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#ff8b5f]"
              placeholder="Optional verification detail, member follow-up, or rejection reason"
            />
          </label>
          <div className="flex flex-wrap gap-2">
          {reviewActions.map((action) => {
            const isUpdating = actionKey === `${payment.id}:${action.nextStatus}`
            return (
              <button
                key={action.nextStatus}
                type="button"
                disabled={isUpdating}
                onClick={() => onStatusChange(payment.id, action.nextStatus, reviewNote)}
                className={`border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition ${
                  action.nextStatus === 'SUCCESS'
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-300 hover:text-white'
                    : action.nextStatus === 'FAILED'
                      ? 'border-[#E21A2C]/40 bg-[#E21A2C]/10 text-[#ffd3d8] hover:border-[#ff8b5f] hover:text-white'
                      : 'border-white/15 bg-white/5 text-gray-200 hover:border-[#ff8b5f]/70 hover:text-white'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {isUpdating ? 'Saving...' : action.label}
              </button>
            )
          })}
          </div>
        </div>
      )}

      <div className="mt-4 border border-white/10 bg-white/5 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Audit Trail</p>
          {latestEvent && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]">
              Latest {formatStatusLabel(latestEvent.toStatus)}
            </p>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {(payment.events || []).map((event) => (
            <div key={event.id} className="border-l-2 border-white/10 bg-black/30 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${
                    statusStyles[event.toStatus]?.badge || 'border-white/20 bg-white/5 text-white'
                  }`}
                >
                  {formatStatusLabel(event.toStatus)}
                </span>
                {event.fromStatus && (
                  <span className="text-[11px] uppercase tracking-[0.08em] text-gray-400">
                    from {formatStatusLabel(event.fromStatus)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-300">
                {event.actor ? `${event.actor.name} reviewed this payment` : 'System created this payment record'} on{' '}
                {formatDateTime(event.createdAt)}
              </p>
              {event.verificationNotes && <p className="mt-1 text-sm text-gray-300">{event.verificationNotes}</p>}
            </div>
          ))}
          {(!payment.events || payment.events.length === 0) && (
            <p className="text-sm text-gray-300">No audit events recorded yet.</p>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Payments() {
  const baseId = useId()
  const { token, user } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN'
  const isMember = user?.role === 'MEMBER'
  const actionStatus = useActionStatus()
  const [reviewNotes, setReviewNotes] = useState({})
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [isAmountDirty, setIsAmountDirty] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    upiId: '',
    proofReference: '',
  })
  const ids = {
    status: `${baseId}-status`,
    search: `${baseId}-search`,
    amount: `${baseId}-amount`,
    upi: `${baseId}-upi`,
    proof: `${baseId}-proof`,
  }

  const deferredSearchTerm = useDeferredValue(searchTerm.trim())
  const pageSize = isAdmin ? 8 : 6
  const paymentParams = {
    page,
    pageSize,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...(isAdmin && deferredSearchTerm ? { search: deferredSearchTerm } : {}),
    ...(isAdmin && statusFilter !== 'ALL' ? { status: statusFilter } : {}),
  }
  const paymentsQuery = usePaymentsQuery(token, paymentParams)
  const subscriptionQuery = useMySubscriptionQuery(token, { enabled: isMember })
  const createRazorpayOrderMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (payload) => api.createRazorpayOrder(token, payload),
    getActionKey: () => 'create-razorpay-order',
    getErrorMessage: 'Failed to start Razorpay checkout.',
    clearSuccessOnMutate: false,
  })
  const verifyRazorpayPaymentMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (payload) => api.verifyRazorpayPayment(token, payload),
    getActionKey: () => 'verify-razorpay-payment',
    getSuccessMessage: 'Payment completed via Razorpay and membership updated.',
    getErrorMessage: 'Failed to verify the Razorpay payment.',
    invalidate: ({ queryClient }) => invalidatePaymentsQueries(queryClient),
  })
  const createPaymentMutation = useServerActionMutation({
    actionStatus,
    mutationFn: (payload) => api.createUpiPayment(token, payload),
    getActionKey: () => 'submit-payment',
    getSuccessMessage: isMember ? 'Payment recorded and membership updated.' : 'Payment submitted for verification.',
    getErrorMessage: 'Failed to submit payment.',
    invalidate: ({ queryClient }) => invalidatePaymentsQueries(queryClient),
  })
  const updatePaymentMutation = useServerActionMutation({
    actionStatus,
    mutationFn: ({ paymentId, status, verificationNotes }) =>
      api.updatePaymentStatus(token, paymentId, status, verificationNotes),
    getActionKey: ({ paymentId, status }) => `${paymentId}:${status}`,
    getSuccessMessage: ({ data, variables }) => {
      const memberName = data.payment?.member?.name
      return memberName
        ? `Payment updated to ${variables.status.toLowerCase()} for ${memberName}.`
        : `Payment marked ${variables.status.toLowerCase()}.`
    },
    getErrorMessage: 'Failed to update payment status.',
    invalidate: ({ queryClient }) => invalidatePaymentsQueries(queryClient),
  })
  const payments = paymentsQuery.data?.payments ?? EMPTY_PAYMENTS
  const pagination = paymentsQuery.data?.pagination || {
    page,
    pageSize,
    total: payments.length,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  }
  const summary = paymentsQuery.data?.summary || {
    total: payments.length,
    pending: 0,
    success: 0,
    failed: 0,
    verifiedRevenueMinor: 0,
  }
  const subscription = subscriptionQuery.data?.subscription ?? null
  const selectedPlanFromNavigation = location.state?.preselectedPlanName
    ? {
        id: location.state.preselectedPlanId || '',
        name: location.state.preselectedPlanName,
        amount: Number(location.state.preselectedPlanAmount),
        durationDays: Number(location.state.preselectedPlanDurationDays),
      }
    : null
  const suggestedAmount = useMemo(() => {
    if (selectedPlanFromNavigation && Number.isFinite(selectedPlanFromNavigation.amount)) {
      return selectedPlanFromNavigation.amount
    }

    return getPlanAmount(subscription)
  }, [selectedPlanFromNavigation, subscription])
  const loading = paymentsQuery.isPending || (isMember && subscriptionQuery.isPending)
  const queryError = getCombinedServerStateError(
    [paymentsQuery, subscriptionQuery],
    'Failed to load payments.',
  )
  const hasStatusMessage = Boolean(actionStatus.errorMessage || actionStatus.successMessage || queryError)
  const defaultAmount = suggestedAmount ? String(suggestedAmount) : ''
  const paymentAmountValue = isAmountDirty ? form.amount : form.amount || defaultAmount
  const pendingSubscriptionForCheckout = subscription?.status === 'PENDING_ACTIVATION' ? subscription : null
  const selectedPlanForCheckout =
    !pendingSubscriptionForCheckout && selectedPlanFromNavigation?.id ? selectedPlanFromNavigation : null
  const canStartRazorpayCheckout = Boolean(pendingSubscriptionForCheckout || selectedPlanForCheckout)

  useEffect(() => {
    const totalPages = paymentsQuery.data?.pagination?.totalPages ?? 1
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, paymentsQuery.data?.pagination?.totalPages])

  const handleSubmitPayment = async (event) => {
    event.preventDefault()
    const amount = Number(paymentAmountValue)
    const trimmedProofReference = form.proofReference.trim()

    if (!Number.isFinite(amount) || amount <= 0) {
      actionStatus.showError('Enter a valid payment amount.')
      return
    }

    if (trimmedProofReference && trimmedProofReference.length < 3) {
      actionStatus.showError('If you add a proof reference, use at least 3 characters.')
      return
    }

    if (trimmedProofReference.length > 500) {
      actionStatus.showError('Proof reference must be 500 characters or fewer.')
      return
    }

    try {
      await createPaymentMutation.mutateAsync({
        userId: user.id,
        subscriptionId: subscription?.id,
        ...(!subscription && selectedPlanFromNavigation?.id
          ? { planId: selectedPlanFromNavigation.id }
          : {}),
        amount,
        upiId: form.upiId.trim(),
        ...(trimmedProofReference ? { proofReference: trimmedProofReference } : {}),
      })
      setForm((prev) => ({
        ...prev,
        amount: '',
        upiId: '',
        proofReference: '',
      }))
      setIsAmountDirty(false)
    } catch (error) {
      void error
    }
  }

  const handleStartRazorpayCheckout = async (event) => {
    event.preventDefault()

    if (!canStartRazorpayCheckout) {
      actionStatus.showError('Choose a membership plan before starting Razorpay checkout.')
      return
    }

    const checkoutScriptReady = await loadRazorpayCheckoutScript()
    if (!checkoutScriptReady || !window.Razorpay) {
      actionStatus.showError('Could not load Razorpay Checkout. Please try again.')
      return
    }

    try {
      const orderResult = await createRazorpayOrderMutation.mutateAsync({
        ...(pendingSubscriptionForCheckout ? { subscriptionId: pendingSubscriptionForCheckout.id } : {}),
        ...(selectedPlanForCheckout ? { planId: selectedPlanForCheckout.id } : {}),
      })

      const razorpay = new window.Razorpay({
        key: orderResult.checkout.keyId,
        amount: orderResult.checkout.amount,
        currency: orderResult.checkout.currency,
        name: orderResult.checkout.name,
        description: orderResult.checkout.description,
        order_id: orderResult.checkout.orderId,
        prefill: orderResult.checkout.prefill,
        theme: {
          color: '#E21A2C',
        },
        handler: async (response) => {
          try {
            await verifyRazorpayPaymentMutation.mutateAsync({
              paymentId: orderResult.payment.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
          } catch (error) {
            void error
          }
        },
        modal: {
          ondismiss: () => {
            if (!verifyRazorpayPaymentMutation.isPending) {
              actionStatus.showError('Razorpay checkout was closed before payment completion.')
            }
          },
        },
      })

      razorpay.on('payment.failed', (response) => {
        actionStatus.showError(
          response?.error?.description || 'Razorpay payment failed. Please try again.',
        )
      })

      razorpay.open()
    } catch (error) {
      void error
    }
  }

  const handleStatusChange = async (paymentId, status, verificationNotes = '') => {
    try {
      await updatePaymentMutation.mutateAsync({
        paymentId,
        status,
        verificationNotes: verificationNotes.trim(),
      })
      setReviewNotes((current) => ({
        ...current,
        [paymentId]: '',
      }))
    } catch (error) {
      void error
    }
  }
  const pendingPayments = summary.pending
  const successPayments = summary.success
  const failedPayments = summary.failed

  const filteredPendingPayments = useMemo(
    () => payments.filter((payment) => payment.status === 'PENDING'),
    [payments],
  )

  const totalAmountMinor = summary.verifiedRevenueMinor || 0

  const statusCounts = useMemo(
    () => ({
      ALL: summary.total,
      PENDING: summary.pending,
      SUCCESS: summary.success,
      FAILED: summary.failed,
    }),
    [summary.failed, summary.pending, summary.success, summary.total],
  )

  const hasActiveAdminFilters = isAdmin && (statusFilter !== 'ALL' || deferredSearchTerm.length > 0)

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
    setPage(1)
  }

  const handleStatusFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus)
    setPage(1)
  }

  const clearAdminFilters = () => {
    setStatusFilter('ALL')
    setSearchTerm('')
    setPage(1)
  }

  if (loading) {
    return (
      <DashboardLayout title="Payments">
        <DashboardLoadingState label="Loading payments workspace" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Payments">
      <StatusStack
        id={ids.status}
        errorMessage={actionStatus.errorMessage || queryError}
        successMessage={actionStatus.successMessage}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Total Records</p>
          <p className="mt-2 text-3xl font-black text-white">{summary.total}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">
            {isAdmin ? 'Platform-wide ledger' : 'Your payment history'}
          </p>
        </article>
        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Pending</p>
          <p className="mt-2 text-3xl font-black text-white">{pendingPayments}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-yellow-300">Awaiting review</p>
        </article>
        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Successful</p>
          <p className="mt-2 text-3xl font-black text-white">{successPayments}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-emerald-300">Verified payments</p>
        </article>
        <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
            {isAdmin ? 'Verified Revenue' : 'Failed'}
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {isAdmin ? formatAmountMinor(totalAmountMinor) : failedPayments}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff8b5f]">
            {isAdmin ? 'Successful submissions only' : 'Needs resubmission'}
          </p>
        </article>
      </section>

      {isAdmin && (
        <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Admin Review Board</h2>
              <p className="text-sm text-gray-300">
                Search members, transaction IDs, Razorpay IDs, plans, or UPI handles and narrow the ledger to the queue you need.
              </p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]">
              Showing {payments.length} of {pagination.total} records
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-300">Search Ledger</span>
              <input
                id={ids.search}
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                className="mt-2 w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                placeholder="Member name, email, transaction, Razorpay ID, UPI, or plan"
              />
            </label>

            <div className="border border-white/10 bg-black/30 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Review Focus</p>
              <p className="mt-1 text-base font-bold text-white">
                {statusFilter === 'ALL' ? 'All payment states' : `${formatStatusLabel(statusFilter)} only`}
              </p>
              <p className="mt-1 text-sm text-gray-300">
                Pending queue stays visible when your server-side filters include submissions still waiting for a decision.
              </p>
              {hasActiveAdminFilters && (
                <button
                  type="button"
                  onClick={clearAdminFilters}
                  className="mt-3 border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-200 transition hover:border-[#ff8b5f]/70 hover:text-white"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {adminFilters.map((filter) => {
              const isActive = statusFilter === filter
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => handleStatusFilterChange(filter)}
                  aria-pressed={isActive}
                  className={`border px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] transition ${
                    isActive
                      ? 'border-[#ff8b5f] bg-[#ff8b5f]/15 text-white'
                      : 'border-white/15 bg-white/5 text-gray-200 hover:border-[#ff8b5f]/70 hover:text-white'
                  }`}
                >
                  {filter === 'ALL' ? 'All' : formatStatusLabel(filter)} ({statusCounts[filter]})
                </button>
              )
            })}
          </div>
        </section>
      )}

      {isMember && (
        <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <form
            onSubmit={handleStartRazorpayCheckout}
            noValidate
            aria-describedby={hasStatusMessage ? ids.status : undefined}
            className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]"
          >
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Pay With Razorpay</h2>
            <p className="mt-2 text-sm text-gray-300">
              Start a real Razorpay checkout for UPI or other enabled methods. Your membership updates only after Razorpay verification succeeds.
            </p>

            <div className="mt-4 space-y-3">
              <div className="border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Checkout Target</p>
                <p className="mt-1 text-lg font-black text-white">
                  {subscription?.planName || selectedPlanFromNavigation?.name || 'No current subscription linked'}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  {getSubscriptionLinkCopy(subscription, selectedPlanFromNavigation?.name || '')}
                </p>
                {suggestedAmount && (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#ff8b5f]">
                    Suggested amount: {formatAmount(suggestedAmount)}
                  </p>
                )}
                {!subscription && selectedPlanFromNavigation?.durationDays > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    Selected package duration: {selectedPlanFromNavigation.durationDays} days
                  </p>
                )}
              </div>

              <div className="border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Amount</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {suggestedAmount ? formatAmount(suggestedAmount) : 'Select a plan first'}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  Razorpay Checkout will handle UPI app selection, payment authorization, and the final callback.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  !canStartRazorpayCheckout ||
                  actionStatus.actionKey === 'create-razorpay-order' ||
                  actionStatus.actionKey === 'verify-razorpay-payment'
                }
                className="border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#f24c5c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionStatus.actionKey === 'create-razorpay-order'
                  ? 'Starting Checkout...'
                  : actionStatus.actionKey === 'verify-razorpay-payment'
                    ? 'Verifying Payment...'
                    : suggestedAmount
                      ? `Pay ${formatAmount(suggestedAmount)}`
                      : 'Select A Plan First'}
              </button>
            </div>
          </form>

          <article className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Verification Guide</h2>
            <div className="mt-4 space-y-3">
              <div className="border-l-2 border-yellow-400 bg-black/30 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-yellow-300">Pending</p>
                <p className="mt-1 text-sm text-gray-300">Waiting for the admin team to confirm the payment.</p>
              </div>
              <div className="border-l-2 border-emerald-400 bg-black/30 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-300">Success</p>
                <p className="mt-1 text-sm text-gray-300">Verified and accepted in the platform payment ledger.</p>
              </div>
              <div className="border-l-2 border-[#E21A2C] bg-black/30 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff8b5f]">Failed</p>
                <p className="mt-1 text-sm text-gray-300">Rejected or needs a corrected resubmission.</p>
              </div>
            </div>
          </article>
        </section>
      )}

      {isAdmin && filteredPendingPayments.length > 0 && (
        <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Review Queue</h2>
              <p className="text-sm text-gray-300">
                Pending submissions filtered for action. Approve or reject them without leaving the ledger.
              </p>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-yellow-300">
              {filteredPendingPayments.length} pending on this page
            </p>
          </div>
          <div className="mt-4 grid gap-4">
            {filteredPendingPayments.map((payment) => (
              <PaymentCard
                key={`pending-${payment.id}`}
                payment={payment}
                canReview
                onStatusChange={handleStatusChange}
                actionKey={actionStatus.actionKey}
                isAdmin
                reviewNote={reviewNotes[payment.id] || ''}
                onReviewNoteChange={(paymentId, value) =>
                  setReviewNotes((current) => ({ ...current, [paymentId]: value }))
                }
              />
            ))}
          </div>
        </section>
      )}

      <section className="border border-white/10 bg-white/5 p-5 backdrop-blur-[10px]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">
              {isAdmin ? 'Payment Ledger' : 'My Payments'}
            </h2>
            <p className="text-sm text-gray-300">
              {isAdmin
                ? 'Every payment record in the system, with member and membership context for faster review.'
                : 'Track the status of your submitted payments and see what each status means.'}
            </p>
          </div>
          {!loading && payments.length === 0 && (
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
              {isAdmin && hasActiveAdminFilters ? 'No payments match the current filters.' : 'No payment records yet.'}
            </p>
          )}
        </div>

        <div className="mt-4 grid gap-4">
          {payments.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              canReview={isAdmin}
              onStatusChange={handleStatusChange}
              actionKey={actionStatus.actionKey}
              isAdmin={isAdmin}
              reviewNote={reviewNotes[payment.id] || ''}
              onReviewNoteChange={(paymentId, value) =>
                setReviewNotes((current) => ({ ...current, [paymentId]: value }))
              }
            />
          ))}
        </div>
        <PaginationControls
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.total}
          totalPages={pagination.totalPages}
          itemLabel={isAdmin ? 'ledger records' : 'payments'}
          onPageChange={setPage}
        />
      </section>
    </DashboardLayout>
  )
}
