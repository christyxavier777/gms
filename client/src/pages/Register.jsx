import { useEffect, useId, useMemo, useState } from 'react'
import StatusBanner from '../components/StatusBanner'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../services/api'
import { getServerStateErrorMessage } from '../server-state/errors'
import { useMembershipPlansQuery } from '../server-state/queries'
import {
  getPasswordChecklist,
  getPasswordStrength,
  isStrongPassword,
  isValidEmail,
  passwordRuleText,
} from '../utils/authValidation'

function validateAccount({ name, email, phone, password, role, inviteCode }) {
  const errors = {}
  if (!name.trim()) errors.name = 'Name is required'
  if (!isValidEmail(email)) errors.email = 'Use a valid email address'
  if (!/^\d{10}$/.test(phone.trim())) errors.phone = 'Phone must be exactly 10 digits'
  if (!password) errors.password = 'Password is required'
  else if (!isStrongPassword(password)) errors.password = passwordRuleText
  if (!role) errors.role = 'Role is required'
  if (role !== 'MEMBER' && !inviteCode.trim()) errors.inviteCode = 'Invite code is required'
  return errors
}

function formatAmount(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Rs -'
  return `Rs ${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

function getFriendlyFlowError(error, stage) {
  if (error?.code === 'ACTIVE_SUBSCRIPTION_OVERLAP') {
    return 'This account already has an active membership period. Open your dashboard or payments page instead of starting another activation.'
  }

  if (stage === 'subscription') {
    return (
      error?.message ||
      'Your account was created, but membership setup did not finish. Retry below and we will continue from the saved step.'
    )
  }

  if (stage === 'payment') {
    return (
      error?.message ||
      'Your account and membership are ready, but payment submission did not finish. Retry now or continue later from the payments page.'
    )
  }

  return error?.message || 'Registration failed. Please try again.'
}

const stepLabels = ['Profile', 'Package', 'Payment', 'Finish']
const preferredDefaultPlanId = 'pro-quarterly'
const EMPTY_MEMBERSHIP_PLANS = []

function getPreferredPlan(plans, preferredPlanId) {
  return plans.find((plan) => plan.id === preferredPlanId) || plans[0] || null
}

function getStepTone(stepNumber, currentStep) {
  if (currentStep > stepNumber) {
    return 'border-emerald-400/40 bg-[linear-gradient(155deg,rgba(16,185,129,0.24),rgba(255,255,255,0.04))] text-emerald-200'
  }

  if (currentStep === stepNumber) {
    return 'border-[#E21A2C]/60 bg-[linear-gradient(155deg,rgba(226,26,44,0.3),rgba(255,122,69,0.12))] text-white shadow-[0_12px_30px_rgba(226,26,44,0.18)]'
  }

  return 'border-white/10 bg-white/5 text-gray-400'
}

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

export default function Register() {
  const baseId = useId()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('MEMBER')
  const [inviteCode, setInviteCode] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    upiId: '',
    proofReference: '',
  })
  const [error, setError] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activation, setActivation] = useState({
    account: null,
    subscription: null,
    payment: null,
    sessionToken: '',
    dashboardPath: '/member',
  })
  const { register } = useAuth()
  const navigate = useNavigate()
  const membershipPlansQuery = useMembershipPlansQuery()
  const membershipPlans = membershipPlansQuery.data?.plans ?? EMPTY_MEMBERSHIP_PLANS
  const plansLoading = membershipPlansQuery.isPending
  const catalogError = membershipPlansQuery.error
    ? getServerStateErrorMessage(membershipPlansQuery.error, 'Failed to load membership packages.')
    : !plansLoading && membershipPlans.length === 0
      ? 'Membership packages are temporarily unavailable. Please try again shortly.'
      : ''
  const ids = {
    formMessage: `${baseId}-form-message`,
    name: `${baseId}-name`,
    nameHint: `${baseId}-name-hint`,
    nameError: `${baseId}-name-error`,
    email: `${baseId}-email`,
    emailHint: `${baseId}-email-hint`,
    emailError: `${baseId}-email-error`,
    phone: `${baseId}-phone`,
    phoneHint: `${baseId}-phone-hint`,
    phoneError: `${baseId}-phone-error`,
    password: `${baseId}-password`,
    passwordHint: `${baseId}-password-hint`,
    passwordError: `${baseId}-password-error`,
    role: `${baseId}-role`,
    roleHint: `${baseId}-role-hint`,
    roleError: `${baseId}-role-error`,
    inviteCode: `${baseId}-invite-code`,
    inviteCodeHint: `${baseId}-invite-code-hint`,
    inviteCodeError: `${baseId}-invite-code-error`,
    paymentAmount: `${baseId}-payment-amount`,
    paymentUpi: `${baseId}-payment-upi`,
    paymentProof: `${baseId}-payment-proof`,
    paymentError: `${baseId}-payment-error`,
  }

  const isMemberFlow = role === 'MEMBER'
  const selectedPlan = useMemo(
    () => getPreferredPlan(membershipPlans, selectedPlanId || preferredDefaultPlanId),
    [membershipPlans, selectedPlanId],
  )
  const passwordChecklist = useMemo(() => getPasswordChecklist(password), [password])
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password])

  useEffect(() => {
    if (membershipPlans.length === 0) return

    const nextSelectedPlan = getPreferredPlan(membershipPlans, selectedPlanId || preferredDefaultPlanId)
    if (!nextSelectedPlan) return

    setSelectedPlanId((current) => current || nextSelectedPlan.id)
    setPaymentForm((current) => (current.amount ? current : { ...current, amount: String(nextSelectedPlan.priceInr) }))
  }, [membershipPlans, selectedPlanId])

  useEffect(() => {
    if (role === 'MEMBER') return

    const nextSelectedPlan = getPreferredPlan(membershipPlans, preferredDefaultPlanId)
    setStep(1)
    setSelectedPlanId(nextSelectedPlan?.id || '')
    setPaymentForm({
      amount: nextSelectedPlan ? String(nextSelectedPlan.priceInr) : '',
      upiId: '',
      proofReference: '',
    })
    setActivation({
      account: null,
      subscription: null,
      payment: null,
      sessionToken: '',
      dashboardPath: '/member',
    })
    setError({})
  }, [role, membershipPlans])

  const clearFieldError = (fieldName) => {
    setError((current) => {
      if (!current[fieldName]) return current
      const next = { ...current }
      delete next[fieldName]
      return next
    })
  }

  const clearFlowErrors = () => {
    setError((current) => {
      if (!current.form && !current.payment) return current
      const next = { ...current }
      delete next.form
      delete next.payment
      return next
    })
  }

  const goToPackage = () => {
    const nextErrors = validateAccount({ name, email, phone, password, role, inviteCode })
    if (Object.keys(nextErrors).length > 0) {
      setError(nextErrors)
      return
    }

    if (isMemberFlow && !selectedPlan) {
      setError((current) => ({
        ...current,
        form:
          catalogError ||
          (plansLoading
            ? 'Membership packages are still loading. Please wait a moment and try again.'
            : 'No membership packages are available right now.'),
      }))
      return
    }

    clearFlowErrors()
    setStep(2)
  }

  const handleSelectPlan = (planId) => {
    const plan = membershipPlans.find((item) => item.id === planId)
    if (!plan) return

    setSelectedPlanId(planId)
    setPaymentForm((current) => ({
      ...current,
      amount: String(plan.priceInr),
    }))
    clearFlowErrors()
  }

  const ensureMemberActivation = async () => {
    const nextErrors = validateAccount({ name, email, phone, password, role, inviteCode })
    if (Object.keys(nextErrors).length > 0) {
      setError(nextErrors)
      setStep(1)
      return
    }

    setIsSubmitting(true)
    clearFlowErrors()

    const normalizedEmail = email.trim().toLowerCase()
    let nextAccount = activation.account
    let sessionToken = activation.sessionToken
    let dashboardPath = activation.dashboardPath

    try {
      if (!nextAccount) {
        const registrationResult = await register({
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          password,
          role,
          inviteCode: inviteCode || undefined,
        })

        nextAccount = registrationResult.user
        sessionToken = registrationResult.sessionToken
        dashboardPath = registrationResult.dashboardPath

        setActivation((current) => ({
          ...current,
          account: registrationResult.user,
          sessionToken: registrationResult.sessionToken,
          dashboardPath: registrationResult.dashboardPath,
        }))
      }

      if (!activation.subscription) {
        if (!selectedPlan) {
          throw new Error(catalogError || 'Select a membership package before continuing.')
        }

        const data = await api.createOnboardingSubscription(sessionToken || 'cookie-session', {
          planId: selectedPlan.id,
        })

        setActivation((current) => ({
          ...current,
          account: current.account || nextAccount,
          sessionToken: current.sessionToken || sessionToken || 'cookie-session',
          dashboardPath,
          subscription: data.subscription,
        }))
      }

      setStep(3)
    } catch (err) {
      const stage = nextAccount ? 'subscription' : 'account'
      setError((current) => ({
        ...current,
        form: getFriendlyFlowError(err, stage),
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNonMemberRegistration = async () => {
    const nextErrors = validateAccount({ name, email, phone, password, role, inviteCode })
    if (Object.keys(nextErrors).length > 0) {
      setError(nextErrors)
      return
    }

    setIsSubmitting(true)
    clearFlowErrors()

    try {
      const { dashboardPath } = await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        role,
        inviteCode: inviteCode || undefined,
      })
      navigate(dashboardPath)
    } catch (err) {
      setError((current) => ({
        ...current,
        form: getFriendlyFlowError(err, 'account'),
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentSubmit = async () => {
    const amount = Number(paymentForm.amount)
    const upiId = paymentForm.upiId.trim()
    const proofReference = paymentForm.proofReference.trim()

    if (!activation.account || !activation.subscription) {
      setError((current) => ({
        ...current,
        form: 'Finish account and membership setup before submitting payment.',
      }))
      setStep(2)
      return
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError((current) => ({
        ...current,
        payment: 'Enter a valid payment amount.',
      }))
      return
    }

    if (!upiId) {
      setError((current) => ({
        ...current,
        payment: 'Enter your UPI handle to continue.',
      }))
      return
    }

    if (proofReference && proofReference.length < 3) {
      setError((current) => ({
        ...current,
        payment: 'If you add a proof reference, use at least 3 characters.',
      }))
      return
    }

    if (proofReference.length > 500) {
      setError((current) => ({
        ...current,
        payment: 'Proof reference must be 500 characters or fewer.',
      }))
      return
    }

    setIsSubmitting(true)
    setError((current) => {
      const next = { ...current }
      delete next.payment
      delete next.form
      return next
    })

    try {
      const data = await api.createUpiPayment(activation.sessionToken || 'cookie-session', {
        userId: activation.account.id,
        subscriptionId: activation.subscription.id,
        amount,
        upiId,
        ...(proofReference ? { proofReference } : {}),
      })

      setActivation((current) => ({
        ...current,
        subscription: data.payment?.subscription || current.subscription,
        payment: data.payment,
      }))
      setStep(4)
    } catch (err) {
      setError((current) => ({
        ...current,
        payment: getFriendlyFlowError(err, 'payment'),
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRazorpayCheckout = async () => {
    if (!activation.account || !activation.subscription) {
      setError((current) => ({
        ...current,
        form: 'Finish account and membership setup before starting Razorpay checkout.',
      }))
      setStep(2)
      return
    }

    setIsSubmitting(true)
    setError((current) => {
      const next = { ...current }
      delete next.payment
      delete next.form
      return next
    })

    try {
      const checkoutScriptReady = await loadRazorpayCheckoutScript()
      if (!checkoutScriptReady || !window.Razorpay) {
        throw new Error('Could not load Razorpay Checkout. Please try again.')
      }

      const orderResult = await api.createRazorpayOrder(activation.sessionToken || 'cookie-session', {
        subscriptionId: activation.subscription.id,
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
            const verificationResult = await api.verifyRazorpayPayment(
              activation.sessionToken || 'cookie-session',
              {
                paymentId: orderResult.payment.id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            )

            setActivation((current) => ({
              ...current,
              subscription: verificationResult.payment?.subscription || current.subscription,
              payment: verificationResult.payment,
            }))
            setStep(4)
          } catch (err) {
            setError((current) => ({
              ...current,
              payment: getFriendlyFlowError(err, 'payment'),
            }))
          } finally {
            setIsSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false)
            setError((current) => ({
              ...current,
              payment: 'Razorpay checkout was closed before payment completion.',
            }))
          },
        },
      })

      razorpay.on('payment.failed', (response) => {
        setIsSubmitting(false)
        setError((current) => ({
          ...current,
          payment: response?.error?.description || 'Razorpay payment failed. Please try again.',
        }))
      })

      razorpay.open()
    } catch (err) {
      setError((current) => ({
        ...current,
        payment: getFriendlyFlowError(err, 'payment'),
      }))
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isMemberFlow) {
      await handleNonMemberRegistration()
      return
    }

    if (step === 1) {
      goToPackage()
      return
    }

    if (step === 2) {
      await ensureMemberActivation()
      return
    }

    if (step === 3) {
      await handlePaymentSubmit()
    }
  }

  const activationStatuses = [
    {
      label: 'Account',
      ready: Boolean(activation.account),
      detail: activation.account ? 'Created and signed in' : 'Not created yet',
    },
    {
      label: 'Membership',
      ready: Boolean(activation.subscription),
      detail: activation.subscription ? activation.subscription.planName : 'Waiting for setup',
    },
    {
      label: 'Payment',
      ready: Boolean(activation.payment),
      detail: activation.payment ? activation.payment.status : 'Not submitted yet',
    },
  ]

  const renderProgress = () => {
    if (!isMemberFlow) return null

    return (
      <div className="grid gap-2 text-xs font-bold uppercase tracking-[0.08em] sm:grid-cols-4">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1

          return (
            <div
              key={label}
              className={`flex min-w-[120px] items-center gap-3 border px-3 py-2 ${getStepTone(stepNumber, step)}`}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-current text-[11px]">
                {step > stepNumber ? '✓' : stepNumber}
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] tracking-[0.14em] text-gray-400/90">Step {stepNumber}</span>
                <span className="block">{label}</span>
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0f14] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(226,26,44,0.22),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(255,116,61,0.2),transparent_38%),linear-gradient(150deg,#080a0f_0%,#101822_55%,#0b0f14_100%)]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(255,214,170,0.12),transparent_55%)]" />

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={error.form ? ids.formMessage : undefined}
        className="relative w-full max-w-5xl space-y-6 overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,20,0.92),rgba(7,10,16,0.82))] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.52)] backdrop-blur-[22px]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.05),transparent_28%,transparent_72%,rgba(255,255,255,0.03))]" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffb26b]">
              {isMemberFlow ? 'Onboarding' : 'Team Access'}
            </p>
            <h1 className="mt-2 bg-[linear-gradient(90deg,#fff6e9_0%,#ffffff_35%,#ffd5b6_100%)] bg-clip-text text-3xl font-black uppercase tracking-[0.08em] text-transparent sm:text-4xl">
              {isMemberFlow ? 'Create Your Gym Account' : 'Create Staff Account'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-300">
              {isMemberFlow
                ? 'Complete registration, choose a membership, submit your payment, and finish with a clear activation summary.'
                : 'Create an invited admin or trainer account with the correct access code.'}
            </p>
            {isMemberFlow && (
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Live Catalog</p>
                  <p className="mt-1 text-lg font-black text-white">{membershipPlans.length || '-'}</p>
                  <p className="text-xs text-gray-400">Packages ready to present</p>
                </div>
                <div className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Preferred Flow</p>
                  <p className="mt-1 text-lg font-black text-white">Razorpay</p>
                  <p className="text-xs text-gray-400">Fastest demo checkout</p>
                </div>
                <div className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] px-3 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Fallback</p>
                  <p className="mt-1 text-lg font-black text-white">Manual UPI</p>
                  <p className="text-xs text-gray-400">Use if checkout is blocked</p>
                </div>
              </div>
            )}
          </div>
          {renderProgress()}
        </div>

        {(activation.account || activation.subscription || activation.payment) && (
          <section className="border border-white/10 bg-white/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff7a45]">Activation Progress</p>
                <p className="mt-1 text-sm text-gray-300">
                  Completed steps stay saved in this session, so retries continue from where the flow stopped.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {activationStatuses.map((item) => (
                  <div key={item.label} className="border border-white/10 bg-black/30 px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400">{item.label}</p>
                    <p className={`mt-1 text-sm font-semibold ${item.ready ? 'text-emerald-300' : 'text-gray-200'}`}>
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {error.form && (
          <StatusBanner id={ids.formMessage} message={error.form} />
        )}
        {isMemberFlow && catalogError && !error.form && (
          <StatusBanner variant="info" title="Package Catalog" message={catalogError} />
        )}

        {step === 1 && (
          <fieldset className="grid gap-4 md:grid-cols-2">
            <legend className="sr-only">Profile details</legend>
            <div className="space-y-1 md:col-span-2">
              <label htmlFor={ids.name} className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
                Name
              </label>
              <input
                id={ids.name}
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  clearFieldError('name')
                }}
                aria-invalid={Boolean(error.name)}
                aria-describedby={error.name ? ids.nameError : ids.nameHint}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
                placeholder="Enter your full name"
              />
              {!error.name && (
                <p id={ids.nameHint} className="mt-1 text-xs text-gray-500">
                  This is the display name your gym staff will see.
                </p>
              )}
              {error.name && (
                <p id={ids.nameError} role="alert" className="mt-1 text-sm font-semibold text-[#ff5d73]">
                  {error.name}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor={ids.email} className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
                Email
              </label>
              <input
                id={ids.email}
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  clearFieldError('email')
                }}
                aria-invalid={Boolean(error.email)}
                aria-describedby={error.email ? ids.emailError : ids.emailHint}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
                placeholder="you@example.com"
              />
              {!error.email && (
                <p id={ids.emailHint} className="mt-1 text-xs text-gray-500">
                  We will use this email for login and billing updates.
                </p>
              )}
              {error.email && (
                <p id={ids.emailError} role="alert" className="mt-1 text-sm font-semibold text-[#ff5d73]">
                  {error.email}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor={ids.phone} className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
                Phone (10 digits)
              </label>
              <input
                id={ids.phone}
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value.replace(/[^0-9]/g, '').slice(0, 10))
                  clearFieldError('phone')
                }}
                aria-invalid={Boolean(error.phone)}
                aria-describedby={error.phone ? ids.phoneError : ids.phoneHint}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
                placeholder="10-digit mobile number"
              />
              {!error.phone && (
                <p id={ids.phoneHint} className="mt-1 text-xs text-gray-500">
                  Used for member identity checks and front-desk contact.
                </p>
              )}
              {error.phone && (
                <p id={ids.phoneError} role="alert" className="mt-1 text-sm font-semibold text-[#ff5d73]">
                  {error.phone}
                </p>
              )}
            </div>

            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor={ids.password} className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-controls={ids.password}
                  aria-pressed={showPassword}
                  className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#ff7a45] hover:text-white"
                >
                  {showPassword ? 'Hide password' : 'Show password'}
                </button>
              </div>
              <input
                id={ids.password}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  clearFieldError('password')
                }}
                aria-invalid={Boolean(error.password)}
                aria-describedby={error.password ? ids.passwordError : ids.passwordHint}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
                placeholder="Create a secure password"
              />
              <div id={ids.passwordHint} className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                <p className="text-gray-400">{passwordRuleText}</p>
                <p className={`font-semibold uppercase tracking-[0.08em] ${passwordStrength.tone}`}>
                  Strength: {passwordStrength.label}
                </p>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {passwordChecklist.map((rule) => (
                  <div
                    key={rule.key}
                    className={`border px-3 py-2 text-xs ${
                      rule.met
                        ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
                        : 'border-white/10 bg-white/5 text-gray-300'
                    }`}
                  >
                    {rule.label}
                  </div>
                ))}
              </div>
              {error.password && (
                <p id={ids.passwordError} role="alert" className="mt-2 text-sm font-semibold text-[#ff5d73]">
                  {error.password}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor={ids.role} className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
                Role
              </label>
              <select
                id={ids.role}
                value={role}
                onChange={(event) => {
                  setRole(event.target.value)
                  clearFieldError('role')
                }}
                aria-invalid={Boolean(error.role)}
                aria-describedby={error.role ? ids.roleError : ids.roleHint}
                className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
              >
                <option value="MEMBER">Member</option>
                <option value="TRAINER">Trainer</option>
                <option value="ADMIN">Admin</option>
              </select>
              {!error.role && (
                <p id={ids.roleHint} className="mt-1 text-xs text-gray-500">
                  Members get guided onboarding. Staff accounts require the correct invite code.
                </p>
              )}
              {error.role && (
                <p id={ids.roleError} role="alert" className="mt-1 text-sm font-semibold text-[#ff5d73]">
                  {error.role}
                </p>
              )}
            </div>

            {role !== 'MEMBER' && (
              <div className="space-y-1">
                <label htmlFor={ids.inviteCode} className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
                  Invite Code ({role})
                </label>
                <input
                  id={ids.inviteCode}
                  type="password"
                  value={inviteCode}
                  onChange={(event) => {
                    setInviteCode(event.target.value)
                    clearFieldError('inviteCode')
                  }}
                  aria-invalid={Boolean(error.inviteCode)}
                  aria-describedby={error.inviteCode ? ids.inviteCodeError : ids.inviteCodeHint}
                  className="w-full border border-white/15 bg-white/5 px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
                  placeholder={`Enter ${role.toLowerCase()} invite code`}
                />
                {!error.inviteCode && (
                  <p id={ids.inviteCodeHint} className="mt-1 text-xs text-gray-500">
                    Invite codes protect staff-only access during account creation.
                  </p>
                )}
                {error.inviteCode && (
                  <p id={ids.inviteCodeError} role="alert" className="mt-1 text-sm font-semibold text-[#ff5d73]">
                    {error.inviteCode}
                  </p>
                )}
              </div>
            )}
          </fieldset>
        )}

        {isMemberFlow && step === 2 && (
          <fieldset className="space-y-5">
            <legend className="sr-only">Choose membership package</legend>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff7a45]">Choose Your Package</p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-[0.08em] text-white">
                  Pick the membership you want to start with
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-gray-300">
                  We will create your account, set up the membership for this package, and then move straight into payment.
                </p>
              </div>
              <div className="border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Billing Summary</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {selectedPlan ? formatAmount(selectedPlan.priceInr) : 'Rs -'}
                </p>
                <p className="text-xs text-gray-300">
                  {selectedPlan ? `${selectedPlan.durationDays} day membership` : 'Package duration unavailable'}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Membership packages">
              {plansLoading && (
                <div className="md:col-span-3 border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                  Loading membership packages from the live catalog...
                </div>
              )}
              {!plansLoading && membershipPlans.length === 0 && (
                <div className="md:col-span-3 border border-dashed border-white/10 bg-black/30 p-4 text-sm text-gray-300">
                  Membership packages are not available right now. You can still create a staff account, or retry member onboarding in a moment.
                </div>
              )}
              {membershipPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  role="radio"
                  aria-checked={selectedPlanId === plan.id}
                  className={`border p-4 text-left transition-colors ${
                    selectedPlanId === plan.id
                      ? 'border-[#E21A2C] bg-[linear-gradient(160deg,rgba(226,26,44,0.22),rgba(255,122,69,0.08))] shadow-[0_14px_32px_rgba(226,26,44,0.16)]'
                      : 'border-white/10 bg-white/5 hover:border-[#ff7a45]/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#ff7a45]">{plan.name}</p>
                    {selectedPlanId === plan.id ? (
                      <span className="border border-[#ff8b5f]/40 bg-[#ff8b5f]/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                        Selected
                      </span>
                    ) : plan.id === preferredDefaultPlanId ? (
                      <span className="border border-white/15 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-200">
                        Recommended
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xl font-black text-white">{formatAmount(plan.priceInr)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.08em] text-gray-300">
                    <span className="border border-white/10 bg-black/30 px-2 py-1">{plan.durationDays} days</span>
                    <span className="border border-white/10 bg-black/30 px-2 py-1">
                      {formatAmount(plan.priceInr / Math.max(plan.durationDays / 30, 1))}/month
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">{plan.perks}</p>
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Selected Package</p>
                <p className="mt-1 text-lg font-black text-white">{selectedPlan?.name || 'Choose a package'}</p>
                <p className="mt-2 text-sm text-gray-300">
                  {selectedPlan?.perks || 'Package details will appear here after the catalog loads.'}
                </p>
                {selectedPlan && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="border border-[#ff8b5f]/30 bg-[#ff8b5f]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#ffd3c4]">
                      Starts immediately after payment
                    </span>
                    <span className="border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-200">
                      Best for demo-ready onboarding
                    </span>
                  </div>
                )}
              </div>
              <div className="border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">What Happens Next</p>
                <div className="mt-3 space-y-2 text-sm text-gray-300">
                  <p>1. We create the account and sign you in.</p>
                  <p>2. We reserve the chosen membership window.</p>
                  <p>3. You complete payment with Razorpay or fallback UPI.</p>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.08em] text-[#ff7a45]">
                  If something fails after account creation, retry continues from that point instead of starting over.
                </p>
              </div>
            </div>
          </fieldset>
        )}

        {isMemberFlow && step === 3 && (
          <fieldset className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
            <legend className="sr-only">Submit payment details</legend>
            <article className="border border-white/10 bg-[linear-gradient(165deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff7a45]">Ready For Payment</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-[0.08em] text-white">
                Review your activation before paying
              </h2>
              <div className="mt-4 space-y-3">
                <div className="border border-white/10 bg-black/30 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Account</p>
                  <p className="mt-1 text-base font-bold text-white">{activation.account?.name}</p>
                  <p className="mt-1 text-sm text-gray-300">{activation.account?.email}</p>
                  <p className="mt-1 text-sm text-gray-300">{activation.account?.phone}</p>
                </div>
                <div className="border border-white/10 bg-black/30 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Membership</p>
                  <p className="mt-1 text-base font-bold text-white">{activation.subscription?.planName}</p>
                  <p className="mt-1 text-sm text-gray-300">
                    {formatDate(activation.subscription?.startDate)} to {formatDate(activation.subscription?.endDate)}
                  </p>
                  <p className="mt-1 text-sm text-gray-300">Status: {activation.subscription?.status || 'Pending setup'}</p>
                </div>
                <div className="border border-white/10 bg-black/30 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Billing</p>
                  <p className="mt-1 text-2xl font-black text-white">{formatAmount(paymentForm.amount)}</p>
                  <p className="mt-1 text-sm text-gray-300">
                    Plan duration: {selectedPlan?.durationDays ?? '-'} days
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.08em] text-[#ff7a45]">
                    Pay now with Razorpay or keep manual UPI as your backup option
                  </p>
                </div>
              </div>
              <div className="mt-4 border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Demo Checklist</p>
                <div className="mt-3 space-y-2 text-sm text-gray-300">
                  <p>Account has been created and saved.</p>
                  <p>Membership period is already reserved.</p>
                  <p>Payment method is the only remaining step.</p>
                </div>
              </div>
            </article>

            <article className="border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ff7a45]">Payment Step</p>
              <h2 className="mt-1 text-xl font-black uppercase tracking-[0.08em] text-white">
                Submit your payment details
              </h2>
              <p className="mt-2 text-sm text-gray-300">
                Razorpay is the primary checkout here. Manual UPI details stay available if you need a fallback during the demo.
              </p>

              <div className="mt-4 border border-[#E21A2C]/30 bg-[linear-gradient(160deg,rgba(226,26,44,0.18),rgba(255,122,69,0.08))] p-5 shadow-[0_14px_40px_rgba(226,26,44,0.14)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#ffb0b7]">Recommended</p>
                    <p className="mt-1 text-base font-black text-white">Pay with Razorpay Checkout</p>
                  </div>
                  <span className="border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-100">
                    Fastest path
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-200">
                  This opens the live Razorpay flow, verifies the payment, and keeps the membership/payment record linked automatically.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-300">Amount</p>
                    <p className="mt-1 text-lg font-black text-white">{formatAmount(paymentForm.amount)}</p>
                  </div>
                  <div className="border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-300">Plan</p>
                    <p className="mt-1 text-lg font-black text-white">{activation.subscription?.planName || '-'}</p>
                  </div>
                  <div className="border border-white/10 bg-black/20 px-3 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-300">Validity</p>
                    <p className="mt-1 text-lg font-black text-white">{formatDate(activation.subscription?.endDate)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRazorpayCheckout}
                  disabled={isSubmitting}
                  className="mt-5 w-full border border-[#E21A2C] bg-[#E21A2C] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#c31626] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Opening Razorpay...' : 'Pay With Razorpay'}
                </button>
              </div>

              <div className="mt-5 border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-300">Alternative Method</p>
                <p className="mt-1 text-sm text-gray-400">
                  Use this only if you need to record a manual transfer for the demo or if Razorpay checkout is unavailable.
                </p>
              </div>

              <div className="mt-4 space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-300">Amount</span>
                  <input
                    id={ids.paymentAmount}
                    type="number"
                    min="1"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(event) => {
                      setPaymentForm((current) => ({ ...current, amount: event.target.value }))
                      clearFieldError('payment')
                    }}
                    aria-invalid={Boolean(error.payment)}
                    aria-describedby={error.payment ? ids.paymentError : undefined}
                    className="mt-2 w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                    placeholder="Enter payment amount"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-300">UPI Handle</span>
                  <input
                    id={ids.paymentUpi}
                    type="text"
                    value={paymentForm.upiId}
                    onChange={(event) => {
                      setPaymentForm((current) => ({ ...current, upiId: event.target.value }))
                      clearFieldError('payment')
                    }}
                    aria-invalid={Boolean(error.payment)}
                    aria-describedby={error.payment ? ids.paymentError : undefined}
                    className="mt-2 w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                    placeholder="example@okaxis"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-gray-300">
                    Proof Reference
                  </span>
                  <input
                    id={ids.paymentProof}
                    type="text"
                    value={paymentForm.proofReference}
                    onChange={(event) => {
                      setPaymentForm((current) => ({ ...current, proofReference: event.target.value }))
                      clearFieldError('payment')
                    }}
                    aria-invalid={Boolean(error.payment)}
                    aria-describedby={error.payment ? ids.paymentError : undefined}
                    className="mt-2 w-full border border-white/15 bg-black/30 px-3 py-2 text-white outline-none focus:border-[#ff8b5f]"
                    placeholder="Optional image URL or attachment reference"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    Optional. Add a screenshot link or a staff-issued attachment reference if you have one.
                  </p>
                </label>

                {error.payment && (
                  <StatusBanner
                    id={ids.paymentError}
                    title="Payment needs attention"
                    message={error.payment}
                    actions={
                      <>
                        <button
                          type="button"
                          onClick={() => navigate('/payments')}
                          className="border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-gray-200 hover:border-[#ff8b5f]/70 hover:text-white"
                        >
                          Finish Later In Payments
                        </button>
                        <button
                          type="button"
                          onClick={() => setError((current) => ({ ...current, payment: '' }))}
                          className="border border-[#ff8b5f]/50 bg-[#ff8b5f]/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-white hover:bg-[#ff8b5f]/20"
                        >
                          Keep Editing
                        </button>
                      </>
                    }
                  />
                )}

                <div className="border border-white/10 bg-black/30 p-4 text-sm text-gray-300">
                  Manual submission still creates a payment record linked to your new membership so the gym team can verify it without asking you to restart onboarding.
                </div>
              </div>
            </article>
          </fieldset>
        )}

        {isMemberFlow && step === 4 && (
          <section className="space-y-5">
            <div className="border border-emerald-400/30 bg-[linear-gradient(160deg,rgba(16,185,129,0.18),rgba(34,197,94,0.08))] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-200">Onboarding Complete</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] text-white">
                Your gym account is ready
              </h2>
              <p className="mt-2 text-sm text-emerald-100">
                Your account, membership, and payment record were created in one flow. The only remaining step is admin verification of the payment.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <article className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Account Created</p>
                <p className="mt-1 text-base font-bold text-white">{activation.account?.name}</p>
                <p className="mt-1 text-sm text-gray-300">{activation.account?.email}</p>
                <p className="mt-1 text-sm text-gray-300">{activation.account?.phone}</p>
              </article>
              <article className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Membership Status</p>
                <p className="mt-1 text-base font-bold text-white">{activation.subscription?.planName}</p>
                <p className="mt-1 text-sm text-gray-300">
                  {formatDate(activation.subscription?.startDate)} to {formatDate(activation.subscription?.endDate)}
                </p>
                <p className="mt-1 text-sm text-gray-300">Status: {activation.subscription?.status}</p>
              </article>
              <article className="border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">Billing Summary</p>
                <p className="mt-1 text-2xl font-black text-white">
                  {formatAmount(activation.payment?.amount || paymentForm.amount)}
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Method: {activation.payment?.upiId === 'RAZORPAY_CHECKOUT' ? 'Razorpay Checkout' : activation.payment?.upiId || paymentForm.upiId}
                </p>
                {(activation.payment?.proofReference || paymentForm.proofReference) && (
                  <p className="mt-1 break-all text-sm text-gray-300">
                    Proof reference: {activation.payment?.proofReference || paymentForm.proofReference}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-300">Payment status: {activation.payment?.status || 'Pending'}</p>
              </article>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">What Was Created</p>
                <p className="mt-2 text-sm text-gray-300">Account: ready for member sign-in.</p>
                <p className="mt-1 text-sm text-gray-300">
                  Membership: {activation.subscription?.planName || selectedPlan?.name || 'Selected plan'} for{' '}
                  {activation.subscription?.plan?.durationDays || selectedPlan?.durationDays || '-'} days.
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Payment: linked to the membership with transaction tracking and checkout details.
                </p>
                <p className="mt-1 text-sm text-gray-300">
                  Lifecycle: the membership window now reflects the verified payment or stays queued for follow-up.
                </p>
              </article>
              <article className="border border-white/10 bg-black/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">What Happens Next</p>
                <p className="mt-2 text-sm text-gray-300">Open your dashboard to follow the membership status.</p>
                <p className="mt-1 text-sm text-gray-300">Track payment verification from the payments page.</p>
                <p className="mt-1 text-sm text-gray-300">
                  Once the admin approves payment, your membership activates and the live period begins.
                </p>
              </article>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate(activation.dashboardPath || '/member')}
                className="border border-[#E21A2C] bg-[#E21A2C] px-5 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#c31626]"
              >
                Open Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate('/payments')}
                className="border border-white/20 px-5 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white hover:border-white/40"
              >
                Track Payment
              </button>
            </div>
          </section>
        )}

        {step < 4 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {isMemberFlow && step === 2 && !activation.account && (
                <button
                  type="button"
                  onClick={() => {
                    clearFlowErrors()
                    setStep(1)
                  }}
                  className="border border-white/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white hover:border-white/40"
                >
                  Back
                </button>
              )}
              {isMemberFlow && step === 3 && (
                <button
                  type="button"
                  onClick={() => navigate('/payments')}
                  className="border border-white/20 px-4 py-2 text-sm font-bold uppercase tracking-[0.08em] text-white hover:border-white/40"
                >
                  Finish Later
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="border border-[#E21A2C] bg-[#E21A2C] px-5 py-2 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#c31626] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? step === 3
                  ? 'Processing payment...'
                  : activation.account
                    ? 'Finishing membership setup...'
                    : 'Creating account...'
                : !isMemberFlow
                  ? 'Create Account'
                  : step === 1
                    ? 'Continue To Package'
                    : step === 2
                    ? activation.account
                      ? 'Retry Membership Setup'
                      : 'Continue To Payment'
                      : 'Submit Manual Payment'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
