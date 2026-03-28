import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AccessDenied from './pages/AccessDenied'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import TrainerDashboard from './pages/TrainerDashboard'
import MemberDashboard from './pages/MemberDashboard'
import Schedule from './pages/Schedule'
import Sessions from './pages/Sessions'
import Plans from './pages/Plans'
import Subscriptions from './pages/Subscriptions'
import Payments from './pages/Payments'
import Progress from './pages/Progress'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'
import Navbar from './components/Navbar'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer"
          element={
            <ProtectedRoute allowedRoles={["TRAINER"]}>
              <TrainerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/member"
          element={
            <ProtectedRoute allowedRoles={["MEMBER"]}>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TRAINER", "MEMBER"]}>
              <Schedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TRAINER", "MEMBER"]}>
              <Sessions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TRAINER", "MEMBER"]}>
              <Plans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TRAINER", "MEMBER"]}>
              <Subscriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MEMBER"]}>
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "TRAINER", "MEMBER"]}>
              <Progress />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
