import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Avatar, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, TextField, InputAdornment, Breadcrumbs, Link, Stack, Divider
} from '@mui/material';
import { ArrowLeft, Search, FileText, BarChart, Users, BookOpen, ChevronRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const SupervisorDashboard = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [facultyAssignments, setFacultyAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await client.get('/evaluations/supervisor-faculty/');
        if (!cancelled) setFacultyList(res.data);
      } catch (err) {
        console.error('Failed to fetch faculty');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleSelectFaculty = async (faculty) => {
    setSelectedFaculty(faculty);
    setAssignmentsLoading(true);
    try {
      const res = await client.get('/evaluations/assignments/');
      const filtered = res.data.filter(a => a.faculty === faculty.id);
      setFacultyAssignments(filtered);
    } catch (err) {
      console.error('Failed to fetch assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedFaculty(null);
    setFacultyAssignments([]);
  };

  const filteredFaculty = facultyList.filter(f =>
    `${f.first_name} ${f.last_name} ${f.email} ${(f.courses || []).join(' ')} ${(f.programs || []).join(' ')}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (first, last) => `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  if (selectedFaculty) {
    return (
      <Container maxWidth="xl">
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            component="button" variant="body2" onClick={handleBack}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', textDecoration: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Back to Faculty
          </Link>
          <Typography variant="body2" color="text.primary">{selectedFaculty.first_name} {selectedFaculty.last_name}</Typography>
        </Breadcrumbs>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
              {getInitials(selectedFaculty.first_name, selectedFaculty.last_name)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={800}>{selectedFaculty.first_name} {selectedFaculty.last_name}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedFaculty.email}</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip icon={<BookOpen size={14} />} label={`${selectedFaculty.assignments_count} Assignments`} size="small" sx={{ fontWeight: 600 }} />
                <Chip icon={<CheckCircle size={14} />} label={`${selectedFaculty.processed_count} Processed`} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
              </Stack>
            </Box>
            <Button variant="outlined" startIcon={<ArrowLeft size={16} />} onClick={handleBack} sx={{ borderRadius: 2 }}>
              Back
            </Button>
          </Box>
        </Paper>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookOpen size={20} color="#6366f1" /> Course Assignments
        </Typography>

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Batch</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Respondents</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Faculty Report</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Course Report</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {assignmentsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : facultyAssignments.length > 0 ? facultyAssignments.map((asgn) => (
                <TableRow key={asgn.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Typography fontWeight={700} fontSize="0.875rem" color="primary.main">
                      {asgn.evaluation_instance_details?.course_details?.code}
                    </Typography>
                    <Typography fontSize="0.8125rem" color="text.secondary">
                      {asgn.evaluation_instance_details?.course_details?.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={asgn.evaluation_instance_details?.batch_name} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600} fontSize="0.875rem">
                      {asgn.evaluation_instance_details?.semester} {asgn.evaluation_instance_details?.year}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography fontWeight={600} fontSize="0.875rem">{asgn.total_respondents}</Typography>
                      {asgn.evaluation_instance_details?.total_students > 0 && (
                        <Typography fontSize="0.7rem" color="text.secondary">
                          / {asgn.evaluation_instance_details.total_students}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained" size="small" startIcon={<FileText size={14} />}
                      onClick={() => navigate(`/reports/${asgn.id}`)}
                      disabled={!asgn.processed_data}
                      sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', px: 2 }}
                    >
                      {asgn.processed_data ? 'View' : 'Pending'}
                    </Button>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined" size="small" startIcon={<BarChart size={14} />}
                      onClick={() => navigate(`/course-reports/${asgn.evaluation_instance}`)}
                      disabled={!asgn.evaluation_instance_details?.course_processed_data}
                      sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', px: 2 }}
                    >
                      {asgn.evaluation_instance_details?.course_processed_data ? 'View' : 'Pending'}
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <BookOpen size={40} color="#cbd5e1" style={{ marginBottom: 8 }} />
                    <Typography color="text.secondary" fontWeight={600}>No assignments found for this faculty member.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>
          Supervision <span style={{ color: '#6366f1' }}>Dashboard</span>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          All faculty members and program supervisors with their evaluation metrics
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            icon={<Users size={16} />}
            label={`${facultyList.length} Faculty & Supervisors`}
            color="primary"
            sx={{ fontWeight: 700, px: 1.5, fontSize: '0.85rem' }}
          />
          <Chip
            icon={<BookOpen size={16} />}
            label={`${facultyList.reduce((acc, f) => acc + (f.assignments_count || 0), 0)} Total Assignments`}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Stack>
        <TextField
          placeholder="Search by name, email, course, or program..."
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', md: 350 }, bgcolor: 'white' }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="#64748b" /></InputAdornment> } }}
        />
      </Box>

      <Grid container spacing={3}>
        {filteredFaculty.length > 0 ? filteredFaculty.map((f) => {
          const processedPercent = f.assignments_count > 0 ? Math.round((f.processed_count / f.assignments_count) * 100) : 0;
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={f.id}>
              <Paper
                elevation={0}
                onClick={() => handleSelectFaculty(f)}
                sx={{
                  p: 3, borderRadius: 4, border: '1px solid #e2e8f0',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main', transform: 'translateY(-3px)',
                    boxShadow: '0 8px 25px -5px rgba(99,102,241,0.15)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Avatar sx={{
                    width: 64, height: 64, bgcolor: 'primary.main', color: 'white',
                    fontSize: '1.3rem', fontWeight: 800, mb: 2,
                  }}>
                    {getInitials(f.first_name, f.last_name)}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ width: '100%' }}>
                    {f.first_name} {f.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ width: '100%', mb: 1 }}>
                    {f.email}
                  </Typography>

                  {(f.programs || []).length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      {f.programs.slice(0, 1).map((p, i) => (
                        <Chip key={i} label={p} size="small" sx={{
                          height: 20, fontSize: '0.6rem', fontWeight: 700,
                          bgcolor: '#eef2ff', color: '#6366f1', mb: 0.5,
                        }} />
                      ))}
                      {f.programs.length > 1 && (
                        <Chip label={`+${f.programs.length - 1}`} size="small" sx={{
                          height: 20, fontSize: '0.6rem', fontWeight: 700,
                          bgcolor: '#f1f5f9', color: '#475569',
                        }} />
                      )}
                    </Box>
                  )}

                  <Divider sx={{ width: '60%', mb: 1.5, opacity: 0.4 }} />

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', mb: 1.5 }}>
                    {(f.courses || []).slice(0, 3).map((code, i) => (
                      <Chip key={i} label={code} size="small" sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                        bgcolor: '#f1f5f9', color: '#475569',
                      }} />
                    ))}
                    {(f.courses || []).length > 3 && (
                      <Chip label={`+${f.courses.length - 3}`} size="small" sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 700,
                        bgcolor: '#eef2ff', color: '#6366f1',
                      }} />
                    )}
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ lineHeight: 1 }}>{f.assignments_count}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Assignments</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1, color: processedPercent === 100 ? '#10b981' : '#f59e0b' }}>
                        {processedPercent}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>Processed</Typography>
                    </Box>
                  </Stack>

                  <Button
                    size="small" endIcon={<ChevronRight size={16} />}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', color: 'primary.main' }}
                  >
                    View Details
                  </Button>
                </Box>
              </Paper>
            </Grid>
          );
        }) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: 'transparent' }}>
              <Users size={64} color="#cbd5e1" style={{ marginBottom: '24px' }} />
              <Typography variant="h5" color="text.secondary" fontWeight={700}>
                {searchQuery ? 'No results match your search' : 'No faculty members found'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                {searchQuery ? 'Try a different search term' : 'No faculty or supervisors have evaluation assignments yet.'}
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default SupervisorDashboard;
