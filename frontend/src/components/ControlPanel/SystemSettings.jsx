import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Switch, FormControlLabel, 
  Alert, CircularProgress, Divider, Stack 
} from '@mui/material';
import { Brain, Cpu, ShieldCheck, Zap } from 'lucide-react';
import client from '../../api/client';

const SystemSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await client.get('/brain/settings/');
      setSettings(response.data);
    } catch (err) {
      setError("Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentVal) => {
    setUpdating(true);
    try {
      await client.patch(`/brain/settings/${id}/`, { value: !currentVal });
      setSettings(prev => prev.map(s => s.id === id ? { ...s, value: !currentVal } : s));
    } catch (err) {
      setError("Failed to update setting.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <CircularProgress />;

  const aiEnabled = settings.find(s => s.key === 'ai_analytics_enabled');

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Cpu size={24} color="#6366f1" /> System Abstractions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure global system behavior and agentic capabilities.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 4, 
              border: '1px solid #e2e8f0',
              bgcolor: aiEnabled?.value ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
              transition: 'all 0.3s'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Brain size={20} color="#6366f1" /> AI-Generated Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 300 }}>
                  Enable agentic functions using Google Gemini to generate performance insights for faculty members.
                </Typography>
              </Box>
              <Switch 
                checked={aiEnabled?.value || false} 
                onChange={() => handleToggle(aiEnabled.id, aiEnabled.value)}
                disabled={updating}
                color="primary"
              />
            </Stack>
            
            <Divider sx={{ my: 2, opacity: 0.5 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Zap size={14} color={aiEnabled?.value ? '#6366f1' : '#94a3b8'} />
              <Typography variant="caption" sx={{ color: aiEnabled?.value ? 'primary.main' : 'text.secondary', fontWeight: 600 }}>
                {aiEnabled?.value ? 'Agentic functions are active' : 'AI analysis is dormant'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px dashed #e2e8f0', opacity: 0.6 }}>
            <Typography variant="subtitle1" fontWeight={700} color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShieldCheck size={20} /> Data Privacy Guard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Coming Soon: Anonymization layer for student data before AI processing.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

import { Grid } from '@mui/material';
export default SystemSettings;
