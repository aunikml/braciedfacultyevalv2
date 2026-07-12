import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Eye, EyeOff, Lock, Mail, BarChart3, Users, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password);
      if (user.must_change_password) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Panel - Branding */}
      <Box
        sx={{
          flex: 1,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e3a5f 0%, #1a5276 30%, #2471a3 60%, #2e86c1 100%)',
          position: 'relative',
          overflow: 'hidden',
          p: 6,
        }}
      >
        {/* Decorative circles */}
        <Box sx={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -120, left: -60,
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />
        <Box sx={{
          position: 'absolute', top: '40%', left: '10%',
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 460 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5 }}>
            <Box
              component="img"
              src="https://bracied.com/wp-content/uploads/2022/09/BRAC-IED-Logo_white-1030x353.png"
              alt="BRAC Institute of Educational Development"
              sx={{ width: 280, height: 'auto', objectFit: 'contain' }}
            />
          </Box>

          <Typography variant="h3" fontWeight={800} color="white" sx={{ mb: 1.5, lineHeight: 1.2 }}>
            Faculty Evaluation<br />System
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 5, fontSize: '1.05rem', lineHeight: 1.6 }}>
            Empowering Academic Excellence Through Comprehensive Evaluation
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
            {[
              { icon: <BarChart3 size={22} />, label: 'Analytics' },
              { icon: <Users size={22} />, label: 'Faculty' },
              { icon: <Shield size={22} />, label: 'Secure' },
            ].map((item) => (
              <Box key={item.label} sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', mb: 1,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <Box sx={{ color: 'rgba(255,255,255,0.9)' }}>{item.icon}</Box>
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: 0.5 }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Panel - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: '#f8fafc',
          px: { xs: 3, sm: 6 },
          py: 4,
          position: 'relative',
        }}
      >
        {/* Mobile-only header */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mb: 4 }}>
          <Box
            component="img"
            src="https://bracied.com/wp-content/uploads/2022/09/BRAC-IED-Logo_white-1030x353.png"
            alt="BRAC IED"
            sx={{ width: 220, height: 'auto', objectFit: 'contain' }}
          />
        </Box>

        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', mb: 0.5 }}>
              Welcome back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your account to continue
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              autoFocus
              fullWidth
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={20} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
              slotProps={{
                input: {
                  sx: { borderRadius: 2, bgcolor: 'white', fontSize: '0.95rem' },
                },
              }}
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={20} color="#94a3b8" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              slotProps={{
                input: {
                  sx: { borderRadius: 2, bgcolor: 'white', fontSize: '0.95rem' },
                },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={isLoading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2471a3 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a3050 0%, #1f618d 100%)',
                },
                '&:disabled': {
                  background: '#94a3b8',
                },
              }}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
            BRAC Institute of Educational Development — BRAC University
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
