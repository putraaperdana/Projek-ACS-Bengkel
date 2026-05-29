import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })

  const login = async (username, password) => {
    const res = await window.electron.ipcRenderer.invoke('auth:login', { username, password })
    if (res.ok) {
      setUser(res.user)
      localStorage.setItem('user', JSON.stringify(res.user))
      return { ok: true }
    }
    return { ok: false, error: res.error }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

export default AuthProvider
