import React, { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { Box, Button } from '@mui/material'
import Login from './pages/Login'
import Vehicles from './pages/Vehicles'
import RepairForm from './pages/RepairForm'
import Reports from './pages/Reports'
import SpareParts from './pages/SpareParts'
import AddVehicle from './pages/AddVehicle'
import MekanikDashboard from './pages/MekanikDashboard'
import KepalaDashboard from './pages/KepalaDashboard'

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user))
    else localStorage.removeItem('user')
  }, [user])

  if (!user) {
    return <Login onLogin={setUser} />
  }

  const logout = () => setUser(null)

  return (
    <HashRouter>
      <Box className="no-print" sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
        <Button component={Link} to="/">
          Kendaraan
        </Button>
        <Button component={Link} to="/dashboard" sx={{ ml: 1 }}>
          Dashboard
        </Button>

        {user?.role === 'Kepala_Mekanik' ? (
          <>
            <Button component={Link} to="/reports" sx={{ ml: 1 }}>
              Laporan
            </Button>
            <Button component={Link} to="/spareparts" sx={{ ml: 1 }}>
              Suku Cadang
            </Button>
            <Button variant="contained" component={Link} to="/vehicles/add" sx={{ ml: 1 }}>
              Tambah Kendaraan
            </Button>
          </>
        ) : null}

        <Button sx={{ float: 'right' }} onClick={logout}>
          Logout
        </Button>
      </Box>
      <Routes>
        <Route
          path="/dashboard"
          element={
            user?.role === 'Kepala_Mekanik' ? (
              <KepalaDashboard user={user} />
            ) : (
              <MekanikDashboard user={user} />
            )
          }
        />
        <Route path="/" element={<Vehicles user={user} />} />
        {user?.role !== 'Kepala_Mekanik' && (
          <>
            <Route path="/repairs" element={<RepairForm user={user} />} />
            <Route path="/repairs/:nomor_polisi" element={<RepairForm user={user} />} />
          </>
        )}
        {user?.role === 'Kepala_Mekanik' && (
          <>
            <Route path="/reports" element={<Reports user={user} />} />
            <Route path="/spareparts" element={<SpareParts />} />
            <Route path="/vehicles/add" element={<AddVehicle />} />
          </>
        )}
      </Routes>
    </HashRouter>
  )
}
