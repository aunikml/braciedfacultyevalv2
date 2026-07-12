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
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Stack,
  Badge
} from '@mui/material';
import { Plus, BookOpen, Users as UsersIcon, Trash2, Edit2, Search } from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const AcademicManagement = () => {
  const { user, loading: authLoading } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
        if (selectedProgram?.id === id) setSelectedProgram(null);
        fetchPrograms();
      } catch (err) {
        alert('Delete failed: ' + (err.response?.data?.detail || err.message));
      }
    }, 100);
  };

  const handleDeleteCourse = (id) => {
    setTimeout(async () => {
      try {
        await client.delete(`/academic/courses/${id}/`);
        fetchPrograms();
      } catch (err) {
        alert('Delete failed');
      }
    }, 100);
  };

  const handleDeleteBatch = (id) => {
    setTimeout(async () => {
      try {
        await client.delete(`/academic/batch-categories/${id}/`);
        fetchPrograms();
      } catch (err) {
        alert('Delete failed');
      }
    }, 100);
  };

  const filteredPrograms = programs.filter(p =>
    p.short_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <Grid container spacing={3}>
        {/* Programs Sidebar */}
        <Grid xs={12} md={3.5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700}>Programs</Typography>
            <Badge badgeContent={programs.length} color="primary" sx={{ mr: 1 }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => setOpenProgramDialog(true)}
                sx={{ border: '1px solid', borderColor: 'primary.light' }}
              >
                <Plus size={18} />
              </IconButton>
            </Badge>
          </Box>

          <TextField
            fullWidth
            size="small"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#94a3b8" />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredPrograms.map((program) => {
              const isSelected = selectedProgram?.id === program.id;
              const courseCount = program.courses?.length || 0;
              const batchCount = program.batch_categories?.length || 0;
              return (
                <Card
                  key={program.id}
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : '#e2e8f0',
                    borderRadius: 2,
                    bgcolor: isSelected ? 'rgba(99, 102, 241, 0.04)' : 'white',
                    transition: 'all 0.15s',
                    '&:hover': { borderColor: 'primary.light' },
                  }}
                >
                  <CardActionArea onClick={() => setSelectedProgram(program)} sx={{ px: 2, py: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: '14px', color: isSelected ? 'primary.main' : '#1e293b' }}>
                          {program.short_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ display: 'block', fontSize: '14px' }}>
                          {program.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {program.full_name}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, ml: 1 }}>
                        <Chip label={courseCount} size="small" sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, bgcolor: '#ede9fe', color: '#6366f1' }} />
                        <Chip label={batchCount} size="small" sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, bgcolor: '#fce7f3', color: '#ec4899' }} />
                      </Stack>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                      <IconButton
                        size="small"
                        sx={{ color: '#94a3b8', '&:hover': { color: 'primary.main' } }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProgram(program);
                          setProgramForm({ short_name: program.short_name, full_name: program.full_name });
                          setOpenProgramDialog(true);
                        }}
                      >
                        <Edit2 size={13} />
                      </IconButton>
                      <IconButton
                        size="small"
                        sx={{ color: '#94a3b8', '&:hover': { color: 'error.main' } }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProgram(program.id);
                        }}
                      >
                        <Trash2 size={13} />
                      </IconButton>
                    </Box>
                  </CardActionArea>
                </Card>
              );
            })}
            {filteredPrograms.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No programs found</Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Selected Program Details */}
        <Grid xs={12} md={8.5}>
          {selectedProgram ? (
            <Box>
              <Box sx={{ mb: 3, pb: 2, borderBottom: '2px solid #e2e8f0' }}>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#1e293b' }}>
                  {selectedProgram.full_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                  {selectedProgram.short_name} · {selectedProgram.courses?.length || 0} courses · {selectedProgram.batch_categories?.length || 0} batch categories
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {/* Courses */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BookOpen size={18} color="#6366f1" />
                        <Typography variant="subtitle1" fontWeight={700}>Courses</Typography>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<Plus size={14} />}
                        onClick={() => setOpenCourseDialog(true)}
                sx={{ textTransform: 'none', fontSize: '0.875rem' }}
              >
                Add
              </Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <List dense disablePadding>
                      {selectedProgram.courses?.map((course) => (
                        <ListItem
                          key={course.id}
                          disablePadding
                          sx={{
                            py: 1,
                            borderBottom: '1px solid #f1f5f9',
                            '&:last-child': { borderBottom: 0 },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2" fontWeight={700} sx={{ fontSize: '14px' }}>
                                {course.code}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                                {course.name}
                              </Typography>
                            }
                          />
                          <IconButton
                            size="small"
                            sx={{ color: '#94a3b8', '&:hover': { color: 'primary.main' } }}
                            onClick={() => {
                              setEditingCourse(course);
                              setCourseForm({ code: course.code, name: course.name });
                              setOpenCourseDialog(true);
                            }}
                          >
                            <Edit2 size={14} />
                          </IconButton>
                          <IconButton
                            size="small"
                            sx={{ color: '#94a3b8', '&:hover': { color: 'error.main' } }}
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteCourse(course.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                    {(!selectedProgram.courses || selectedProgram.courses.length === 0) && (
                      <Box sx={{ py: 3, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 2 }}>
                        <BookOpen size={24} color="#cbd5e1" style={{ marginBottom: 4 }} />
                        <Typography variant="caption" color="text.secondary">No courses yet</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Batch Categories */}
                <Grid item xs={12} sm={6}>
                  <Paper
                    elevation={0}
                    sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UsersIcon size={18} color="#ec4899" />
                        <Typography variant="subtitle1" fontWeight={700}>Batch Categories</Typography>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<Plus size={14} />}
                        onClick={() => setOpenBatchDialog(true)}
                        color="secondary"
                        sx={{ textTransform: 'none', fontSize: '0.875rem' }}
                      >
                        Add
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 1 }} />
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selectedProgram.batch_categories?.map((batch) => (
                        <Chip
                          key={batch.id}
                          label={`${batch.code}: ${batch.name}`}
                          onDelete={() => handleDeleteBatch(batch.id)}
                          onClick={() => {
                            setEditingBatch(batch);
                            setBatchForm({ code: batch.code, name: batch.name });
                            setOpenBatchDialog(true);
                          }}
                          sx={{
                            borderRadius: 2,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            bgcolor: '#fce7f3',
                            color: '#9d174d',
                            '& .MuiChip-deleteIcon': { color: '#be185d', '&:hover': { color: '#9d174d' } },
                            '&:hover': { bgcolor: '#fbcfe8' },
                          }}
                        />
                      ))}
                    </Box>
                    {(!selectedProgram.batch_categories || selectedProgram.batch_categories.length === 0) && (
                      <Box sx={{ py: 3, textAlign: 'center', border: '1px dashed #e2e8f0', borderRadius: 2 }}>
                        <UsersIcon size={24} color="#cbd5e1" style={{ marginBottom: 4 }} />
                        <Typography variant="caption" color="text.secondary">No batch categories yet</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          ) : (
            <Box sx={{
              height: '100%', minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed #e2e8f0', borderRadius: 4,
            }}>
              <Box sx={{ textAlign: 'center' }}>
                <BookOpen size={40} color="#cbd5e1" style={{ marginBottom: 8 }} />
                <Typography color="text.secondary" fontWeight={600}>Select a program to manage courses and batches</Typography>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Program Dialog */}
      <Dialog open={openProgramDialog} onClose={() => { setOpenProgramDialog(false); setEditingProgram(null); setProgramForm({ short_name: '', full_name: '' }); }} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editingProgram ? 'Edit Program' : 'Add New Program'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus label="Short Form (e.g. CSE)" fullWidth margin="dense" value={programForm.short_name} onChange={(e) => setProgramForm({ ...programForm, short_name: e.target.value })} />
          <TextField label="Full Name" fullWidth margin="dense" value={programForm.full_name} onChange={(e) => setProgramForm({ ...programForm, full_name: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpenProgramDialog(false); setEditingProgram(null); setProgramForm({ short_name: '', full_name: '' }); }}>Cancel</Button>
          <Button onClick={handleAddProgram} variant="contained">{editingProgram ? 'Update' : 'Add'} Program</Button>
        </DialogActions>
      </Dialog>

      {/* Course Dialog */}
      <Dialog open={openCourseDialog} onClose={() => { setOpenCourseDialog(false); setEditingCourse(null); setCourseForm({ code: '', name: '' }); }} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editingCourse ? 'Edit Course' : `Add Course to ${selectedProgram?.short_name}`}</DialogTitle>
        <DialogContent>
          <TextField autoFocus label="Course Code" fullWidth margin="dense" value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} />
          <TextField label="Course Full Name" fullWidth margin="dense" value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpenCourseDialog(false); setEditingCourse(null); setCourseForm({ code: '', name: '' }); }}>Cancel</Button>
          <Button onClick={handleAddCourse} variant="contained">{editingCourse ? 'Update' : 'Add'} Course</Button>
        </DialogActions>
      </Dialog>

      {/* Batch Dialog */}
      <Dialog open={openBatchDialog} onClose={() => { setOpenBatchDialog(false); setEditingBatch(null); setBatchForm({ code: '', name: '' }); }} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{editingBatch ? 'Edit Batch Category' : `Add Batch Category to ${selectedProgram?.short_name}`}</DialogTitle>
        <DialogContent>
          <TextField autoFocus label="Batch Code" fullWidth margin="dense" value={batchForm.code} onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })} />
          <TextField label="Category Name" fullWidth margin="dense" value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpenBatchDialog(false); setEditingBatch(null); setBatchForm({ code: '', name: '' }); }}>Cancel</Button>
          <Button onClick={handleAddBatch} variant="contained" color="secondary">{editingBatch ? 'Update' : 'Add'} Batch</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicManagement;
