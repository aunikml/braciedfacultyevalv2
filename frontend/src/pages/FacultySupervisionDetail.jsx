import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Button, 
  Chip, CircularProgress, IconButton, Stack, Breadcrumbs, Link,
  Avatar, Divider, TextField, InputAdornment, Grid
} from '@mui/material';
import { ArrowLeft, FileText, BarChart, BookOpen, User, Search } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';

const FacultySupervisionDetail = () => {
  const { facultyId } = useParams();
  const [faculty, setFaculty] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [facultyId]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, semesterFilter, yearFilter, assignments]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch faculty details
      const userRes = await client.get(`/users/manage/${facultyId}/`);
      setFaculty(userRes.data);

      // Fetch assignments
      const asgnRes = await client.get('/evaluations/assignments/');
      const filtered = asgnRes.data.filter(a => a.faculty === parseInt(facultyId));
      setAssignments(filtered);
      setFilteredAssignments(filtered);
    } catch (err) {
      console.error('Failed to fetch faculty supervision data');
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

  if (!faculty) return <Typography>Faculty not found.</Typography>;

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            component="button" 
            variant="body2" 
            onClick={() => navigate('/supervision')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Back to Supervision
          </Link>
          <Typography variant="body2" color="text.primary">Faculty Profile</Typography>
        </Breadcrumbs>

        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 800 }}>
              {faculty.first_name[0]}
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={800} gutterBottom>
                {faculty.first_name} {faculty.last_name}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body1" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <User size={18} /> {faculty.email}
                </Typography>
                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                <Chip 
                  label={faculty.role} 
                  size="small" 
                  color="primary" 
                  sx={{ fontWeight: 700, borderRadius: 1 }} 
                />
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BookOpen size={24} color="#6366f1" /> Course Assignment History
        </Typography>
      </Box>

      {/* Filters Section */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 4, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder="Search by course code or name..."
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

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, py: 2 }}>Course Code</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Course Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Section / Batch</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Academic Session</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>Faculty Report</TableCell>
              <TableCell align="center" sx={{ fontWeight: 800 }}>Course Report</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAssignments.length > 0 ? filteredAssignments.map((asgn) => (
              <TableRow key={asgn.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                <TableCell sx={{ fontWeight: 800, color: 'primary.main' }}>
                  {asgn.evaluation_instance_details.course_details.code}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {asgn.evaluation_instance_details.course_details.name}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={asgn.evaluation_instance_details.batch_name} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontWeight: 700, borderRadius: 1.5 }} 
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {asgn.evaluation_instance_details.semester} {asgn.evaluation_instance_details.year}
                </TableCell>
                <TableCell align="center">
                  <Button 
                    variant="contained" 
                    size="small" 
                    startIcon={<FileText size={14} />}
                    onClick={() => navigate(`/reports/${asgn.id}`)}
                    disabled={!asgn.processed_data}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                  >
                    {asgn.processed_data ? "View Analytics" : "Pending"}
                  </Button>
                </TableCell>
                <TableCell align="center">
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<BarChart size={14} />}
                    onClick={() => navigate(`/course-reports/${asgn.evaluation_instance}`)}
                    disabled={!asgn.evaluation_instance_details.course_processed_data}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                  >
                    {asgn.evaluation_instance_details.course_processed_data ? "View Course" : "Pending"}
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">No courses found for this faculty member.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default FacultySupervisionDetail;
