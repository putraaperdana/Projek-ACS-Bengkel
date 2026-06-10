import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../assets/register.css'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    const res = await window.electron.ipcRenderer.invoke('auth:register', {
      username,
      password,
      fullName
    })
    if (res.ok) navigate('/login')
    else setError(res.error || 'Register failed')
  }

  return (
    <div className="register-shell">
      <div className="register-glow register-glow-left" />
      <div className="register-glow register-glow-right" />

      <section className="register-card">
        <div className="register-copy">
          <span className="register-badge">Bengkel ACS</span>
          <h2>Create account</h2>
          <p>
            Daftar sekali, akun akan otomatis tersimpan sebagai customer. Data yang dikirim masuk ke
            tabel <strong>pengguna</strong> lewat backend.
          </p>
          <ul>
            <li>Username unik</li>
            <li>Password aman</li>
            <li>Langsung bisa login setelah register</li>
          </ul>
        </div>

        <form className="register-form" onSubmit={submit}>
          <h1>Register</h1>
          <p className="register-subtitle">Isi data berikut untuk membuat akun customer.</p>

          <label>
            <span>Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama lengkap"
              autoComplete="name"
            />
          </label>

          <label>
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              autoComplete="new-password"
            />
          </label>

          <button type="submit">Create account</button>

          {error && <div className="register-error">{error}</div>}
        </form>
      </section>
    </div>
  )
}
