import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Dashboard(){
  const { user, logout } = useAuth()
  return (
    <div style={{padding:20}}>
      <h2>Dashboard</h2>
      <div>Welcome, {user ? user.full_name || user.username : 'Guest'}</div>
      <nav style={{marginTop:10}}>
        <Link to="/customers">Customers</Link> | <Link to="/parts">Parts</Link> | <Link to="/mechanics">Mechanics</Link> | <Link to="/workorders">Work Orders</Link>
      </nav>
      <div style={{marginTop:10}}>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  )
}
