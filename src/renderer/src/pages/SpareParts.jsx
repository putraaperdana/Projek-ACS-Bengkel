import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'

export default function SpareParts() {
  const [kategoriList, setKategoriList] = useState([])
  const [selectedKategori, setSelectedKategori] = useState('')
  const [sukuList, setSukuList] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ nama: '', kategori: '', kuantitas_fisik: 0, batas_minimum: 0 })
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    const cats = await window.api.getCategories()
    setKategoriList(cats || [])
  }

  const loadSuku = async (kat) => {
    setLoading(true)
    try {
      const items = await window.api.getSukuByKategori(kat)
      setSukuList(items || [])
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    if (!form.nama || !form.kategori)
      return setToast({ open: true, message: 'Isi nama dan kategori', severity: 'warning' })
    setLoading(true)
    try {
      await window.api.addSukuCadang(form)
      setToast({ open: true, message: 'Suku cadang ditambahkan', severity: 'success' })
      setForm({ nama: '', kategori: form.kategori, kuantitas_fisik: 0, batas_minimum: 0 })
      loadCategories()
      if (form.kategori) loadSuku(form.kategori)
    } catch (err) {
      setToast({ open: true, message: err.message || String(err), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5">Manajemen Suku Cadang</Typography>

      <Box sx={{ my: 2, display: 'flex', gap: 1 }}>
        <TextField
          label="Nama"
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          sx={{ flex: 1 }}
        />
        <TextField
          label="Kategori"
          value={form.kategori}
          onChange={(e) => setForm({ ...form, kategori: e.target.value })}
          sx={{ width: 200 }}
          select
        >
          {kategoriList.map((k) => (
            <MenuItem key={k} value={k}>
              {k}
            </MenuItem>
          ))}
          <MenuItem value={form.kategori}>{form.kategori}</MenuItem>
        </TextField>
        <TextField
          label="Stok"
          type="number"
          value={form.kuantitas_fisik}
          onChange={(e) => setForm({ ...form, kuantitas_fisik: parseInt(e.target.value || 0, 10) })}
          sx={{ width: 120 }}
        />
        <TextField
          label="Batas Min"
          type="number"
          value={form.batas_minimum}
          onChange={(e) => setForm({ ...form, batas_minimum: parseInt(e.target.value || 0, 10) })}
          sx={{ width: 120 }}
        />
        <Button variant="contained" onClick={submit} disabled={loading}>
          {loading ? <CircularProgress size={18} /> : 'Tambah'}
        </Button>
      </Box>

      <Box sx={{ my: 2, display: 'flex', gap: 1 }}>
        <TextField
          select
          label="Filter Kategori"
          value={selectedKategori}
          onChange={(e) => {
            setSelectedKategori(e.target.value)
            loadSuku(e.target.value)
          }}
          sx={{ width: 300 }}
        >
          <MenuItem value="">-- Pilih Kategori --</MenuItem>
          {kategoriList.map((k) => (
            <MenuItem key={k} value={k}>
              {k}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nama</TableCell>
              <TableCell>Kategori</TableCell>
              <TableCell>Stok</TableCell>
              <TableCell>Batas Min</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sukuList.map((s) => (
              <TableRow key={s.id_suku_cadang}>
                <TableCell>{s.nama}</TableCell>
                <TableCell>{selectedKategori}</TableCell>
                <TableCell>{s.kuantitas_fisik}</TableCell>
                <TableCell>{s.batas_minimum}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
