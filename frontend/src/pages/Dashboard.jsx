import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, Chip, CircularProgress, TextField, InputAdornment, Grid, Stack
} from '@mui/material';
import { FileText, Search, BookOpen, BarChart3, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, semesterFilter, yearFilter, assignments]);

  const fetchAssignments = async () => {
    try {
      const response = await client.get('/evaluations/assignments/');
      // Filter for reports with processed data AND belonging to the current user
      const processed = response.data.filter(a => a.processed_data && a.faculty === user.id);
      setAssignments(processed);
      setFilteredAssignments(processed);
    } catch (err) {
      console.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...assignments];
    
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.evaluation_instance_details.course_details.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.evaluation_instance_details.course_details.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (semesterFilter) {
      filtered = filtered.filter(a => 
        a.evaluation_instance_details.semester.toLowerCase() === semesterFilter.toLowerCase()
      );
    }
    
    if (yearFilter) {
      filtered = filtered.filter(a => 
        a.evaluation_instance_details.year.toString() === yearFilter
      );
    }
    
    setFilteredAssignments(filtered);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.02em' }}>
          My <span style={{ color: '#6366f1' }}>Reports</span>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', maxWidth: 800 }}>
          Access your personal evaluation reports and student feedback history.
        </Typography>
      </Box>

      {/* Filters Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search code, name, or faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ bgcolor: 'white' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#64748b" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} md={2.5}>
            <TextField
              select
              fullWidth
              label="Semester"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              size="small"
              sx={{ bgcolor: 'white' }}
              SelectProps={{ native: true }}
            >
              <option value="">All Semesters</option>
              <option value="Fall">Fall</option>
              <option value="Summer">Summer</option>
              <option value="Spring">Spring</option>
            </TextField>
          </Grid>
          <Grid item xs={6} md={2.5}>
            <TextField
              fullWidth
              label="Year (e.g. 2024)"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ bgcolor: 'white' }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={() => { setSearchQuery(''); setSemesterFilter(''); setYearFilter(''); }}
              sx={{ height: 40, borderRadius: 2 }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {filteredAssignments.length > 0 ? (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f1f5f9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Faculty</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Section</TableCell>
                <TableCell sx={{ fontWeight: 800, color: '#475569' }}>Semester</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, color: '#475569' }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssignments.map((asgn) => (
                <TableRow key={asgn.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={800} color="primary.main">
                      {asgn.evaluation_instance_details.course_details.code}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {asgn.evaluation_instance_details.course_details.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {asgn.faculty_details.first_name} {asgn.faculty_details.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {asgn.faculty_details.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={asgn.evaluation_instance_details.batch_name} 
                      size="small" 
                      sx={{ borderRadius: 1.5, fontWeight: 700, bgcolor: '#e2e8f0', color: '#475569' }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${asgn.evaluation_instance_details.semester} ${asgn.evaluation_instance_details.year}`} 
                      size="small" 
                      variant="outlined"
                      sx={{ fontWeight: 700, borderRadius: 1 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button 
                        size="small" 
                        variant="contained" 
                        startIcon={<FileText size={14} />}
                        onClick={() => navigate(`/reports/${asgn.id}`)}
                        sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                      >
                        Faculty Report
                      </Button>
                      {asgn.evaluation_instance_details.course_processed_data && (
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="secondary"
                          startIcon={<BarChart3 size={14} />}
                          onClick={() => navigate(`/course-reports/${asgn.evaluation_instance}`)}
                          sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                        >
                          Course Report
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #e2e8f0', bgcolor: 'transparent' }}>
          <FileText size={64} color="#cbd5e1" style={{ marginBottom: '24px' }} />
          <Typography variant="h5" color="text.secondary" fontWeight={700}>No reports found</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>Try a different search term.</Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Dashboard;
