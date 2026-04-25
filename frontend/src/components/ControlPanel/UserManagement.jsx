import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Typography, 
  Modal, 
  TextField, 
  MenuItem,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { UserPlus, Edit2, Trash2, RotateCcw } from 'lucide-react';
import client from '../../api/client';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 4,
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    roles: ['FACULTY'],
    assigned_program: ''
  });
  const [programs, setPrograms] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const response = await client.get('/academic/programs/');
      setPrograms(response.data);
    } catch (err) {
      console.error('Failed to fetch programs');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await client.get('/users/manage/');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditUser(user);
      setFormData({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: user.roles || [user.role],
        assigned_program: user.assigned_program || ''
      });
    } else {
      setEditUser(null);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        roles: ['FACULTY'],
        assigned_program: ''
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await client.put(`/users/manage/${editUser.id}/`, formData);
      } else {
        await client.post('/users/manage/', formData);
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.email?.[0] || 'Operation failed');
    }
  };

  const handleDelete = (id) => {
    setTimeout(async () => {
      try {
        await client.delete(`/users/manage/${id}/`);
        fetchUsers();
        alert('User deleted successfully');
      } catch (err) {
        setError('Failed to delete user');
        alert('Delete failed: ' + (err.response?.data?.detail || err.message));
      }
    }, 100);
  };

  const handleResetPassword = async (id) => {
    try {
      const response = await client.post(`/users/manage/${id}/reset-password/`);
      alert(response.data.message);
    } catch (err) {
      setError('Failed to reset password');
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700}>User Management</Typography>
        <Button 
          variant="contained" 
          startIcon={<UserPlus size={18} />}
          onClick={() => handleOpenModal()}
        >
          Add User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Roles</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.first_name} {user.last_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(user.roles || [user.role]).map((r, idx) => (
                      <Typography key={idx} variant="body2" sx={{ 
                        px: 1, py: 0.5, borderRadius: 1,
                        bgcolor: 'primary.light', color: 'primary.main', fontSize: '0.7rem', fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {r.replace('_', ' ')}
                      </Typography>
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  {user.must_change_password ? 
                    <Typography variant="caption" color="warning.main">Pending Pwd Change</Typography> : 
                    <Typography variant="caption" color="success.main">Active</Typography>
                  }
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Reset Password">
                    <IconButton onClick={() => handleResetPassword(user.id)} color="warning">
                      <RotateCcw size={18} />
                    </IconButton>
                  </Tooltip>
                  <IconButton onClick={() => handleOpenModal(user)} color="primary">
                    <Edit2 size={18} />
                  </IconButton>
                  <IconButton 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(user.id);
                    }} 
                    color="error"
                  >
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
          <Typography variant="h6" mb={3}>{editUser ? 'Edit User' : 'Add New User'}</Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
              required
              disabled={!!editUser}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                fullWidth
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                label="Last Name"
                fullWidth
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                margin="normal"
                required
              />
            </Box>
            <TextField
              select
              fullWidth
              label="Roles"
              SelectProps={{
                multiple: true,
                renderValue: (selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )
              }}
              value={formData.roles}
              onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
              margin="normal"
              required
            >
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
              <MenuItem value="FACULTY">Faculty Member</MenuItem>
              <MenuItem value="PROGRAM_SUPERVISOR">Program Supervisor</MenuItem>
              <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
            </TextField>

            {formData.roles.includes('PROGRAM_SUPERVISOR') && (
              <TextField
                select
                label="Assigned Program"
                value={formData.assigned_program}
                onChange={(e) => setFormData({ ...formData, assigned_program: e.target.value })}
                margin="normal"
                required
              >
                {programs.map((prog) => (
                  <MenuItem key={prog.id} value={prog.id}>
                    {prog.full_name} ({prog.short_name})
                  </MenuItem>
                ))}
              </TextField>
            )}
            <Button 
              fullWidth 
              variant="contained" 
              type="submit" 
              sx={{ mt: 4, py: 1.5 }}
            >
              {editUser ? 'Update User' : 'Create User'}
            </Button>
          </form>
        </Box>
      </Modal>
    </Box>
  );
};

export default UserManagement;
