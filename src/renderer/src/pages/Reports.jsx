import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Box, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setLoading(true);
    try {
      const r = await window.api.getReports();
      setData(r);
    } finally { setLoading(false); }
  };

  if (loading) return <Container sx={{ py: 3 }}><CircularProgress /></Container>;

  const kesiapan = Array.isArray(data?.kesiapan_armada) && data.kesiapan_armada[0] ? data.kesiapan_armada[0] : null;

  return (
    <Container sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>Laporan</Typography>

      <Box sx={{ mt: 2 }} component={Paper} variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1">Kesiapan Armada</Typography>
          {kesiapan ? (
            <Table size="small">
              <TableBody>
                <TableRow><TableCell>Aktif</TableCell><TableCell>{kesiapan.aktif_count}</TableCell></TableRow>
                <TableRow><TableCell>Diperbaiki</TableCell><TableCell>{kesiapan.diperbaiki_count}</TableCell></TableRow>
                <TableRow><TableCell>Total</TableCell><TableCell>{kesiapan.total}</TableCell></TableRow>
                <TableRow><TableCell>% Aktif</TableCell><TableCell>{kesiapan.pct_aktif}%</TableCell></TableRow>
                <TableRow><TableCell>% Diperbaiki</TableCell><TableCell>{kesiapan.pct_diperbaiki}%</TableCell></TableRow>
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">Tidak ada data kesiapan armada.</Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 3 }} component={Paper} variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1">Defisit Inventaris</Typography>
          {Array.isArray(data?.defisit_inventaris) && data.defisit_inventaris.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Stok</TableCell>
                  <TableCell>Batas Min</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.defisit_inventaris.map(r => (
                  <TableRow key={r.id_suku_cadang}>
                    <TableCell>{r.id_suku_cadang}</TableCell>
                    <TableCell>{r.nama}</TableCell>
                    <TableCell>{r.kategori}</TableCell>
                    <TableCell>{r.kuantitas_fisik}</TableCell>
                    <TableCell>{r.batas_minimum}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">Tidak ada suku cadang mendekati atau di bawah batas minimum.</Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 3 }} component={Paper} variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1">Frekuensi Kerusakan</Typography>
          {Array.isArray(data?.frekuensi_kerusakan) && data.frekuensi_kerusakan.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nomor Polisi</TableCell>
                  <TableCell>Jumlah Kerusakan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.frekuensi_kerusakan.map(r => (
                  <TableRow key={r.nomor_polisi}>
                    <TableCell>{r.nomor_polisi}</TableCell>
                    <TableCell>{r.jumlah_kerusakan}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">Tidak ada data kerusakan.</Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 3 }} component={Paper} variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1">Distribusi Penugasan Mekanik</Typography>
          {Array.isArray(data?.distribusi_penugasan) && data.distribusi_penugasan.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID Mekanik</TableCell>
                  <TableCell>Jumlah Penugasan</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.distribusi_penugasan.map(r => (
                  <TableRow key={r.id_mekanik}>
                    <TableCell>{r.id_mekanik}</TableCell>
                    <TableCell>{r.jumlah_penugasan}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">Tidak ada distribusi penugasan.</Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ mt: 3 }} component={Paper} variant="outlined">
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1">Konsumsi Komponen</Typography>
          {Array.isArray(data?.konsumsi_komponen) && data.konsumsi_komponen.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID Suku</TableCell>
                  <TableCell>Nama</TableCell>
                  <TableCell>Total Dipakai</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.konsumsi_komponen.map(r => (
                  <TableRow key={r.id_suku_cadang}>
                    <TableCell>{r.id_suku_cadang}</TableCell>
                    <TableCell>{r.nama_suku_cadang}</TableCell>
                    <TableCell>{r.total_dipakai}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography color="text.secondary">Tidak ada data konsumsi komponen.</Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}
