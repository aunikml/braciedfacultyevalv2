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

  const roles = user.roles?.length ? user.roles : [user.role];

  // Supervisory roles take priority over faculty
  if (roles.includes('PROGRAM_SUPERVISOR')) {
    return <Navigate to="/program-dashboard" replace />;
  }
  if (roles.includes('SUPERVISOR')) {
    return <Navigate to="/supervision" replace />;
  }
  if (roles.includes('ADMIN') || roles.includes('MANAGER')) {
    return <Navigate to="/evaluations" replace />;
  }
  if (roles.includes('FACULTY')) {
    return <Navigate to="/my-reports" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default RoleBasedRedirect;
