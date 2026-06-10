import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Dashboard() {
  const { user, logout } = useAuth()
  return (
    <div className="page-shell">
      <section className="dashboard-card">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <button className="button-secondary" onClick={logout}>
            Logout
          </button>
        </div>
        <div className="dashboard-welcome">
          Welcome, {user ? user.full_name || user.username : 'Guest'}
        </div>
        <nav className="dashboard-nav">
          <Link to="/customers">Customers</Link>
          <Link to="/parts">Parts</Link>
          <Link to="/mechanics">Mechanics</Link>
          <Link to="/workorders">Work Orders</Link>
        </nav>
      </section>
    </div>
  )
}
