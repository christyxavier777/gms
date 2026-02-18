import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('member')
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    const fakeUser = { name, email, role }
    setUser(fakeUser)
    localStorage.setItem("user", JSON.stringify(fakeUser))
    navigate(`/${role}`)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
          >
            <option value="member">Member</option>
            <option value="trainer">Trainer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium">
          Register
        </button>
      </form>
    </div>
  )
}
