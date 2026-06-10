import React, { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Alert } from '@mui/material';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await window.api.login(username, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || String(err));
    } finally { setLoading(false); }
  };

  return (
    <Container sx={{ py: 6, maxWidth: 480 }}>
      <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Login Mekanik</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={submit} disabled={loading}>
          {loading ? 'Memproses...' : 'Login'}
        </Button>
      </Box>
    </Container>
  );
}
