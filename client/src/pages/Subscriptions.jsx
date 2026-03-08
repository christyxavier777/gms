import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { PLAN_CATALOG } from '../utils/planCatalog'

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

export default function Subscriptions() {
  const { token, user } = useAuth()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN'
  const isMember = user?.role === 'MEMBER'

  const [members, setMembers] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [mySubscription, setMySubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const [selectedPlanKey, setSelectedPlanKey] = useState(PLAN_CATALOG[0].key)
  const [form, setForm] = useState({
    userId: '',
    planName: PLAN_CATALOG[0].name,
    startDate: today,
    endDate: addDays(today, PLAN_CATALOG[0].durationDays),
  })

  useEffect(() => {
    const preselectedPlanKey = location.state?.preselectedPlanKey
    if (!preselectedPlanKey) return
    const plan = PLAN_CATALOG.find((item) => item.key === preselectedPlanKey)
    if (!plan) return
    setSelectedPlanKey(plan.key)
    setForm((prev) => ({
      ...prev,
      planName: plan.name,
      endDate: addDays(prev.startDate, plan.durationDays),
    }))
  }, [location.state])

  const loadData = useCallback(async () => {
    if (!token) return
    try {
      setLoading(true)
      setError('')
      if (isAdmin) {
        const [usersData, subData] = await Promise.all([
          api.listUsers(token),
          api.listSubscriptions(token),
        ])
        const memberUsers = (usersData.users || []).filter((u) => u.role === 'MEMBER')
        setMembers(memberUsers)
        setSubscriptions(subData.subscriptions || [])
        setForm((prev) =>
          !prev.userId && memberUsers.length > 0 ? { ...prev, userId: memberUsers[0].id } : prev,
        )
      } else if (isMember) {
        const data = await api.getMySubscription(token)
        setMySubscription(data.subscription || null)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load subscriptions.')
    } finally {
      setLoading(false)
    }
  }, [token, isAdmin, isMember])

  useEffect(() => {
    loadData()
  }, [loadData])

  const hasLiveAdminData = subscriptions.length > 0
  const demoSubscriptions = [
    {
      id: 's-1',
      userId: 'MEM-108',
      planName: 'Pro Quarterly',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
      status: 'ACTIVE',
    },
    {
      id: 's-2',
      userId: 'MEM-204',
      planName: 'Transformation Monthly',
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
      status: 'EXPIRED',
    },
    {
      id: 's-3',
      userId: 'MEM-056',
      planName: 'Premium Half-Year',
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 160).toISOString(),
      status: 'CANCELLED',
    },
  ]
  const displaySubscriptions = hasLiveAdminData ? subscriptions : demoSubscriptions
  const displayMySubscription =
    mySubscription ||
    {
      id: 'my-demo-1',
      planName: 'Pro Quarterly',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(),
      status: 'ACTIVE',
    }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')
      await api.createSubscription(token, form)
      setSuccess('Subscription created.')
      await loadData()
    } catch (err) {
      setError(err?.message || 'Failed to create subscription.')
    }
  }

  const handleCancel = async (subscriptionId) => {
    try {
      setError('')
      setSuccess('')
      await api.cancelSubscription(token, subscriptionId)
      setSuccess('Subscription cancelled.')
      await loadData()
    } catch (err) {
      setError(err?.message || 'Failed to cancel subscription.')
    }
  }

  const handleSelectPlan = (planKey) => {
    const plan = PLAN_CATALOG.find((item) => item.key === planKey)
    if (!plan) return
    setSelectedPlanKey(planKey)
    setForm((prev) => ({
      ...prev,
      planName: plan.name,
      endDate: addDays(prev.startDate, plan.durationDays),
    }))
  }

  const handleStartDateChange = (nextDate) => {
    const plan = PLAN_CATALOG.find((item) => item.key === selectedPlanKey)
    setForm((prev) => ({
      ...prev,
      startDate: nextDate,
      endDate: plan ? addDays(nextDate, plan.durationDays) : prev.endDate,
    }))
  }

  return (
    <DashboardLayout title="Subscriptions">
      {loading && <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Loading subscriptions...</p>}
      {error && <p className="text-sm font-semibold text-[#E21A2C]">{error}</p>}
      {success && <p className="text-sm font-semibold text-green-400">{success}</p>}
      {isAdmin && !hasLiveAdminData && !loading && (
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
          Presentation mode: showing representative subscription lifecycle data.
        </p>
      )}

      {isAdmin && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Total Subscriptions</p>
              <p className="mt-2 text-2xl font-black text-white">{displaySubscriptions.length}</p>
            </article>
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Active</p>
              <p className="mt-2 text-2xl font-black text-white">{displaySubscriptions.filter((s) => s.status === 'ACTIVE').length}</p>
            </article>
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Expired</p>
              <p className="mt-2 text-2xl font-black text-white">{displaySubscriptions.filter((s) => s.status === 'EXPIRED').length}</p>
            </article>
            <article className="border border-[#2f2f2f] bg-[#111111] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-gray-400">Cancelled</p>
              <p className="mt-2 text-2xl font-black text-white">{displaySubscriptions.filter((s) => s.status === 'CANCELLED').length}</p>
            </article>
          </section>

          <form onSubmit={handleCreate} className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Create Subscription</h2>
            {location.state?.onboardingName && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#ff7a45]">
                Welcome {location.state.onboardingName}. Package preference preselected from onboarding.
              </p>
            )}
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {PLAN_CATALOG.map((plan) => (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => handleSelectPlan(plan.key)}
                  className={`border p-3 text-left transition-colors ${
                    selectedPlanKey === plan.key
                      ? 'border-[#E21A2C] bg-[#1A1A1A]'
                      : 'border-[#2f2f2f] bg-[#141414] hover:border-[#E21A2C]/60'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#E21A2C]">{plan.name}</p>
                  <p className="mt-1 text-lg font-black text-white">Rs {plan.priceInr.toLocaleString('en-IN')}</p>
                  <p className="mt-1 text-xs text-gray-300">{plan.durationDays} days</p>
                  <p className="mt-1 text-xs text-gray-400">{plan.perks}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                value={form.userId}
                onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              >
                <option value="">Select Member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Plan Name"
                value={form.planName}
                onChange={(e) => setForm((prev) => ({ ...prev, planName: e.target.value }))}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
              <input
                type="date"
                value={form.endDate}
                readOnly
                className="w-full border border-[#333333] bg-[#121212] px-3 py-2 text-white outline-none"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              End date is auto-calculated based on the selected plan duration.
            </p>
            <button
              type="submit"
              disabled={!form.userId || !form.planName || !form.startDate || !form.endDate}
              className="mt-4 border border-[#E21A2C] bg-[#E21A2C] px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white disabled:opacity-50"
            >
              Create Subscription
            </button>
          </form>

          <section className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">All Subscriptions</h2>
            <div className="mt-4 space-y-3">
              {displaySubscriptions.length === 0 && <p className="text-sm text-gray-300">No subscriptions found.</p>}
              {displaySubscriptions.map((sub) => (
                <div key={sub.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{sub.planName}</p>
                  <p className="mt-1 text-sm text-gray-300">Member ID: {sub.userId}</p>
                  <p className="mt-1 text-sm text-gray-300">
                    {toInputDate(sub.startDate)} to {toInputDate(sub.endDate)} | Status: {sub.status}
                  </p>
                  {sub.status === 'ACTIVE' && hasLiveAdminData && (
                    <button
                      type="button"
                      onClick={() => handleCancel(sub.id)}
                      className="mt-3 border border-[#E21A2C] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {isMember && (
        <section className="grid gap-4 lg:grid-cols-2">
          <article className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Available Plans</h2>
            <div className="mt-4 space-y-3">
              {PLAN_CATALOG.map((plan) => (
                <div key={plan.key} className="border border-[#2f2f2f] bg-[#1A1A1A] p-3">
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{plan.name}</p>
                  <p className="mt-1 text-lg font-black text-white">Rs {plan.priceInr.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-300">{plan.durationDays} days</p>
                  <p className="text-xs text-gray-400">{plan.perks}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">My Subscription</h2>
            {!mySubscription && !loading && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-yellow-300">
                Presentation mode: showing sample active subscription.
              </p>
            )}
            <div className="mt-4 border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{displayMySubscription.planName}</p>
              <p className="mt-1 text-sm text-gray-300">
                {toInputDate(displayMySubscription.startDate)} to {toInputDate(displayMySubscription.endDate)}
              </p>
              <p className="mt-1 text-sm text-gray-300">Status: {displayMySubscription.status}</p>
            </div>
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
