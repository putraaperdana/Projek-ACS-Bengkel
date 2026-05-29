import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [roles, setRoles] = useState([])
  const [role, setRole] = useState('customer')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    window.electron.ipcRenderer.invoke('roles:list').then(r=>setRoles(r || []))
  },[])

  const submit = async (e) => {
    e.preventDefault()
    const res = await window.electron.ipcRenderer.invoke('auth:register', { username, password, role, fullName })
    if (res.ok) navigate('/login')
    else setError(res.error || 'Register failed')
  }

  return (
    <div style={{padding:20}}>
      <h2>Register</h2>
      <form onSubmit={submit}>
        <div><label>Full name</label><input value={fullName} onChange={e=>setFullName(e.target.value)} /></div>
        <div><label>Username</label><input value={username} onChange={e=>setUsername(e.target.value)} /></div>
        <div><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <div>
          <label>Role</label>
          <select value={role} onChange={e=>setRole(e.target.value)}>
            {roles.map(r=> <option key={r.id} value={r.name}>{r.name}</option>)}
          </select>
        </div>
        <button type="submit">Register</button>
        {error && <div style={{color:'red'}}>{error}</div>}
      </form>
    </div>
  )
}
