import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );

  if (!user) return <Navigate to="/login" replace />;

  const roles = user.roles?.map(r => r.name) || [user.role];

  // Faculty always lands on My Reports
  if (roles.includes('FACULTY')) {
    return <Navigate to="/my-reports" replace />;
  }

  // Supervisors land on Supervision
  if (roles.includes('PROGRAM_SUPERVISOR') || roles.includes('SUPERVISOR')) {
    return <Navigate to="/supervision" replace />;
  }

  // Admins/Managers land on Evaluations or Control Panel
  if (roles.includes('ADMIN') || roles.includes('MANAGER')) {
    return <Navigate to="/evaluations" replace />;
  }

  return <Navigate to="/my-reports" replace />;
};

export default RoleBasedRedirect;
