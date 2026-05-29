import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from './auth'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Parts from './pages/Parts'
import Mechanics from './pages/Mechanics'
import WorkOrders from './pages/WorkOrders'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
      <Route path="/parts" element={<PrivateRoute><Parts /></PrivateRoute>} />
      <Route path="/mechanics" element={<PrivateRoute><Mechanics /></PrivateRoute>} />
      <Route path="/workorders" element={<PrivateRoute><WorkOrders /></PrivateRoute>} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}