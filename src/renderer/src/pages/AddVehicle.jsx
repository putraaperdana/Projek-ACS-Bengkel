import React, { useState } from 'react'
import { Container, Typography, Box, TextField, Button, Snackbar, Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom'

export default function AddVehicle() {
  const [form, setForm] = useState({ nomor_polisi: '', tahun: '', odometer: 0, status: 'Aktif' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' })
  const navigate = useNavigate()

  const submit = async () => {
    if (!form.nomor_polisi)
      return setToast({ open: true, message: 'Nomor polisi harus diisi', severity: 'warning' })
    setLoading(true)
    try {
      await window.api.addKendaraan(form)
      setToast({ open: true, message: 'Kendaraan ditambahkan', severity: 'success' })
      setTimeout(() => navigate('/'), 700)
    } catch (err) {
      setToast({ open: true, message: err.message || String(err), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5">Tambah Kendaraan</Typography>
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
        <TextField
          label="Nomor Polisi"
          value={form.nomor_polisi}
          onChange={(e) => setForm({ ...form, nomor_polisi: e.target.value })}
        />
        <TextField
          label="Tahun"
          type="number"
          value={form.tahun}
          onChange={(e) => setForm({ ...form, tahun: e.target.value })}
        />
        <TextField
          label="Odometer"
          type="number"
          value={form.odometer}
          onChange={(e) => setForm({ ...form, odometer: parseInt(e.target.value || 0, 10) })}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={submit} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
          <Button onClick={() => navigate(-1)}>Batal</Button>
        </Box>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Container>
  )
}
