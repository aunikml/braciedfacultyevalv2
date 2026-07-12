import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Container, Typography, Paper, Grid, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Divider, CircularProgress, Button, Alert
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, Download, Book, Calendar, Users } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import client from '../api/client';


const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#f97316', '#ef4444'];
const LABEL_MAP = { '5': 'Excellent', '4': 'Good', '3': 'Fair', '2': 'Poor', '1': 'Very Poor' };
const RADIAN = Math.PI / 180;

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fontFamily="Inter, sans-serif">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, percent } = payload[0].payload;
  return (
    <Paper elevation={3} sx={{ p: 1.5, borderRadius: 2 }}>
      <Typography variant="caption" fontWeight={700}>{LABEL_MAP[name] || name}</Typography>
      <Typography variant="body2">{value} respondents ({(percent * 100).toFixed(1)}%)</Typography>
    </Paper>
  );
};

const CriteriaChart = ({ criteria, counts, index }) => {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const chartData = Object.entries(counts)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value, percent: total > 0 ? value / total : 0 }));

  if (chartData.length === 0) return null;

  const sorted = [...chartData].sort((a, b) => Number(b.name) - Number(a.name));
  const topLabel = sorted[0];

  return (
    <Paper
      elevation={0}
      className="report-chart-card"
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'white',
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <Typography
        variant="subtitle2"
        fontWeight={700}
        sx={{ mb: 0.5, lineHeight: 1.3, fontSize: '0.85rem', color: '#1e293b' }}
      >
        {criteria}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.7rem' }}>
        {total} respondents · Top: {LABEL_MAP[topLabel.name] || topLabel.name} ({topLabel.value})
      </Typography>
      <Box sx={{ height: 220, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%" cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderLabel}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={COLORS[Number(entry.name) - 1] || COLORS[i % COLORS.length]}
                  stroke="white"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
        {chartData.map((entry) => (
          <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: 1, bgcolor: COLORS[Number(entry.name) - 1] || COLORS[0], flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, minWidth: 50, color: '#475569' }}>
              {LABEL_MAP[entry.name] || entry.name}
            </Typography>
            <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: '#f1f5f9', overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${entry.percent * 100}%`, bgcolor: COLORS[Number(entry.name) - 1] || COLORS[0], borderRadius: 3 }} />
            </Box>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', minWidth: 24, textAlign: 'right' }}>
              {entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

const sectionHeadingSx = {
  fontSize: '1.15rem',
  fontWeight: 700,
  color: '#1e293b',
  mb: 2,
  pb: 1,
  borderBottom: '2px solid #e2e8f0',
};

const FacultyReport = ({ isCourseReport = false }) => {
  const { assignmentId, id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const endpoint = isCourseReport
        ? `/evaluations/instances/${id}/`
        : `/evaluations/assignments/${assignmentId}/`;
      const res = await client.get(endpoint);
      if (!cancelled) {
        setData(res.data);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [assignmentId, id, isCourseReport]);

  if (loading) return <CircularProgress />;

  const reportData = isCourseReport ? data.course_processed_data : data.processed_data;
  const headerData = isCourseReport ? data : data.evaluation_instance_details;
  const facultyDetails = isCourseReport ? null : data.faculty_details;

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !reportData) return;
    setDownloading(true);
    try {
      const el = reportRef.current;
      el.classList.add('pdf-capture');
      await new Promise((r) => setTimeout(r, 100));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      el.classList.remove('pdf-capture');

      const margin = 12;
      const pageWidth = 210;
      const pageHeight = 297;
      const contentWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const usablePageHeight = pageHeight - margin * 2;
      let position = 0;

      if (imgHeight <= usablePageHeight) {
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, imgHeight);
      } else {
        while (position < imgHeight) {
          if (position > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, margin - position, contentWidth, imgHeight);
          position += usablePageHeight;
        }
      }

      const title = isCourseReport
        ? 'CourseReport'
        : `FacultyReport_${facultyDetails?.first_name || ''}_${facultyDetails?.last_name || ''}`.trim();
      pdf.save(`${title}_${headerData?.course_details?.code || ''}_${headerData?.semester || ''}_${headerData?.year || ''}.pdf`.replace(/\s+/g, '_'));
    } catch (err) {
      console.error('PDF generation failed', err);
    } finally {
      setDownloading(false);
    }
  };

  if (!reportData) return (
    <Container sx={{ mt: 4 }}>
      <Alert severity="warning">No processed data found. Please upload a CSV first.</Alert>
      <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
    </Container>
  );

  const totalMax = reportData.totals.total_max || (isCourseReport ? 20 : 40);
  const scaledMax = reportData.totals.scaled_max || (isCourseReport ? 15 : 60);
  const totalStudents = headerData?.total_students || 0;
  const responseRate = totalStudents > 0 ? ((reportData.total_respondents / totalStudents) * 100).toFixed(1) : null;

  return (
    <Container maxWidth="lg" sx={{ pb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowLeft size={18} />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download size={18} />}
          onClick={handleDownloadPDF}
          disabled={downloading}
          sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
        >
          {downloading ? 'Generating...' : 'Download PDF'}
        </Button>
      </Box>

      <Box ref={reportRef} className="report-root" sx={{ bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }}>

        {/* ===== HEADER ===== */}
        <Box sx={{ p: { xs: 3, sm: 4 }, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#6366f1', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
                {isCourseReport ? 'Course Evaluation Report' : 'Faculty Evaluation Report'}
              </Typography>
              {!isCourseReport && (
                <Typography variant="h5" fontWeight={600} sx={{ mb: 1.5, color: '#1e293b', fontSize: '1.15rem' }}>
                  {facultyDetails.first_name} {facultyDetails.last_name}
                </Typography>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Book size={15} color="#64748b" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    {headerData?.course_details?.code}: {headerData?.course_details?.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Calendar size={15} color="#64748b" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    {headerData?.semester} {headerData?.year}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Box sx={{
                p: 2, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0',
                textAlign: 'center', minWidth: 140
              }}>
                <Users size={22} color="#6366f1" style={{ marginBottom: 4 }} />
                <Typography variant="h4" fontWeight={800} sx={{ lineHeight: 1.1 }}>{reportData.total_respondents}</Typography>
                {responseRate !== null && (
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#6366f1', mt: 0.25 }}>
                    ({responseRate}%)
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.65rem' }}>
                  Respondents
                </Typography>
                {totalStudents > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem', mt: 0.25 }}>
                    of {totalStudents} enrolled
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* ===== SUMMARY SCORE CARDS ===== */}
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{
                bgcolor: '#6366f1', color: 'white', borderRadius: 3,
                textAlign: 'center', py: 3, px: 2, height: 110,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <Typography variant="h3" fontWeight={800} sx={{ mb: 0.25, lineHeight: 1 }}>
                  {reportData.totals.raw_total || reportData.totals.total_score || '0'}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, letterSpacing: 1, fontSize: '0.6rem' }}>
                  TOTAL (OUT OF {totalMax})
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{
                bgcolor: '#ec4899', color: 'white', borderRadius: 3,
                textAlign: 'center', py: 3, px: 2, height: 110,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <Typography variant="h3" fontWeight={800} sx={{ mb: 0.25, lineHeight: 1 }}>
                  {reportData.totals.scaled_total || reportData.totals.bracu_standard_score || '0'}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.9, letterSpacing: 1, fontSize: '0.6rem' }}>
                  BRACU STANDARD (OUT OF {scaledMax})
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={0} sx={{
                border: '2px solid #6366f1', borderRadius: 3,
                textAlign: 'center', py: 3, px: 2, height: 110,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                bgcolor: 'white',
              }}>
                <Typography variant="h3" fontWeight={800} color="primary" sx={{ mb: 0.25, lineHeight: 1 }}>
                  {reportData.totals.avg_of_avgs || reportData.totals.average_score || '0'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 1, fontSize: '0.6rem' }}>
                  AVG SCORE (1–5)
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* ===== RESPONSE DISTRIBUTION CHARTS ===== */}
        <Box sx={{ px: { xs: 3, sm: 4 }, pb: { xs: 3, sm: 4 } }}>
          <Typography sx={sectionHeadingSx}>Response Distribution per Criteria</Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr' },
            gap: 2,
          }}>
            {reportData.response_counts_per_criteria.map((item, index) => (
              <CriteriaChart key={index} index={index} criteria={item.criteria} counts={item.counts} />
            ))}
          </Box>
        </Box>

        <Divider sx={{ mx: { xs: 3, sm: 4 } }} />

        {/* ===== EVALUATION SCORES TABLE + COMMENTS ===== */}
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          <Grid container spacing={4}>
            {/* Scores Table */}
            <Grid item xs={12} md={4}>
              <Typography sx={sectionHeadingSx}>Evaluation Scores</Typography>
              <TableContainer elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '14px', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                        Criteria
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '14px', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>
                        Avg
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.criteria_scores.map((row, i) => (
                      <TableRow
                        key={i}
                        sx={{
                          bgcolor: i % 2 === 0 ? 'white' : '#f8fafc',
                          '&:last-child td': { borderBottom: 0 },
                        }}
                      >
                        <TableCell sx={{ fontSize: '14px', py: 1.5, color: '#334155', borderBottom: '1px solid #f1f5f9' }}>
                          {row.criteria}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: 800,
                            fontSize: '14px',
                            color: '#6366f1',
                            py: 1.5,
                            borderBottom: '1px solid #f1f5f9',
                          }}
                        >
                          {row.average}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Comments */}
            <Grid item xs={12} md={8}>
              <Typography sx={sectionHeadingSx}>General Comments</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {reportData.comments.map((comment, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 2,
                      bgcolor: '#f8fafc',
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      borderLeft: '3px solid #6366f1',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '14px', color: '#334155', lineHeight: 1.7 }}>
                      {comment}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

      </Box>
    </Container>
  );
};

export default FacultyReport;
