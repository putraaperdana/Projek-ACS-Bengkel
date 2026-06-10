import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

export default function MekanikDashboard({ user }) {
  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5">Dashboard Mekanik</Typography>
      <Typography sx={{ mt: 1 }}>Halo, {user?.nama || user?.username}. (Role: {user?.role})</Typography>
      <Box sx={{ mt: 2 }}>
        <Button component={Link} to="/repairs" variant="contained">Buka Form Perbaikan</Button>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography>Fitur untuk mekanik: lihat tugas, update status tugas sendiri.</Typography>
      </Box>
    </Container>
  );
}
