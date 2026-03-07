import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('MEMBER')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = {}
    if (!name.trim()) errors.name = 'Name is required'
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim())) errors.email = 'Use a valid @gmail.com email'
    if (!/^\d{10}$/.test(phone.trim())) errors.phone = 'Phone must be exactly 10 digits'
    if (!password) errors.password = 'Password is required'
    if (!role) errors.role = 'Role is required'
    if (role !== 'MEMBER' && !inviteCode) errors.inviteCode = 'Invite code is required'
    if (Object.keys(errors).length) {
      setError(errors)
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
      navigate(dashboardPath)
    } catch (err) {
      setError({
        form: err?.message || 'Registration failed. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1A1A1A] px-4 py-8 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 border border-[#E21A2C]/50 bg-[#111111] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <h1 className="text-2xl font-black uppercase tracking-[0.12em]">Register</h1>
        {error.form && <p className="text-sm font-semibold text-[#E21A2C]">{error.form}</p>}

        <div className="space-y-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
          />
          {error.name && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
          />
          {error.email && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.email}</p>}
        </div>

        <div className="space-y-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Phone (10 digits)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
          />
          {error.phone && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.phone}</p>}
        </div>

        <div className="space-y-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
          />
          {error.password && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.password}</p>}
        </div>

        <div className="space-y-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
          >
            <option value="MEMBER">Member</option>
            <option value="TRAINER">Trainer</option>
            <option value="ADMIN">Admin</option>
          </select>
          {error.role && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.role}</p>}
        </div>

        {role !== 'MEMBER' && (
          <div className="space-y-1">
            <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">
              Invite Code ({role})
            </label>
            <input
              type="password"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
            />
            {error.inviteCode && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.inviteCode}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={!name || !email || !phone || !password || !role || (role !== 'MEMBER' && !inviteCode) || isSubmitting}
          className="w-full border border-[#E21A2C] bg-[#E21A2C] py-2 text-base font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#b91524] disabled:cursor-not-allowed disabled:border-[#4d4d4d] disabled:bg-[#2a2a2a] disabled:text-gray-500"
        >
          {isSubmitting ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </div>
  )
}
