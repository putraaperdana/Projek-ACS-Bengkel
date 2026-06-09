import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth'
import '../assets/register.css'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    const res = await login(username, password)
    if (res.ok) navigate('/dashboard')
    else setError(res.error || 'Login failed')
  }

  return (
    <div className="register-shell">
      <div className="register-glow register-glow-left" />
      <div className="register-glow register-glow-right" />
      <section className="register-card">
        <div className="register-copy">
          <span className="register-badge">Bengkel ACS</span>
          <h2>Login</h2>
          <p>Masuk ke akun Anda untuk akses dashboard bengkel dan daftar pelanggan.</p>
        </div>
        <form className="register-form" onSubmit={submit}>
          <h1>Login</h1>
          <p className="register-subtitle">Gunakan username dan password yang valid.</p>

          <label>
            <span>Username</span>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="password"
              autoComplete="current-password"
            />
          </label>

          <button type="submit">Masuk</button>
          {error && <div className="register-error">{error}</div>}
          <p className="register-subtitle">Belum punya akun? <Link className="link-muted" to="/register">Register</Link></p>
        </form>
      </section>
    </div>
  )
}
