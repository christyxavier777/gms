import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import TrainerDashboard from './pages/TrainerDashboard'
import MemberDashboard from './pages/MemberDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer"
          element={
            <ProtectedRoute allowedRoles={["admin", "trainer"]}>
              <TrainerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member"
          element={
            <ProtectedRoute allowedRoles={["admin", "trainer", "member"]}>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
