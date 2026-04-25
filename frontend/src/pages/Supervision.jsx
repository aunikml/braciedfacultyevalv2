import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, Grid, Avatar, 
  Divider, Chip, Button, Tabs, Tab, CircularProgress, 
  TextField, InputAdornment
} from '@mui/material';
import { User, BookOpen, FileText, ChevronRight, BarChart, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProgramAIInsights from '../components/ProgramAIInsights';

const Supervision = () => {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProgramId) {
      fetchFaculties(selectedProgramId);
    }
  }, [selectedProgramId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const progRes = await client.get('/academic/programs/');
      setPrograms(progRes.data);
      
      if (user.role === 'PROGRAM_SUPERVISOR') {
        setSelectedProgramId(user.assigned_program);
      } else if (progRes.data.length > 0) {
        setSelectedProgramId(progRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async (programId) => {
    try {
      // Get all faculty users
      const userRes = await client.get('/users/manage/');
      // Filter for faculty role and assigned program
      const filtered = userRes.data.filter(u => {
        const uProgId = typeof u.assigned_program === 'object' ? u.assigned_program?.id : u.assigned_program;
        return u.role === 'FACULTY' && uProgId === programId;
      });
      setFaculties(filtered);
    } catch (err) {
      console.error('Failed to fetch faculties');
    }
  };

  const handleProgramChange = (event, newValue) => {
    setSelectedProgramId(newValue);
  };

  const filteredFaculties = faculties.filter(f => 
    `${f.first_name} ${f.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Academic <span style={{ color: '#6366f1' }}>Supervision</span>
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor faculty performance and course evaluation metrics.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          {user.role === 'PROGRAM_SUPERVISOR' && programs.find(p => p.id === selectedProgramId) && (
            <Chip 
              icon={<BarChart size={18} />}
              label={`Program: ${programs.find(p => p.id === selectedProgramId)?.full_name}`}
              color="primary"
              sx={{ fontWeight: 700, px: 2, py: 2.5, borderRadius: 3, fontSize: '0.9rem' }}
            />
          )}
          
          {user.role === 'SUPERVISOR' && (
            <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Tabs 
                value={selectedProgramId} 
                onChange={handleProgramChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {programs.map(p => (
                  <Tab 
                    key={p.id} 
                    label={`${p.full_name} (${p.short_name})`} 
                    value={p.id} 
                    sx={{ fontWeight: 700, textTransform: 'none', py: 2 }}
                  />
                ))}
              </Tabs>
            </Paper>
          )}
        </Box>

        <TextField
          placeholder="Search faculty by name or email..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', md: 350 }, bgcolor: 'white' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#64748b" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredFaculties.length > 0 ? filteredFaculties.map((f) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={f.id}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
                }
              }}
              onClick={() => navigate(`/supervision/faculty/${f.id}`)}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Avatar sx={{ width: 70, height: 70, bgcolor: 'primary.light', color: 'primary.main', fontSize: '1.5rem', fontWeight: 800, mb: 2 }}>
                  {f.first_name[0]}
                </Avatar>
                <Typography variant="h6" fontWeight={800} noWrap sx={{ width: '100%' }}>
                  {f.first_name} {f.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {f.email}
                </Typography>
                <Divider sx={{ width: '40%', my: 2, opacity: 0.5 }} />
                <Button 
                  size="small" 
                  endIcon={<ChevronRight size={16} />}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  View Performance
                </Button>
              </Box>
            </Paper>
          </Grid>
        )) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: 'transparent' }}>
              <User size={64} color="#cbd5e1" style={{ marginBottom: '24px' }} />
              <Typography variant="h5" color="text.secondary" fontWeight={700}>No faculty members found</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>There are currently no faculty assigned to this program.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default Supervision;
