import React from 'react'
import { Container, Typography, Button, Box } from '@mui/material'
import { Link } from 'react-router-dom'

export default function KepalaDashboard({ user }) {
  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5">Dashboard Kepala Montir</Typography>
      <Typography sx={{ mt: 1 }}>
        Selamat datang, {user?.nama || user?.username}. (Role: {user?.role})
      </Typography>
      <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
        <Button component={Link} to="/reports" variant="contained">
          Lihat Laporan
        </Button>
        <Button component={Link} to="/" variant="outlined">
          Kelola Kendaraan
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography>
          Fitur untuk kepala: akses laporan, manajemen inventaris, CRUD master data.
        </Typography>
      </Box>
    </Container>
  )
}
