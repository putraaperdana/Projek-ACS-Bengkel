import React, { useState, useEffect } from 'react';
import { Container, Box, Button, Typography, CircularProgress, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function Vehicles({ user }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const data = await window.api.getKendaraan();
      setVehicles(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (nomor_polisi) => {
    const result = await Swal.fire({
      title: 'Hapus kendaraan?',
      text: `Kendaraan ${nomor_polisi} akan dihapus. Ini tidak dapat dibatalkan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus'
    });
    if (!result.isConfirmed) return;
    try {
      await window.api.deleteKendaraan(nomor_polisi);
      await load();
      Swal.fire('Terhapus','Kendaraan berhasil dihapus','success');
    } catch (err) {
      Swal.fire('Gagal', err.message || String(err), 'error');
    }
  };

  return (
    <Container sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Daftar Kendaraan Operasional</Typography>
        {user?.role !== 'Kepala_Montir' && (
          <Button variant="contained" component={Link} to="/repairs">Buat Perbaikan</Button>
        )}
      </Box>

      {loading ? <CircularProgress /> : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nomor Polisi</TableCell>
              <TableCell>Tahun</TableCell>
              <TableCell>Odometer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.map(v => (
              <TableRow key={v.nomor_polisi} sx={v.delta > 10000 ? { backgroundColor: '#fff5cc' } : {}}>
                <TableCell>{v.nomor_polisi}</TableCell>
                <TableCell>{v.tahun}</TableCell>
                <TableCell>{v.odometer}</TableCell>
                <TableCell>{v.status}</TableCell>
                <TableCell>
                  {user?.role !== 'Kepala_Montir' ? (
                    <Button size="small" onClick={() => navigate(`/repairs/${encodeURIComponent(v.nomor_polisi)}`)}>Perbaiki</Button>
                  ) : (
                    <Button color="error" size="small" onClick={() => handleDelete(v.nomor_polisi)}>Hapus</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Container>
  );
}
