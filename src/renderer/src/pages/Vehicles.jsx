import React, { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Button,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material'
import { useNavigate, Link } from 'react-router-dom'
import Swal from 'sweetalert2'

export default function Vehicles({ user }) {
  const [vehicles, setVehicles] = useState([])
  const [mechanics, setMechanics] = useState([])
  const [assignedVehicleIds, setAssignedVehicleIds] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    load()
    if (user?.role === 'Kepala_Mekanik') loadMechanics()
  }, [])

  const loadMechanics = async () => {
    try {
      const data = await window.api.getMechanics()
      setMechanics(data || [])
    } catch (err) {
      console.error('Failed to load mechanics', err)
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const data = await window.api.getKendaraan()
      setVehicles(data)
      if (user?.role !== 'Kepala_Mekanik' && data.length > 0 && data[0].assigned_mechanic_id === undefined) {
        await loadAssignedMap(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedMap = async (vehiclesData) => {
    const assigned = {}
    for (const v of vehiclesData) {
      try {
        const task = await window.api.getAssignedRepairByVehicle({ nomor_polisi: v.nomor_polisi, id_user: user?.id_user })
        if (task) {
          assigned[v.nomor_polisi] = task.id_log
        }
      } catch (err) {
        // ignore items without assignment
      }
    }
    setAssignedVehicleIds(assigned)
  }

  const handleDelete = async (nomor_polisi) => {
    const result = await Swal.fire({
      title: 'Hapus kendaraan?',
      text: `Kendaraan ${nomor_polisi} akan dihapus. Ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus'
    })
    if (!result.isConfirmed) return
    try {
      await window.api.deleteKendaraan(nomor_polisi)
      await load()
      Swal.fire('Terhapus', 'Kendaraan berhasil dihapus', 'success')
    } catch (err) {
      Swal.fire('Gagal', err.message || String(err), 'error')
    }
  }

  const handleAssign = async (nomor_polisi) => {
    if (!mechanics.length) {
      await loadMechanics()
    }

    const options = mechanics.reduce((acc, item) => {
      const mechanicId = item.id_user ?? item.id_mekanik
      if (mechanicId !== undefined && mechanicId !== null) {
        acc[mechanicId] = `${item.nama} (${item.username})`
      }
      return acc
    }, {})

    const result = await Swal.fire({
      title: 'Pilih mekanik',
      input: 'select',
      inputOptions: options,
      inputPlaceholder: 'Pilih mekanik',
      showCancelButton: true,
      confirmButtonText: 'Tugaskan'
    })

    if (!result.isConfirmed || !result.value) return

    try {
      await window.api.assignRepair({
        nomor_polisi,
        id_mekanik: parseInt(result.value, 10),
        id_assigned_by: user.id_user
      })
      await load()
      Swal.fire('Berhasil', 'Mekanik berhasil ditugaskan.', 'success')
    } catch (err) {
      Swal.fire('Gagal', err.message || String(err), 'error')
    }
  }

  const handleToggleStatus = async (nomor_polisi, currentStatus) => {
    const targetStatus = currentStatus === 'Aktif' ? 'Diperbaiki' : 'Aktif'
    const result = await Swal.fire({
      title: `Ubah status menjadi ${targetStatus}?`,
      text: `Kendaraan ${nomor_polisi} akan diubah statusnya menjadi ${targetStatus}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, ubah'
    })
    if (!result.isConfirmed) return
    try {
      await window.api.updateKendaraanStatus({ nomor_polisi, status: targetStatus })
      await load()
      Swal.fire('Berhasil', `Status kendaraan diubah menjadi ${targetStatus}`, 'success')
    } catch (err) {
      Swal.fire('Gagal', err.message || String(err), 'error')
    }
  }

  return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Daftar Kendaraan Operasional</Typography>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nomor Polisi</TableCell>
              <TableCell>Tahun</TableCell>
              <TableCell>Odometer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Mekanik</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map((v) => {
              const assignedToMe = v.assigned_mechanic_id === user?.id_user || Boolean(assignedVehicleIds[v.nomor_polisi])
              return (
                <TableRow key={v.nomor_polisi} sx={v.status === 'Diperbaiki' ? { backgroundColor: '#fff5cc' } : {}}>
                  <TableCell>{v.nomor_polisi}</TableCell>
                  <TableCell>{v.tahun}</TableCell>
                  <TableCell>{v.odometer}</TableCell>
                  <TableCell>{v.status}</TableCell>
                  <TableCell>{v.assigned_mechanic || '-'}</TableCell>
                  <TableCell sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {user?.role !== 'Kepala_Mekanik' ? (
                      <Button
                        size="small"
                        onClick={() => navigate(`/repairs/${encodeURIComponent(v.nomor_polisi)}`)}
                        disabled={!assignedToMe}
                      >
                        Perbaiki
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleToggleStatus(v.nomor_polisi, v.status)}
                        >
                          {v.status === 'Aktif' ? 'Set Diperbaiki' : 'Set Aktif'}
                        </Button>
                        <Button size="small" onClick={() => handleAssign(v.nomor_polisi)}>
                          {v.assigned_mechanic ? 'Tugaskan Ulang' : 'Tugaskan'}
                        </Button>
                        <Button color="error" size="small" onClick={() => handleDelete(v.nomor_polisi)}>
                          Hapus
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </Container>
  )
}
