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
import Swal from 'sweetalert2'
import { useParams } from 'react-router-dom'

export default function RepairForm({ user }) {
  const params = useParams()
  const preSelectedPol = params.nomor_polisi ? decodeURIComponent(params.nomor_polisi) : null
  const formReady = Boolean(preSelectedPol)
  const [kategoriList, setKategoriList] = useState([])
  const [selectedKategori, setSelectedKategori] = useState('')
  const [sukuList, setSukuList] = useState([])
  const [rows, setRows] = useState([])
  const [odometerBaru, setOdometerBaru] = useState('')
  const [assignedTask, setAssignedTask] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' })

  useEffect(() => {
    loadCategories()
  }, [])
  useEffect(() => {
    if (selectedKategori) loadSuku(selectedKategori)
  }, [selectedKategori])

  useEffect(() => {
    if (formReady && user?.role !== 'Kepala_Mekanik') {
      loadAssignedTask()
    }
  }, [formReady, user])

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

  const loadAssignedTask = async () => {
    try {
      const task = await window.api.getAssignedRepairByVehicle({ nomor_polisi: preSelectedPol, id_user: user?.id_user })
      setAssignedTask(task)
    } catch (err) {
      console.error('Failed to load assigned repair task', err)
      setAssignedTask(null)
    }
  }

  const addRow = () => {
    if (!formReady) return
    setRows([...rows, { id_suku_cadang: '', kuantitas_dipakai: 1 }])
  }

  const updateRow = (idx, field, value) => {
    const copy = [...rows]
    copy[idx][field] = value
    setRows(copy)
  }

  const removeRow = async (idx) => {
    const result = await Swal.fire({
      title: 'Hapus item?',
      text: 'Anda akan menghapus komponen ini dari transaksi.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus'
    })
    if (result.isConfirmed) {
      const copy = rows.filter((_, i) => i !== idx)
      setRows(copy)
    }
  }

  const submit = async () => {
    if (!preSelectedPol)
      return setToast({ open: true, message: 'Pilih kendaraan terlebih dahulu', severity: 'error' })

    if (user?.role !== 'Kepala_Mekanik' && !assignedTask) {
      return setToast({ open: true, message: 'Anda belum ditugaskan pada kendaraan ini.', severity: 'error' })
    }

    setLoading(true)
    try {
      const id_log = assignedTask?.id_log
      if (!id_log) {
        throw new Error('Tugas perbaikan tidak ditemukan untuk kendaraan ini')
      }

      const payload = {
        id_log,
        odometer_baru: parseInt(odometerBaru, 10),
        components: rows
      }
      await window.api.completeRepair(payload)
      setToast({ open: true, message: 'Perbaikan selesai dan disimpan', severity: 'success' })
    } catch (err) {
      setToast({ open: true, message: err.message || String(err), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5">
        Form Penyelesaian Perbaikan {preSelectedPol ? `(${preSelectedPol})` : ''}
      </Typography>
      {!formReady && (
        <Alert severity="info" sx={{ my: 2 }}>
          Silakan pilih kendaraan dari halaman Kendaraan lalu klik tombol Perbaiki untuk membuka form yang benar.
        </Alert>
      )}
      <Box sx={{ my: 2 }}>
        <TextField
          label="Odometer Baru"
          value={odometerBaru}
          onChange={(e) => setOdometerBaru(e.target.value)}
          type="number"
          disabled={!formReady}
        />
      </Box>

      <Box sx={{ my: 2 }}>
        <TextField
          select
          label="Kategori"
          value={selectedKategori}
          onChange={(e) => setSelectedKategori(e.target.value)}
          sx={{ mr: 2 }}
          disabled={!formReady}
        >
          {kategoriList.map((k) => (
            <MenuItem key={k} value={k}>
              {k}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="outlined" onClick={addRow} disabled={!formReady || (user?.role !== 'Kepala_Mekanik' && !assignedTask)}>
          Tambah Komponen
        </Button>
      </Box>

      <Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Komponen</TableCell>
              <TableCell>Kuantitas</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>
                  <TextField
                    select
                    value={r.id_suku_cadang}
                    onChange={(e) => updateRow(i, 'id_suku_cadang', e.target.value)}
                  >
                    {sukuList.map((s) => (
                      <MenuItem key={s.id_suku_cadang} value={s.id_suku_cadang}>
                        {s.nama} (stok: {s.kuantitas_fisik})
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    value={r.kuantitas_dipakai}
                    onChange={(e) =>
                      updateRow(i, 'kuantitas_dipakai', parseInt(e.target.value || 0, 10))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button color="error" onClick={() => removeRow(i)}>
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      {user?.role !== 'Kepala_Mekanik' && !assignedTask && formReady ? (
        <Alert severity="warning" sx={{ my: 2 }}>
          Anda belum ditugaskan untuk kendaraan ini, sehingga tidak dapat menyelesaikan perbaikan.
        </Alert>
      ) : null}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={submit}
          disabled={!formReady || loading || (user?.role !== 'Kepala_Mekanik' && !assignedTask)}
        >
          {loading ? <CircularProgress size={20} /> : 'Simpan Penyelesaian'}
        </Button>
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
