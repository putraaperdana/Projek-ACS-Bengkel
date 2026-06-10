import React from 'react'
import { Container, Typography, Box } from '@mui/material'

export default function MekanikDashboard({ user }) {
  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5">Dashboard Mekanik</Typography>
      <Typography sx={{ mt: 1 }}>
        Halo, {user?.nama || user?.username}. (Role: {user?.role})
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography>
          Untuk memulai perbaikan, buka daftar kendaraan dan pilih kendaraan yang perlu diperbaiki.
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography>Fitur untuk mekanik: lihat tugas, update status tugas sendiri.</Typography>
      </Box>
    </Container>
  )
}
