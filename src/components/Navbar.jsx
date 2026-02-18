import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h2 className="text-white text-xl font-bold">Gym Management</h2>
        <ul className="flex space-x-4">
          <li><Link to="/" className="text-white hover:text-gray-200">Home</Link></li>
          <li><Link to="/login" className="text-white hover:text-gray-200">Login</Link></li>
          <li><Link to="/register" className="text-white hover:text-gray-200">Register</Link></li>
        </ul>
      </div>
    </nav>
  );
}
