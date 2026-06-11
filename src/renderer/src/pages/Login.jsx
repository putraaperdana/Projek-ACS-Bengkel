import React, { useState } from 'react'
import { Box, TextField, Button, Typography, Alert } from '@mui/material'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const user = await window.api.login(username, password)
      onLogin(user)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#121212', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
     
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#1E1E1E', 
          p: 4,
          borderRadius: 3,
          boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.5)',
          borderTop: '5px solid #FFC107', 
        }}
      >
        <Typography 
          variant="h4" 
          align="center"
          sx={{ 
            mb: 1, 
            fontWeight: 800, 
            color: '#FFFFFF',
            letterSpacing: 1
          }}
        >
          BENGKEL<span style={{ color: '#FFC107' }}>KU</span>
        </Typography>
        
        <Typography 
          variant="body2" 
          align="center"
          sx={{ mb: 4, color: '#AAAAAA' }}
        >
          Silakan masuk ke akun Anda
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: '#4a0000', color: '#ffb3b3' }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Username"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          fullWidth
          sx={{ 
            mb: 3,
            '& .MuiInputLabel-root': { color: '#888' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#FFC107' },
            '& .MuiOutlinedInput-root': {
              color: '#FFF',
              backgroundColor: '#2A2A2A',
              borderRadius: 2,
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: '#555' },
              '&.Mui-focused fieldset': { borderColor: '#FFC107' },
            }
          }}
        />

        <TextField
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          sx={{ 
            mb: 4,
            '& .MuiInputLabel-root': { color: '#888' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#FFC107' },
            '& .MuiOutlinedInput-root': {
              color: '#FFF',
              backgroundColor: '#2A2A2A',
              borderRadius: 2,
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: '#555' },
              '&.Mui-focused fieldset': { borderColor: '#FFC107' },
            }
          }}
        />

        <Button 
          variant="contained" 
          fullWidth
          size="large"
          onClick={submit} 
          disabled={loading}
          sx={{ 
            py: 1.5,
            backgroundColor: '#FFC107', 
            color: '#000000',
            fontWeight: 'bold',
            fontSize: '1rem',
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: '0px 4px 15px rgba(255, 193, 7, 0.3)',
            '&:hover': { 
              backgroundColor: '#e0a800',
              boxShadow: '0px 6px 20px rgba(255, 193, 7, 0.5)',
            },
            '&.Mui-disabled': {
              backgroundColor: '#555',
              color: '#888'
            }
          }}
        >
          {loading ? 'Memproses...' : 'LOGIN'}
        </Button>
      </Box>
    </Box>
  )
}