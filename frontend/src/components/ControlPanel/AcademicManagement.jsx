import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Grid, 
  TextField, 
  IconButton, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { Plus, BookOpen, Users as UsersIcon, Trash2, ArrowRight, Edit2 } from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const AcademicManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [openProgramDialog, setOpenProgramDialog] = useState(false);
  const [openCourseDialog, setOpenCourseDialog] = useState(false);
  const [openBatchDialog, setOpenBatchDialog] = useState(false);

  const [programForm, setProgramForm] = useState({ short_name: '', full_name: '' });
  const [courseForm, setCourseForm] = useState({ code: '', name: '' });
  const [batchForm, setBatchForm] = useState({ code: '', name: '' });

  const [editingProgram, setEditingProgram] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    const response = await client.get('/academic/programs/');
    setPrograms(response.data);
    if (selectedProgram) {
      const updated = response.data.find(p => p.id === selectedProgram.id);
      setSelectedProgram(updated);
    }
  };

  const handleAddProgram = async () => {
    if (editingProgram) {
      await client.put(`/academic/programs/${editingProgram.id}/`, programForm);
    } else {
      await client.post('/academic/programs/', programForm);
    }
    setOpenProgramDialog(false);
    setProgramForm({ short_name: '', full_name: '' });
    setEditingProgram(null);
    fetchPrograms();
  };

  const handleAddCourse = async () => {
    if (editingCourse) {
      await client.put(`/academic/courses/${editingCourse.id}/`, { ...courseForm, program: selectedProgram.id });
    } else {
      await client.post('/academic/courses/', { ...courseForm, program: selectedProgram.id });
    }
    setOpenCourseDialog(false);
    setCourseForm({ code: '', name: '' });
    setEditingCourse(null);
    fetchPrograms();
  };

  const handleAddBatch = async () => {
    if (editingBatch) {
      await client.put(`/academic/batch-categories/${editingBatch.id}/`, { ...batchForm, program: selectedProgram.id });
    } else {
      await client.post('/academic/batch-categories/', { ...batchForm, program: selectedProgram.id });
    }
    setOpenBatchDialog(false);
    setBatchForm({ code: '', name: '' });
    setEditingBatch(null);
    fetchPrograms();
  };

  const handleDeleteProgram = (id) => {
    setTimeout(async () => {
      try {
        await client.delete(`/academic/programs/${id}/`);
        if(selectedProgram?.id === id) setSelectedProgram(null);
        fetchPrograms();
        alert('Deleted successfully');
      } catch (err) {
        console.error('Delete failed:', err);
        alert('Delete failed: ' + (err.response?.data?.detail || err.message));
      }
    }, 100);
  }

  const handleDeleteCourse = (id) => {
    setTimeout(async () => {
      try {
        await client.delete(`/academic/courses/${id}/`);
        fetchPrograms();
        alert('Course deleted successfully');
      } catch (err) {
        alert('Delete failed');
      }
    }, 100);
  }

  const handleDeleteBatch = (id) => {
    setTimeout(async () => {
      try {
        await client.delete(`/academic/batch-categories/${id}/`);
        fetchPrograms();
        alert('Batch deleted successfully');
      } catch (err) {
        alert('Delete failed');
      }
    }, 100);
  }

  if (authLoading) return null;
  if (user?.role?.toUpperCase() !== 'ADMIN' && user?.role?.toUpperCase() !== 'MANAGER') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">You do not have permission to manage academic entities.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={4}>
        {/* Programs List */}
        <Grid xs={12} md={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Programs</Typography>
            <IconButton color="primary" onClick={() => setOpenProgramDialog(true)}>
              <Plus size={20} />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {programs.map((program) => (
              <Card 
                key={program.id} 
                elevation={0} 
                sx={{ 
                  border: '1px solid #e2e8f0',
                  borderRadius: 3,
                  bgcolor: selectedProgram?.id === program.id ? 'primary.light' : 'background.paper',
                  borderColor: selectedProgram?.id === program.id ? 'primary.main' : '#e2e8f0'
                }}
              >
                <CardActionArea 
                  onClick={() => setSelectedProgram(program)} 
                  sx={{ p: 2 }}
                >
                  <Typography variant="subtitle1" fontWeight={700} color={selectedProgram?.id === program.id ? 'primary.main' : 'text.primary'}>
                    {program.short_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {program.full_name}
                  </Typography>
                </CardActionArea>
                <Box sx={{ 
                  px: 2, pb: 1, display: 'flex', justifyContent: 'flex-end', 
                  bgcolor: 'transparent', gap: 0.5 
                }}>
                    <IconButton size="small" sx={{ color: 'primary.main' }} onClick={(e) => { e.stopPropagation(); setEditingProgram(program); setProgramForm({short_name: program.short_name, full_name: program.full_name}); setOpenProgramDialog(true); }}>
                        <Edit2 size={14} />
                    </IconButton>
                    <IconButton 
                      type="button"
                      size="small" 
                      sx={{ color: 'error.main' }} 
                      onClick={(e) => { 
                        e.preventDefault();
                        e.stopPropagation(); 
                        handleDeleteProgram(program.id); 
                      }}
                    >
                        <Trash2 size={14} />
                    </IconButton>
                </Box>
              </Card>
            ))}
          </Box>
        </Grid>

        {/* Selected Program Details */}
        <Grid xs={12} md={8}>
          {selectedProgram ? (
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                {selectedProgram.full_name} ({selectedProgram.short_name})
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                {/* Courses Section */}
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }} elevation={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={20} color="#6366f1" />
                        <Typography variant="h6" fontWeight={600}>Courses</Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setOpenCourseDialog(true)} color="primary">
                        <Plus size={20} />
                      </IconButton>
                    </Box>
                    <List dense>
                      {selectedProgram.courses?.map((course) => (
                        <ListItem 
                          key={course.id} 
                          divider
                          sx={{ transition: 'all 0.2s' }}
                        >
                          <ListItemText 
                            primary={<Typography fontWeight={600}>{course.code}</Typography>}
                            secondary={<Typography variant="body2" sx={{ opacity: 0.8 }}>{course.name}</Typography>}
                          />
                          <IconButton size="small" color="primary" onClick={() => { setEditingCourse(course); setCourseForm({code: course.code, name: course.name}); setOpenCourseDialog(true); }}>
                            <Edit2 size={14} />
                          </IconButton>
                          <IconButton 
                            type="button"
                            size="small" 
                            color="error" 
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation(); 
                              handleDeleteCourse(course.id); 
                            }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </ListItem>
                      ))}
                      {(!selectedProgram.courses || selectedProgram.courses.length === 0) && (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No courses added yet.</Typography>
                      )}
                    </List>
                  </Paper>
                </Grid>

                {/* Batch Categories Section */}
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid #e2e8f0' }} elevation={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UsersIcon size={20} color="#ec4899" />
                        <Typography variant="h6" fontWeight={600}>Batch Categories</Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setOpenBatchDialog(true)} color="secondary">
                        <Plus size={20} />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedProgram.batch_categories?.map((batch) => (
                        <Chip 
                          key={batch.id} 
                          label={`${batch.code}: ${batch.name}`} 
                          onDelete={() => handleDeleteBatch(batch.id)}
                          onClick={() => { setEditingBatch(batch); setBatchForm({code: batch.code, name: batch.name}); setOpenBatchDialog(true); }}
                          sx={{ 
                            borderRadius: 2, 
                            fontWeight: 600,
                            bgcolor: 'secondary.main',
                            color: 'white',
                            '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } },
                            '&:hover': { bgcolor: 'secondary.dark' }
                          }}
                        />
                      ))}
                      {(!selectedProgram.batch_categories || selectedProgram.batch_categories.length === 0) && (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No batches added yet.</Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0', borderRadius: 4 }}>
              <Typography color="text.secondary">Select a program to manage courses and batches</Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Dialogs */}
      <Dialog open={openProgramDialog} onClose={() => { setOpenProgramDialog(false); setEditingProgram(null); setProgramForm({short_name: '', full_name: ''}); }}>
        <DialogTitle>{editingProgram ? 'Edit Program' : 'Add New Program'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Short Form (e.g. CSE)"
            fullWidth
            margin="dense"
            value={programForm.short_name}
            onChange={(e) => setProgramForm({ ...programForm, short_name: e.target.value })}
          />
          <TextField
            label="Full Name"
            fullWidth
            margin="dense"
            value={programForm.full_name}
            onChange={(e) => setProgramForm({ ...programForm, full_name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenProgramDialog(false); setEditingProgram(null); setProgramForm({short_name: '', full_name: ''}); }}>Cancel</Button>
          <Button onClick={handleAddProgram} variant="contained">{editingProgram ? 'Update' : 'Add'} Program</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCourseDialog} onClose={() => { setOpenCourseDialog(false); setEditingCourse(null); setCourseForm({code: '', name: ''}); }}>
        <DialogTitle>{editingCourse ? 'Edit Course' : `Add Course to ${selectedProgram?.short_name}`}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Course Code"
            fullWidth
            margin="dense"
            value={courseForm.code}
            onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
          />
          <TextField
            label="Course Full Name"
            fullWidth
            margin="dense"
            value={courseForm.name}
            onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCourseDialog(false); setEditingCourse(null); setCourseForm({code: '', name: ''}); }}>Cancel</Button>
          <Button onClick={handleAddCourse} variant="contained">{editingCourse ? 'Update' : 'Add'} Course</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openBatchDialog} onClose={() => { setOpenBatchDialog(false); setEditingBatch(null); setBatchForm({code: '', name: ''}); }}>
        <DialogTitle>{editingBatch ? 'Edit Batch Category' : `Add Batch Category to ${selectedProgram?.short_name}`}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Batch Code"
            fullWidth
            margin="dense"
            value={batchForm.code}
            onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
          />
          <TextField
            label="Category Name"
            fullWidth
            margin="dense"
            value={batchForm.name}
            onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenBatchDialog(false); setEditingBatch(null); setBatchForm({code: '', name: ''}); }}>Cancel</Button>
          <Button onClick={handleAddBatch} variant="contained" color="secondary">{editingBatch ? 'Update' : 'Add'} Batch</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicManagement;
