import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, CircularProgress, 
  Alert, Button, Stack
} from '@mui/material';
import { Brain, Sparkles, RefreshCw, BarChart4, ShieldCheck, Zap } from 'lucide-react';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const ProgramAIInsights = ({ programId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const fetchInsights = async () => {
    if (!programId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/brain/insights/program/${programId}/`);
      setInsights(response.data.insights);
    } catch (err) {
      if (err.response?.status === 403) {
        setDisabled(true);
      } else {
        setError("AI could not generate program-wide insights at this time.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [programId]);

  if (disabled) return null;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 3, 
        borderRadius: 4, 
        border: '1px solid #e2e8f0', 
        mb: 4, 
        bgcolor: '#f8fafc',
        borderLeft: '5px solid #ec4899'
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Brain size={22} color="#ec4899" /> Program Strategy <span style={{ color: '#ec4899', fontSize: '0.8rem', marginLeft: 4 }}>AI ASSISTED</span>
        </Typography>
        <Button 
          size="small" 
          startIcon={<RefreshCw size={14} className={loading ? 'spin-animation' : ''} />}
          onClick={fetchInsights}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}
        >
          Update
        </Button>
      </Stack>

      <AnimatePresence mode="wait">
        {loading ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#ec4899' }} />
          </Box>
        ) : error ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, fontSize: '0.85rem' }}>{error}</Alert>
        ) : insights ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box sx={{ whiteSpace: 'pre-line', fontSize: '0.9rem', lineHeight: 1.6, color: '#334155' }}>
              {insights.split('\n').map((line, i) => {
                const cleanLine = line.replace(/\*\*/g, '').trim();
                if (!cleanLine) return null;
                
                if (line.includes('Program Health') || line.includes('Top Performing') || line.includes('Areas for Improvement') || line.includes('Strategic Recommendations')) {
                  return (
                    <Typography key={i} variant="subtitle2" fontWeight={800} sx={{ mt: 2, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1, color: '#1e293b' }}>
                      {line.includes('Health') && <ShieldCheck size={16} color="#10b981" />}
                      {line.includes('Performing') && <Award size={16} color="#f59e0b" />}
                      {line.includes('Improvement') && <BarChart4 size={16} color="#ef4444" />}
                      {line.includes('Recommendations') && <Zap size={16} color="#6366f1" />}
                      {cleanLine}
                    </Typography>
                  );
                }
                
                return (
                  <Typography key={i} variant="body2" sx={{ mb: 0.5, pl: 3, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', left: 10, top: 8, width: 4, height: 4, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
                    {cleanLine}
                  </Typography>
                );
              })}
            </Box>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Paper>
  );
};

export default ProgramAIInsights;
