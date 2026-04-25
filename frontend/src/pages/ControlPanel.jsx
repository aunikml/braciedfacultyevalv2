import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper 
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import UserManagement from '../components/ControlPanel/UserManagement';
import AcademicManagement from '../components/ControlPanel/AcademicManagement';
import SystemSettings from '../components/ControlPanel/SystemSettings';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`control-tabpanel-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </Box>
    )}
  </div>
);

const ControlPanel = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          Control Panel
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage system users, academic programs, courses, and batch categories.
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ bgcolor: 'transparent' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 600, fontSize: '1rem', mr: 2 }
          }}
        >
          <Tab label="User Management" />
          <Tab label="Programs & Courses" />
          <Tab label="System Settings" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <UserManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <AcademicManagement />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <SystemSettings />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ControlPanel;
