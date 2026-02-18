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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-md w-full space-y-4">
        <h1 className="text-2xl font-semibold">Register</h1>

        <div className="space-y-1">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error.name) setError((prev) => { const next = { ...prev }; delete next.name; return next })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none text-base"
          />
          {error.name && <p className="text-red-600 mt-2">{error.name}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error.email) setError((prev) => { const next = { ...prev }; delete next.email; return next })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none text-base"
          />
          {error.email && <p className="text-red-600 mt-2">{error.email}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error.password) setError((prev) => { const next = { ...prev }; delete next.password; return next })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none text-base"
          />
          {error.password && <p className="text-red-600 mt-2">{error.password}</p>}
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
              if (error.role) setError((prev) => { const next = { ...prev }; delete next.role; return next })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none text-base"
          >
            <option value="member">Member</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </select>
          {error.role && <p className="text-red-600 mt-2">{error.role}</p>}
        </div>

        <button
          type="submit"
          disabled={!name || !email || !password || !role || isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium text-base"
        >
          {isSubmitting ? 'Submitting...' : 'Register'}
        </button>
      </form>
    </div>
  )
}
