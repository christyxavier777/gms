import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = {}
    if (!name) errors.name = 'Name is required'
    if (!email) errors.email = 'Email is required'
    if (!password) errors.password = 'Password is required'
    if (!role) errors.role = 'Role is required'
    if (Object.keys(errors).length) {
      setError(errors)
      return
    }
    setError({})
    setIsSubmitting(true)
    const fakeUser = { name, email, role }
    setUser(fakeUser)
    localStorage.setItem('user', JSON.stringify(fakeUser))
    setIsSubmitting(false)
    navigate(`/${role}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1A1A1A] px-4 py-8 text-white">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5 border border-[#E21A2C]/50 bg-[#111111] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <h1 className="text-2xl font-black uppercase tracking-[0.12em]">Register</h1>

        <div className="space-y-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error.name) setError((prev) => { const next = { ...prev }; delete next.name; return next })
            }}
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
          />
          {error.name && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error.email) setError((prev) => { const next = { ...prev }; delete next.email; return next })
            }}
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
          />
          {error.email && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.email}</p>}
        </div>

        <div className="space-y-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error.password) setError((prev) => { const next = { ...prev }; delete next.password; return next })
            }}
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
          />
          {error.password && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.password}</p>}
        </div>

        <div className="space-y-1">
          <label className="mb-1 block text-xs font-bold uppercase tracking-[0.1em] text-gray-300">Role</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              if (error.role) setError((prev) => { const next = { ...prev }; delete next.role; return next })
            }}
            className="w-full border border-[#333333] bg-[#1A1A1A] px-3 py-2 text-base text-white outline-none transition-colors focus:border-[#E21A2C]"
          >
            <option value="member">Member</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </select>
          {error.role && <p className="mt-2 text-sm font-semibold text-[#E21A2C]">{error.role}</p>}
        </div>

        <button
          type="submit"
          disabled={!name || !email || !password || !role || isSubmitting}
          className="w-full border border-[#E21A2C] bg-[#E21A2C] py-2 text-base font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#b91524] disabled:cursor-not-allowed disabled:border-[#4d4d4d] disabled:bg-[#2a2a2a] disabled:text-gray-500"
        >
          {isSubmitting ? 'Submitting...' : 'Register'}
        </button>
      </form>
    </div>
  )
}
