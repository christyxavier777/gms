import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('All fields are required')
      return
    }
    setError('')
    setIsSubmitting(true)
    const fakeUser = { email, role: 'member' }
    setUser(fakeUser)
    localStorage.setItem("user", JSON.stringify(fakeUser))
    setIsSubmitting(false)
    navigate(`/${fakeUser.role}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
          />
        </div>
        
        <button
          type="submit"
          disabled={!email || !password || isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium"
        >
          {isSubmitting ? 'Submitting...' : 'Login'}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  )
}
