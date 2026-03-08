import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PLAN_CATALOG } from '../utils/planCatalog'

function validateAccount({ name, email, phone, password, role, inviteCode }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Name is required'
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim())) errors.email = 'Use a valid @gmail.com email'
  if (!/^\d{10}$/.test(phone.trim())) errors.phone = 'Phone must be exactly 10 digits'
  if (!password) errors.password = 'Password is required'
  if (!role) errors.role = 'Role is required'
  if (role !== 'MEMBER' && !inviteCode) errors.inviteCode = 'Invite code is required'
  return errors
}

export default function Register() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [inviteCode, setInviteCode] = useState('')
  const [selectedPlanKey, setSelectedPlanKey] = useState(PLAN_CATALOG[1].key)
  const [error, setError] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const selectedPlan = useMemo(
    () => PLAN_CATALOG.find((plan) => plan.key === selectedPlanKey) || PLAN_CATALOG[0],
    [selectedPlanKey],
  )

  const goNext = () => {
    const nextErrors = validateAccount({ name, email, phone, password, role, inviteCode })
    if (Object.keys(nextErrors).length > 0) {
      setError(nextErrors)
      return
    }
    setError({})
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validateAccount({ name, email, phone, password, role, inviteCode })
    if (Object.keys(nextErrors).length > 0) {
      setError(nextErrors)
      setStep(1)
      return
    }

    setError({})
    setIsSubmitting(true)
    try {
      const dashboardPath = await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        inviteCode: inviteCode || undefined,
      })

      if (role === 'MEMBER') {
        navigate('/subscriptions', {
          state: {
            preselectedPlanKey: selectedPlan.key,
            onboardingName: name.trim(),
          },
        })
      } else {
        navigate(dashboardPath)
      }
    } catch (err) {
      setError({
        form: err?.message || 'Registration failed. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0f14] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(226,26,44,0.22),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(255,116,61,0.2),transparent_38%),linear-gradient(150deg,#080a0f_0%,#101822_55%,#0b0f14_100%)]" />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-3xl space-y-6 border border-white/10 bg-black/45 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-[20px]"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#ff7a45]">Onboarding</p>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-[0.08em]">Create Your Gym Account</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em]">
            <span className={`${step === 1 ? 'bg-[#E21A2C]' : 'bg-white/15'} px-3 py-1`}>1. Profile</span>
            <span className={`${step === 2 ? 'bg-[#E21A2C]' : 'bg-white/15'} px-3 py-1`}>2. Package</span>
          </div>
        </div>

        {error.form && <p className="text-sm font-semibold text-[#ff5d73]">{error.form}</p>}

        {step === 1 && (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
              />
              {error.name && <p className="mt-1 text-sm font-semibold text-[#ff5d73]">{error.name}</p>}
            </div>

            <div className="space-y-1">
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
              />
              {error.email && <p className="mt-1 text-sm font-semibold text-[#ff5d73]">{error.email}</p>}
            </div>

            <div className="space-y-1">
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Phone (10 digits)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
              />
              {error.phone && <p className="mt-1 text-sm font-semibold text-[#ff5d73]">{error.phone}</p>}
            </div>

            <div className="space-y-1">
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
              />
              {error.password && <p className="mt-1 text-sm font-semibold text-[#ff5d73]">{error.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
              >
                <option value="MEMBER">Member</option>
                <option value="TRAINER">Trainer</option>
                <option value="ADMIN">Admin</option>
              </select>
              {error.role && <p className="mt-1 text-sm font-semibold text-[#ff5d73]">{error.role}</p>}
            </div>

            {role !== 'MEMBER' && (
              <div className="space-y-1 md:col-span-2">
                <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
                  Invite Code ({role})
                </label>
                <input
                  type="password"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
                />
                {error.inviteCode && <p className="mt-1 text-sm font-semibold text-[#ff5d73]">{error.inviteCode}</p>}
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <p className="text-sm text-gray-200">
              Select your starter package. This pre-fills your subscription setup right after sign-up.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {PLAN_CATALOG.map((plan) => (
                <button
                  key={plan.key}
                  type="button"
                  onClick={() => setSelectedPlanKey(plan.key)}
                  className={`border p-4 text-left transition-colors ${
                    selectedPlanKey === plan.key
                      ? 'border-[#E21A2C] bg-[#E21A2C]/15'
                      : 'border-white/10 bg-white/5 hover:border-[#ff7a45]/70'
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#ff7a45]">{plan.name}</p>
                  <p className="mt-1 text-xl font-black">Rs {plan.priceInr.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-300">{plan.durationDays} days</p>
                  <p className="mt-2 text-xs text-gray-400">{plan.perks}</p>
                </button>
              ))}
            </div>
            <div className="border border-white/10 bg-white/5 p-3 text-sm text-gray-200">
              <span className="font-semibold text-white">Selected:</span> {selectedPlan.name} ({selectedPlan.durationDays} days)
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border border-white/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white hover:border-white/40"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={goNext}
              className="border border-white/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white hover:border-white/40"
            >
              Continue
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="border border-[#E21A2C] bg-[#E21A2C] px-5 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#c31626] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : step === 2 ? 'Create Account' : 'Create with Default Plan'}
          </button>
        </div>
      </form>
    </div>
  )
}
