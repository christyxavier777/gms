import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = {}
    if (!email) errors.email = 'Email is required'
    if (!password) errors.password = 'Password is required'
    if (Object.keys(errors).length) {
      setError(errors)
      return
    }
    setError({})
    setIsSubmitting(true)
    const fakeUser = { email, role: 'member' }
    setUser(fakeUser)
    localStorage.setItem('user', JSON.stringify(fakeUser))
    setIsSubmitting(false)
    navigate(`/${fakeUser.role}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (error.email) setError((prev) => { const next = { ...prev }; delete next.email; return next })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
          />
          {error.email && <p className="text-red-600 mt-2">{error.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error.password) setError((prev) => { const next = { ...prev }; delete next.password; return next })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
          />
          {error.password && <p className="text-red-600 mt-2">{error.password}</p>}
        </div>

        <button
          type="submit"
          disabled={!email || !password || isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium"
        >
          {isSubmitting ? 'Submitting...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
