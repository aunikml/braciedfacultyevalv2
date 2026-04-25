import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Button, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Modal, TextField, MenuItem, Alert, CircularProgress 
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { UserPlus, Upload, FileText, Trash2, ArrowLeft } from 'lucide-react';
import client from '../api/client';

const style = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 450, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 4,
};

const EvaluationDetail = () => {
  const { id } = useParams();
  const [instance, setInstance] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstance();
    fetchFaculties();
  }, [id]);

  const fetchInstance = async () => {
    const res = await client.get(`/evaluations/instances/${id}/`);
    setInstance(res.data);
    setLoading(false);
  };

  const fetchFaculties = async () => {
    const res = await client.get('/users/manage/');
    setFaculties(res.data.filter(u => u.role === 'FACULTY' || u.role === 'ADMIN'));
  };

  const handleAssignFaculty = async () => {
    try {
      await client.post('/evaluations/assignments/', {
        evaluation_instance: id,
        faculty: selectedFaculty
      });
      setModalOpen(false);
      fetchInstance();
    } catch (err) {
      alert('Faculty already assigned or error occurred');
    }
  };

  const handleFileUpload = async (assignmentId, file) => {
    const formData = new FormData();
    formData.append('csv_file', file);
    try {
      await client.post(`/evaluations/assignments/${assignmentId}/upload-csv/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchInstance();
    } catch (err) {
      alert('Error uploading file');
    }
  };

  const handleCourseFileUpload = async (file) => {
    const formData = new FormData();
    formData.append('csv_file', file);
    try {
      await client.post(`/evaluations/instances/${id}/upload-course-csv/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchInstance();
    } catch (err) {
      alert('Error uploading course file');
    }
  };

  const handleDeleteAssignment = async (aId) => {
    if(window.confirm('Remove this faculty assignment?')) {
      await client.delete(`/evaluations/assignments/${aId}/`);
      fetchInstance();
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Container maxWidth="lg">
      <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate('/evaluations')} sx={{ mb: 3 }}>
        Back to Evaluations
      </Button>

      <Paper sx={{ p: 4, borderRadius: 4, mb: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight={800}>{instance.course_details.code}: {instance.course_details.name}</Typography>
            <Typography variant="h6">{instance.semester} {instance.year} - {instance.batch_name} ({instance.program_details.short_name})</Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.8, fontWeight: 700 }}>COURSE EVALUATION DATA</Typography>
            <input
              accept=".csv" style={{ display: 'none' }} id="course-upload" type="file"
              onChange={(e) => handleCourseFileUpload(e.target.files[0])}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <label htmlFor="course-upload">
                <Button variant="contained" component="span" size="small" color="secondary" startIcon={<Upload size={16} />}>
                  {instance.course_processed_data ? 'Update Course CSV' : 'Upload Course CSV'}
                </Button>
              </label>
              {instance.course_processed_data && (
                <Button variant="contained" size="small" sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#f1f5f9' } }} 
                  startIcon={<FileText size={16} />} onClick={() => navigate(`/course-reports/${id}`)}>
                  View Course Report
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700}>Faculty Assignments</Typography>
        <Button variant="contained" startIcon={<UserPlus size={18} />} onClick={() => setModalOpen(true)}>
          Assign Faculty
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Faculty Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Respondents</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {instance.assignments.map((asgn) => (
              <TableRow key={asgn.id} hover>
                <TableCell>{asgn.faculty_details.first_name} {asgn.faculty_details.last_name}</TableCell>
                <TableCell>{asgn.total_respondents}</TableCell>
                <TableCell>
                  {asgn.processed_data ? (
                    <Typography variant="caption" color="success.main" fontWeight={600}>PROCESSED</Typography>
                  ) : (
                    <Typography variant="caption" color="warning.main">WAITING FOR CSV</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <input
                    accept=".csv" style={{ display: 'none' }} id={`upload-${asgn.id}`} type="file"
                    onChange={(e) => handleFileUpload(asgn.id, e.target.files[0])}
                  />
                  <label htmlFor={`upload-${asgn.id}`}>
                    <Tooltip title="Upload CSV">
                      <IconButton component="span" color="primary">
                        <Upload size={18} />
                      </IconButton>
                    </Tooltip>
                  </label>
                  {asgn.processed_data && (
                    <IconButton color="success" onClick={() => navigate(`/reports/${asgn.id}`)}>
                      <FileText size={18} />
                    </IconButton>
                  )}
                  <IconButton color="error" onClick={() => handleDeleteAssignment(asgn.id)}>
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={style}>
          <Typography variant="h6" mb={3}>Assign Faculty</Typography>
          <TextField select label="Faculty Member" fullWidth value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)} margin="normal">
            {faculties.map(f => <MenuItem key={f.id} value={f.id}>{f.first_name} {f.last_name} ({f.email})</MenuItem>)}
          </TextField>
          <Button fullWidth variant="contained" sx={{ mt: 3, py: 1.5 }} onClick={handleAssignFaculty}>Assign</Button>
        </Box>
      </Modal>
    </Container>
  );
};

const Tooltip = ({ title, children }) => (
  <Box sx={{ display: 'inline-block' }}>{children}</Box>
);

export default EvaluationDetail;
