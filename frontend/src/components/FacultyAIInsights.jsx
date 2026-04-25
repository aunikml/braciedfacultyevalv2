import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, CircularProgress, 
  Alert, Button, Stack, Divider, List, ListItem, ListItemIcon, ListItemText 
} from '@mui/material';
import { Brain, Sparkles, CheckCircle2, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import client from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

const FacultyAIInsights = ({ assignmentId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await client.get(`/brain/insights/faculty/${assignmentId}/`);
      setInsights(response.data.insights);
    } catch (err) {
      if (err.response?.status === 403) {
        setDisabled(true);
      } else {
        setError("AI Insights could not be generated. Please check your connection or API key.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [assignmentId]);

  if (disabled) return null;

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: 4, 
        borderRadius: 4, 
        border: '1px solid #e2e8f0', 
        mb: 4, 
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'white'
      }}
    >
      {/* Background decoration */}
      <Box sx={{ 
        position: 'absolute', top: -50, right: -50, 
        width: 150, height: 150, borderRadius: '50%', 
        bgcolor: 'rgba(99, 102, 241, 0.05)', zIndex: 0 
      }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Brain size={28} color="#6366f1" /> AI Agentic <span style={{ color: '#6366f1' }}>Insights</span>
          </Typography>
          <Button 
            size="small" 
            startIcon={<RefreshCw size={14} className={loading ? 'spin-animation' : ''} />}
            onClick={fetchInsights}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Regenerate
          </Button>
        </Stack>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '40px 0', textAlign: 'center' }}
            >
              <CircularProgress size={32} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">Gemini is analyzing student feedback and performance metrics...</Typography>
            </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Alert severity="info" sx={{ borderRadius: 3 }}>{error}</Alert>
            </motion.div>
          ) : insights ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ whiteSpace: 'pre-line', color: 'text.primary', lineHeight: 1.6 }}>
                {/* We try to parse the structure if it's formatted as expected, otherwise show raw */}
                {insights.split('\n').map((line, i) => {
                  if (line.startsWith('**') || line.includes(':')) {
                    return <Typography key={i} variant="body1" fontWeight={700} sx={{ mt: 2, mb: 1, color: 'primary.main' }}>{line.replace(/\*\*/g, '')}</Typography>;
                  }
                  if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                    return (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1, ml: 1 }}>
                        <Sparkles size={16} color="#6366f1" style={{ marginTop: 4, flexShrink: 0 }} />
                        <Typography variant="body2">{line.trim().substring(1).trim()}</Typography>
                      </Box>
                    );
                  }
                  return <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 1 }}>{line}</Typography>;
                })}
              </Box>
            </motion.div>
          ) : (
            <Typography variant="body2" color="text.secondary">Click regenerate to start AI analysis.</Typography>
          )}
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

export default FacultyAIInsights;
