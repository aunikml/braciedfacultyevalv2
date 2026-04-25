import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Modal, TextField, 
  MenuItem, IconButton, Chip, Tooltip, Grid, Stack, CircularProgress
} from '@mui/material';
import { Plus, Search, Filter, ArrowRight, Trash2, Edit2, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 500, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 4,
};

const Evaluations = () => {
  const [instances, setInstances] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editInstance, setEditInstance] = useState(null);
  const [formData, setFormData] = useState({
    program: '', course: '', batch_category: '', batch_name: '', semester: 'Fall', year: new Date().getFullYear()
  });
  
  const [courses, setCourses] = useState([]);
  const [batchCats, setBatchCats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    fetchData();
  }, [selectedProgram]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchInstances(), fetchPrograms()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async () => {
    const res = await client.get(`/evaluations/instances/?program_id=${selectedProgram}`);
    setInstances(res.data);
  };

  const fetchPrograms = async () => {
    const res = await client.get('/academic/programs/');
    setPrograms(res.data);
  };

  const handleProgramChange = (e) => {
    const pId = e.target.value;
    updateProgramDependencies(pId);
  };

  const updateProgramDependencies = (pId) => {
    const prog = programs.find(p => p.id === pId);
    setCourses(prog?.courses || []);
    setBatchCats(prog?.batch_categories || []);
    setFormData(prev => ({ ...prev, program: pId, course: '', batch_category: '' }));
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditInstance(item);
      setFormData({
        program: item.program,
        course: item.course,
        batch_category: item.batch_category,
        batch_name: item.batch_name,
        semester: item.semester,
        year: item.year
      });
      // Pre-load dependencies for edit
      const prog = programs.find(p => p.id === item.program);
      setCourses(prog?.courses || []);
      setBatchCats(prog?.batch_categories || []);
    } else {
      setEditInstance(null);
      setFormData({
        program: '', course: '', batch_category: '', batch_name: '', semester: 'Fall', year: new Date().getFullYear()
      });
      setCourses([]);
      setBatchCats([]);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editInstance) {
        await client.put(`/evaluations/instances/${editInstance.id}/`, formData);
      } else {
        await client.post('/evaluations/instances/', formData);
      }
      setModalOpen(false);
      fetchInstances();
    } catch (err) {
      console.error('Failed to save evaluation instance');
    }
  };

  const handleDelete = (id) => {
    setTimeout(async () => {
      try {
        await client.delete(`/evaluations/instances/${id}/`);
        fetchInstances();
        alert('Evaluation cycle deleted successfully');
      } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete: ' + (err.response?.data?.detail || err.message));
      }
    }, 100);
  };
  if (authLoading || loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  if (!user) return null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Course Evaluations</Typography>
          <Typography variant="body1" color="text.secondary">Create and manage evaluation cycles</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />} 
          onClick={() => handleOpenModal()}
          sx={{ borderRadius: 2, px: 3, py: 1 }}
        >
          New Evaluation
        </Button>
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Filter size={20} color="#64748b" />
          <TextField
            select
            label="Filter by Program"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            sx={{ width: 300, bgcolor: 'white' }}
            size="small"
          >
            <MenuItem value="">All Programs</MenuItem>
            {programs.map(p => <MenuItem key={p.id} value={p.id}>{p.full_name} ({p.short_name})</MenuItem>)}
          </TextField>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', fontWeight: 600 }}>
            {instances.length} evaluation cycles found
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Course & Batch</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Semester/Year</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={32} sx={{ mb: 2 }} />
                  <Typography color="text.secondary">Loading cycles...</Typography>
                </TableCell>
              </TableRow>
            ) : instances.map((item) => (
              <TableRow 
                key={item.id} 
                hover 
                sx={{ 
                  transition: 'all 0.2s ease',
                }}
              >
                <TableCell>
                  <Chip 
                    label={item.program_details?.short_name} 
                    size="small" 
                    sx={{ 
                      fontWeight: 800, 
                      bgcolor: 'primary.main', 
                      color: 'white',
                    }} 
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {item.course_details?.code}: {item.course_details?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Batch: {item.batch_name} ({item.batch_category_details?.code})
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {item.semester} {item.year}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.course_processed_data ? "Processed" : "Pending Data"} 
                    size="small"
                    variant={item.course_processed_data ? "filled" : "outlined"}
                    color={item.course_processed_data ? "success" : "warning"}
                    sx={{ fontWeight: 600, color: item.course_processed_data ? 'white' : 'inherit' }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {(user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'MANAGER') && (
                      <>
                        <Tooltip title="Edit Cycle">
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }}
                            sx={{ color: 'primary.main' }}
                          >
                            <Edit2 size={18} />
                          </IconButton>
                        </Tooltip>
                        <IconButton 
                          type="button"
                          size="small" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            e.stopPropagation(); 
                            handleDelete(item.id); 
                          }}
                          sx={{ color: 'error.main' }}
                        >
                          <Trash2 size={18} />
                        </IconButton>
                      </>
                    )}
                    <Button 
                      size="small" 
                      variant="contained" 
                      endIcon={<ArrowRight size={14} />}
                      onClick={() => navigate(`/evaluations/${item.id}`)}
                      sx={{ 
                        borderRadius: 1.5, 
                        fontSize: '0.75rem',
                        bgcolor: 'white',
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark', color: 'white' }
                      }}
                    >
                      Manage
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {instances.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Settings2 size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
                  <Typography color="text.secondary">No evaluation instances found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={style}>
          <Typography variant="h5" fontWeight={800} mb={3}>
            {editInstance ? 'Edit Evaluation Instance' : 'Create Evaluation Instance'}
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField 
              select fullWidth label="Program" 
              value={formData.program} 
              onChange={handleProgramChange} 
              margin="normal" required
              sx={{ bgcolor: '#f8fafc' }}
            >
              {programs.map(p => <MenuItem key={p.id} value={p.id}>{p.full_name} ({p.short_name})</MenuItem>)}
            </TextField>
            
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <TextField 
                  select fullWidth label="Course" 
                  value={formData.course} 
                  onChange={(e) => setFormData({...formData, course: e.target.value})} 
                  margin="normal" required disabled={!formData.program}
                  sx={{ bgcolor: '#f8fafc' }}
                >
                  {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.code}: {c.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField 
                  select fullWidth label="Batch Category" 
                  value={formData.batch_category} 
                  onChange={(e) => setFormData({...formData, batch_category: e.target.value})} 
                  margin="normal" required disabled={!formData.program}
                  sx={{ bgcolor: '#f8fafc' }}
                >
                  {batchCats.map(b => <MenuItem key={b.id} value={b.id}>{b.code}: {b.name}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

            <TextField 
              fullWidth label="Batch Name (e.g., CSE-FALL-26-01)" 
              value={formData.batch_name} 
              onChange={(e) => setFormData({...formData, batch_name: e.target.value})} 
              margin="normal" required 
            />
            
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <TextField select fullWidth label="Semester" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} margin="normal" required>
                  <MenuItem value="Fall">Fall</MenuItem>
                  <MenuItem value="Summer">Summer</MenuItem>
                  <MenuItem value="Spring">Spring</MenuItem>
                </TextField>
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField fullWidth label="Year" type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} margin="normal" required />
              </Grid>
            </Grid>
            
            <Button 
              fullWidth 
              variant="contained" 
              type="submit" 
              sx={{ mt: 4, py: 1.8, borderRadius: 2, fontWeight: 700, fontSize: '1rem' }}
            >
              {editInstance ? 'Update Instance' : 'Create Instance'}
            </Button>
          </form>
        </Box>
      </Modal>
    </Container>
  );
};


export default Evaluations;
