import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, CircularProgress, 
  Alert, Button, Stack, Divider
} from '@mui/material';
import { Brain, Sparkles, RefreshCw, TrendingUp, Target, Award } from 'lucide-react';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const FacultyGlobalAIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get('/brain/insights/faculty/global/');
      setInsights(response.data.insights);
    } catch (err) {
      if (err.response?.status === 403) {
        setDisabled(true);
      } else {
        setError("AI could not generate your career summary at this time.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (disabled) return null;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4, 
        borderRadius: 5, 
        border: '1px solid #e2e8f0', 
        mb: 5, 
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'primary.main',
        color: 'white',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Background patterns */}
      <Box sx={{ 
        position: 'absolute', bottom: -40, right: -40, 
        width: 200, height: 200, borderRadius: '50%', 
        bgcolor: 'rgba(255, 255, 255, 0.1)', zIndex: 0 
      }} />
      <Box sx={{ 
        position: 'absolute', top: -20, left: -20, 
        width: 100, height: 100, borderRadius: '50%', 
        bgcolor: 'rgba(255, 255, 255, 0.05)', zIndex: 0 
      }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Brain size={28} /> AI Career <span style={{ opacity: 0.8 }}>Analytics</span>
          </Typography>
          <Button 
            size="small" 
            variant="outlined"
            startIcon={<RefreshCw size={14} className={loading ? 'spin-animation' : ''} />}
            onClick={fetchInsights}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none', color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            Refresh Summary
          </Button>
        </Stack>

        <AnimatePresence mode="wait">
          {loading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress size={32} sx={{ mb: 2, color: 'white' }} />
              <Typography variant="body1">Gemini is synthesizing your career performance data...</Typography>
            </Box>
          ) : error ? (
            <Alert severity="info" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
              {error}
            </Alert>
          ) : insights ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <Box sx={{ whiteSpace: 'pre-line', fontSize: '1rem', lineHeight: 1.7, opacity: 0.95 }}>
                {insights.split('\n').map((line, i) => {
                  const cleanLine = line.replace(/\*\*/g, '').trim();
                  if (!cleanLine) return <Box key={i} sx={{ height: 10 }} />;
                  
                  if (line.includes('Career Trajectory') || line.includes('Key Themes') || line.includes('Strategic Advice')) {
                    return (
                      <Typography key={i} variant="h6" fontWeight={800} sx={{ mt: 3, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {line.includes('Trajectory') && <TrendingUp size={20} />}
                        {line.includes('Themes') && <Award size={20} />}
                        {line.includes('Advice') && <Target size={20} />}
                        {cleanLine}
                      </Typography>
                    );
                  }
                  
                  if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                    return (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1, ml: 2 }}>
                        <Sparkles size={16} style={{ marginTop: 6, flexShrink: 0, opacity: 0.7 }} />
                        <Typography variant="body1">{cleanLine.substring(1).trim()}</Typography>
                      </Box>
                    );
                  }
                  
                  return <Typography key={i} variant="body1" sx={{ mb: 1 }}>{cleanLine}</Typography>;
                })}
              </Box>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Box>

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

export default FacultyGlobalAIInsights;
