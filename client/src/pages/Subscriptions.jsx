import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'

function toInputDate(value) {
  try {
    return new Date(value).toISOString().slice(0, 10)
  } catch (_error) {
    return ''
  }
}

export default function Subscriptions() {
  const { token, user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const isMember = user?.role === 'MEMBER'

  const [members, setMembers] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [mySubscription, setMySubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({
    userId: '',
    planName: '',
    startDate: today,
    endDate: today,
  })

  const loadData = async () => {
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
        if (!form.userId && memberUsers.length > 0) {
          setForm((prev) => ({ ...prev, userId: memberUsers[0].id }))
        }
      } else if (isMember) {
        const data = await api.getMySubscription(token)
        setMySubscription(data.subscription || null)
      }
    } catch (err) {
      setError(err?.message || 'Failed to load subscriptions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [token, user?.role])

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

  return (
    <DashboardLayout title="Subscriptions">
      {loading && <p className="text-sm font-semibold uppercase tracking-[0.08em] text-gray-300">Loading subscriptions...</p>}
      {error && <p className="text-sm font-semibold text-[#E21A2C]">{error}</p>}
      {success && <p className="text-sm font-semibold text-green-400">{success}</p>}

      {isAdmin && (
        <>
          <form onSubmit={handleCreate} className="border border-[#2f2f2f] bg-[#111111] p-5">
            <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">Create Subscription</h2>
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
                onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-white outline-none focus:border-[#E21A2C]"
              />
            </div>
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
              {subscriptions.length === 0 && <p className="text-sm text-gray-300">No subscriptions found.</p>}
              {subscriptions.map((sub) => (
                <div key={sub.id} className="border border-[#2f2f2f] bg-[#1A1A1A] p-4">
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{sub.planName}</p>
                  <p className="mt-1 text-sm text-gray-300">Member ID: {sub.userId}</p>
                  <p className="mt-1 text-sm text-gray-300">
                    {toInputDate(sub.startDate)} to {toInputDate(sub.endDate)} | Status: {sub.status}
                  </p>
                  {sub.status === 'ACTIVE' && (
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
        <section className="border border-[#2f2f2f] bg-[#111111] p-5">
          <h2 className="text-lg font-black uppercase tracking-[0.08em] text-white">My Subscription</h2>
          {!mySubscription ? (
            <p className="mt-4 text-sm text-gray-300">No subscription found.</p>
          ) : (
            <div className="mt-4 border border-[#2f2f2f] bg-[#1A1A1A] p-4">
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#E21A2C]">{mySubscription.planName}</p>
              <p className="mt-1 text-sm text-gray-300">
                {toInputDate(mySubscription.startDate)} to {toInputDate(mySubscription.endDate)}
              </p>
              <p className="mt-1 text-sm text-gray-300">Status: {mySubscription.status}</p>
            </div>
          )}
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
