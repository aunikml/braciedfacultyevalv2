import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, Grid, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, Card, CardContent,
  Divider, CircularProgress, Button, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ArrowLeft, Download, FileText, User, Book, Calendar, Users } from 'lucide-react';
import client from '../api/client';
import FacultyAIInsights from '../components/FacultyAIInsights';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const CriteriaChart = ({ criteria, counts }) => {
  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));
  
  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%' }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, minHeight: 40, lineHeight: 1.2 }}>
        {criteria}
      </Typography>
      <Box sx={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, justifyContent: 'center' }}>
          {chartData.map((entry, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>{entry.name}: {entry.value}</Typography>
              </Box>
          ))}
      </Box>
    </Paper>
  );
};

const FacultyReport = ({ isCourseReport = false }) => {
  const { assignmentId, id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReport();
  }, [assignmentId, id]);

  const fetchReport = async () => {
    const endpoint = isCourseReport 
      ? `/evaluations/instances/${id}/` 
      : `/evaluations/assignments/${assignmentId}/`;
    const res = await client.get(endpoint);
    setData(res.data);
    setLoading(false);
  };

  if (loading) return <CircularProgress />;
  
  const reportData = isCourseReport ? data.course_processed_data : data.processed_data;
  const headerData = isCourseReport ? data : data.evaluation_instance_details;
  const facultyDetails = isCourseReport ? null : data.faculty_details;

  if (!reportData) return (
    <Container sx={{ mt: 4 }}>
      <Alert severity="warning">No processed data found. Please upload a CSV first.</Alert>
      <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ pb: 8 }}>
      <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)} sx={{ mb: 3 }}>
        Back
      </Button>

      {/* Header Section */}
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', mb: 4, bgcolor: '#f8fafc' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h3" fontWeight={800} color="primary" gutterBottom>
              {isCourseReport ? 'Course Evaluation Report' : 'Faculty Evaluation Report'}
            </Typography>
            {!isCourseReport && (
              <Typography variant="h5" fontWeight={600} gutterBottom>
                {facultyDetails.first_name} {facultyDetails.last_name}
              </Typography>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Book size={18} color="#64748b" />
                <Typography color="text.secondary">
                  {headerData?.course_details?.code}: {headerData?.course_details?.name}
                </Typography>
              </Grid>
              <Grid item sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                <Calendar size={18} color="#64748b" />
                <Typography color="text.secondary">
                  {headerData?.semester} {headerData?.year}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: { md: 'flex-end' }, justifyContent: 'center' }}>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center', minWidth: 150 }}>
              <Users size={24} color="#6366f1" />
              <Typography variant="h4" fontWeight={800}>{reportData.total_respondents}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 700 }}>Respondents</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {!isCourseReport && <FacultyAIInsights assignmentId={assignmentId} />}

      {/* Summary Score Cards */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ 
            bgcolor: 'primary.main', color: 'white', borderRadius: 4, 
            textAlign: 'center', p: 3, height: '100%', 
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.2)'
          }}>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5 }}>
              {reportData.totals.raw_total || reportData.totals.total_score || '0'}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, letterSpacing: 1 }}>
              TOTAL (OUT OF {reportData.totals.total_max || (isCourseReport ? 20 : 40)})
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ 
            bgcolor: 'secondary.main', color: 'white', borderRadius: 4, 
            textAlign: 'center', p: 3, height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(236, 72, 153, 0.2)'
          }}>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5 }}>
              {reportData.totals.scaled_total || reportData.totals.bracu_standard_score || '0'}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, letterSpacing: 1 }}>
              BRACU STANDARD ({reportData.totals.scaled_max || (isCourseReport ? 15 : 60)})
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ 
            border: '2px solid #6366f1', borderRadius: 4, 
            textAlign: 'center', p: 3, height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            bgcolor: 'white'
          }}>
            <Typography variant="h3" fontWeight={800} color="primary" sx={{ mb: 0.5 }}>
              {reportData.totals.avg_of_avgs || reportData.totals.average_score || '0'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1 }}>AVG SCORE (1-5)</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Detailed Charts Section */}
        <Grid item xs={12} md={8}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Response Distribution per Criteria</Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 3 
          }}>
            {reportData.response_counts_per_criteria.map((item, index) => (
              <CriteriaChart key={index} criteria={item.criteria} counts={item.counts} />
            ))}
          </Box>

          {/* Comments Section */}
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>General Comments</Typography>
            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
              {reportData.comments.map((comment, i) => (
                <Box key={i} sx={{ p: 2, mb: 2, bgcolor: '#f1f5f9', borderRadius: 3, borderLeft: '4px solid #6366f1' }}>
                  <Typography variant="body2">{comment}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Scores Table Section */}
        <Grid item xs={12} md={4}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 3 }}>Evaluation Scores</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 4 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Criteria</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Avg</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.criteria_scores.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ fontSize: '0.75rem', py: 2 }}>{row.criteria}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'primary.main' }}>{row.average}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default FacultyReport;
