import { useId, useMemo, useState } from 'react'
import StatusBanner from '../components/StatusBanner'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canRoleAccessPath } from '../navigation/workspaceNavigation'
import { isValidEmail } from '../utils/authValidation'

function formatRetryDelay(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 'a few moments'
  }

  if (seconds < 60) {
    return `${Math.max(1, Math.ceil(seconds))} seconds`
  }

  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`
  }

  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

function getLoginErrorState(err) {
  if (err?.code === 'AUTH_LOGIN_THROTTLED') {
    const retryAfterSeconds = err?.details?.retryAfterSeconds ?? err?.retryAfter

    return {
      formTitle: 'Too many sign-in attempts',
      form: `Sign-in is temporarily paused for this device. Try again in ${formatRetryDelay(retryAfterSeconds)}.`,
    }
  }

  if (err?.code === 'AUTH_THROTTLED') {
    const retryAfterSeconds = err?.details?.retryAfterSeconds ?? err?.retryAfter

    return {
      formTitle: 'Too many auth requests',
      form: `Authentication actions are temporarily paused for this connection. Try again in ${formatRetryDelay(retryAfterSeconds)}.`,
    }
  }

  if (err?.code === 'INVALID_CREDENTIALS') {
    const remainingAttempts = Number(err?.details?.remainingAttempts)

    if (Number.isFinite(remainingAttempts)) {
      if (remainingAttempts > 0) {
        return {
          formTitle: 'Check your credentials',
          form: `The email address or password did not match our records. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt remains' : 'attempts remain'} before sign-in is temporarily paused.`,
        }
      }

      return {
        formTitle: 'Check your credentials',
        form: 'The email address or password did not match our records. The next sign-in attempt from this device will trigger a temporary pause.',
      }
    }

    return {
      formTitle: 'Check your credentials',
      form: 'The email address or password did not match our records.',
    }
  }

  if (err?.code === 'ACCOUNT_INACTIVE') {
    return {
      formTitle: 'Account inactive',
      form: 'This account is inactive. Ask an admin to reactivate it before signing in.',
    }
  }

  if (err?.code === 'VALIDATION_ERROR') {
    return {
      formTitle: 'Fix the form',
      form: 'Enter a valid email address and password, then try again.',
    }
  }

  return {
    formTitle: 'Login issue',
    form: err?.message || 'Login failed. Please try again.',
  }
}

export default function Login() {
  const baseId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.redirectTo
  const accessReason = location.state?.accessReason
  const ids = {
    formMessage: `${baseId}-form-message`,
    email: `${baseId}-email`,
    emailHint: `${baseId}-email-hint`,
    emailError: `${baseId}-email-error`,
    password: `${baseId}-password`,
    passwordHint: `${baseId}-password-hint`,
    passwordError: `${baseId}-password-error`,
  }

  const helperMessage = useMemo(() => {
    if (accessReason === 'auth' && redirectTo) {
      return `Sign in to continue to ${redirectTo}.`
    }
    return 'Sign in with the email address and password you used during onboarding.'
  }, [accessReason, redirectTo])

  const clearFieldError = (fieldName) => {
    setError((current) => {
      if (!current[fieldName]) return current
      const next = { ...current }
      delete next[fieldName]
      return next
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = {}

    if (!email.trim()) errors.email = 'Email is required'
    else if (!isValidEmail(email)) errors.email = 'Use a valid email address'

    if (!password) errors.password = 'Password is required'

    if (Object.keys(errors).length > 0) {
      setError(errors)
      return
    }

    setError({})
    setIsSubmitting(true)

    try {
      const { dashboardPath, user } = await login({ email: email.trim().toLowerCase(), password })
      const nextPath =
        redirectTo && canRoleAccessPath(user.role, redirectTo) ? redirectTo : dashboardPath
      navigate(nextPath, { replace: true })
    } catch (err) {
      setError(getLoginErrorState(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1A1A1A] px-4 py-8 text-white">
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-describedby={error.form ? ids.formMessage : undefined}
        className="w-full max-w-md space-y-5 border border-[#E21A2C]/50 bg-[#111111] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      >
        <div>
          <h1 className="text-2xl font-black uppercase tracking-[0.12em]">Login</h1>
          <p className="mt-2 text-sm text-gray-400">{helperMessage}</p>
        </div>

        {error.form && <StatusBanner id={ids.formMessage} title={error.formTitle} message={error.form} />}

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
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
            placeholder="you@example.com"
          />
          {!error.email && (
            <p id={ids.emailHint} className="mt-2 text-xs text-gray-500">
              Use the account email, not your UPI ID.
            </p>
          )}
          {error.email && (
            <p id={ids.emailError} role="alert" className="mt-2 text-sm font-semibold text-[#E21A2C]">
              {error.email}
            </p>
          )}
        </div>

        <div className="space-y-1">
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
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
            placeholder="Enter your password"
          />
          {!error.password && (
            <p id={ids.passwordHint} className="mt-2 text-xs text-gray-500">
              Password is case-sensitive and must match your registered account.
            </p>
          )}
          {error.password && (
            <p id={ids.passwordError} role="alert" className="mt-2 text-sm font-semibold text-[#E21A2C]">
              {error.password}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!email || !password || isSubmitting}
          className="w-full border border-[#E21A2C] bg-[#E21A2C] py-2 text-base font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#b91524] disabled:cursor-not-allowed disabled:border-[#4d4d4d] disabled:bg-[#2a2a2a] disabled:text-gray-500"
        >
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
