import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ControlPanel from './pages/ControlPanel';
import Evaluations from './pages/Evaluations';
import EvaluationDetail from './pages/EvaluationDetail';
import FacultyReport from './pages/FacultyReport';
import Dashboard from './pages/Dashboard';
import MyReports from './pages/MyReports';
import Supervision from './pages/Supervision';
import FacultySupervisionDetail from './pages/FacultySupervisionDetail';


import RoleBasedRedirect from './components/RoleBasedRedirect';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/change-password" element={<ChangePassword />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<RoleBasedRedirect />} />
              
              <Route path="my-reports" element={
                <ProtectedRoute roles={['FACULTY']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              <Route path="my-ai-insights" element={
                <ProtectedRoute roles={['FACULTY']}>
                  <MyReports />
                </ProtectedRoute>
              } />

              <Route path="evaluations" element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <Evaluations />
                </ProtectedRoute>
              } />
              <Route path="evaluations/:id" element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <EvaluationDetail />
                </ProtectedRoute>
              } />
              <Route path="reports/:assignmentId" element={
                <ProtectedRoute>
                  <FacultyReport />
                </ProtectedRoute>
              } />
              <Route path="course-reports/:id" element={
                <ProtectedRoute>
                  <FacultyReport isCourseReport={true} />
                </ProtectedRoute>
              } />
              <Route path="control-panel" element={
                <ProtectedRoute roles={['ADMIN', 'MANAGER']}>
                  <ControlPanel />
                </ProtectedRoute>
              } />
              <Route path="supervision" element={
                <ProtectedRoute roles={['PROGRAM_SUPERVISOR', 'SUPERVISOR']}>
                  <Supervision />
                </ProtectedRoute>
              } />
              <Route path="supervision/faculty/:facultyId" element={
                <ProtectedRoute roles={['PROGRAM_SUPERVISOR', 'SUPERVISOR']}>
                  <FacultySupervisionDetail />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
