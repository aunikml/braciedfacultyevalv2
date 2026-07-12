import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, IconButton, Typography, Modal, TextField, MenuItem,
  Alert, Tooltip, CircularProgress, Chip, Stack, Avatar, InputAdornment,
  TableSortLabel
} from '@mui/material';
import { UserPlus, Edit2, Trash2, RotateCcw, Upload, FileSpreadsheet, Search, ArrowUpDown, Users } from 'lucide-react';
import client from '../../api/client';

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: { xs: '95%', sm: 520 }, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 4,
};

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'FACULTY', label: 'Faculty Member' },
  { value: 'PROGRAM_SUPERVISOR', label: 'Program Supervisor' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
];

const ROLE_COLORS = {
  ADMIN: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  MANAGER: { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  FACULTY: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  PROGRAM_SUPERVISOR: { bg: '#fefce8', color: '#ca8a04', border: '#fef08a' },
  SUPERVISOR: { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
};

const getInitials = (first, last) => `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase();

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', first_name: '', last_name: '', roles: ['FACULTY'], assigned_program: '' });
  const [programs, setPrograms] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('last_name');
  const [sortDir, setSortDir] = useState('asc');

  // Bulk upload
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkRole, setBulkRole] = useState('FACULTY');
  const [bulkProgram, setBulkProgram] = useState('');
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const bulkFileRef = useRef(null);

  useEffect(() => { fetchUsers(); fetchPrograms(); }, []);

  const fetchPrograms = async () => {
    try { const r = await client.get('/academic/programs/'); setPrograms(r.data); } catch {}
  };

  const fetchUsers = async () => {
    try { const r = await client.get('/users/manage/'); setUsers(r.data); }
    catch { setError('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditUser(user);
      setFormData({ email: user.email, first_name: user.first_name, last_name: user.last_name, roles: user.roles || [user.role], assigned_program: user.assigned_program || '' });
    } else {
      setEditUser(null);
      setFormData({ email: '', first_name: '', last_name: '', roles: ['FACULTY'], assigned_program: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) await client.put(`/users/manage/${editUser.id}/`, formData);
      else await client.post('/users/manage/', formData);
      setModalOpen(false);
      fetchUsers();
    } catch (err) { setError(err.response?.data?.email?.[0] || 'Operation failed'); }
  };

  const handleDelete = (id) => {
    setTimeout(async () => {
      try {
        await client.delete(`/users/manage/${id}/`);
        fetchUsers();
        alert('User deleted successfully');
      } catch (err) { setError('Failed to delete user'); }
    }, 100);
  };

  const handleResetPassword = async (id) => {
    try { const r = await client.post(`/users/manage/${id}/reset-password/`); alert(r.data.message); }
    catch { setError('Failed to reset password'); }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkUploading(true); setBulkResult(null); setError('');
    const payload = new FormData();
    payload.append('csv_file', bulkFile);
    payload.append('role', bulkRole);
    if (bulkRole === 'PROGRAM_SUPERVISOR' && bulkProgram) payload.append('assigned_program', bulkProgram);
    try {
      const r = await client.post('/users/manage/bulk-upload/', payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      setBulkResult(r.data); fetchUsers();
    } catch (err) { setError(err.response?.data?.error || 'Bulk upload failed'); }
    finally { setBulkUploading(false); }
  };

  const handleBulkClose = () => {
    setBulkOpen(false); setBulkFile(null); setBulkRole('FACULTY'); setBulkProgram(''); setBulkResult(null);
    if (bulkFileRef.current) bulkFileRef.current.value = '';
  };

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        `${u.first_name} ${u.last_name} ${u.email} ${(u.roles || [u.role] || []).join(' ')}`.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'name') { aVal = `${a.first_name} ${a.last_name}`.toLowerCase(); bVal = `${b.first_name} ${b.last_name}`.toLowerCase(); }
      else if (sortField === 'email') { aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); }
      else if (sortField === 'role') { aVal = (a.roles?.[0] || a.role || '').toLowerCase(); bVal = (b.roles?.[0] || b.role || '').toLowerCase(); }
      else { aVal = String(a[sortField] || '').toLowerCase(); bVal = String(b[sortField] || '').toLowerCase(); }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, search, sortField, sortDir]);

  const roleCounts = useMemo(() => {
    const counts = {};
    users.forEach(u => {
      const roles = u.roles || [u.role];
      roles.forEach(r => { counts[r] = (counts[r] || 0) + 1; });
    });
    return counts;
  }, [users]);

  if (loading) return <CircularProgress />;

  const SortHead = ({ field, children, sx }) => (
    <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, ...sx }}>
      <TableSortLabel active={sortField === field} direction={sortField === field ? sortDir : 'asc'} onClick={() => handleSort(field)}>
        {children}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>User Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {users.length} total users
            {Object.entries(roleCounts).map(([r, c]) => (
              <Chip key={r} label={`${c} ${r.replace('_', ' ')}`} size="small" sx={{
                ml: 0.75, height: 20, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                bgcolor: ROLE_COLORS[r]?.bg || '#f1f5f9', color: ROLE_COLORS[r]?.color || '#475569',
                border: `1px solid ${ROLE_COLORS[r]?.border || '#e2e8f0'}`,
              }} />
            ))}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" startIcon={<Upload size={18} />} onClick={() => setBulkOpen(true)} sx={{ borderRadius: 2, textTransform: 'none' }}>
            Bulk Upload
          </Button>
          <Button variant="contained" startIcon={<UserPlus size={18} />} onClick={() => handleOpenModal()}>
            Add User
          </Button>
        </Stack>
      </Box>

      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <TextField
          size="small" placeholder="Search users by name, email, or role..." value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ bgcolor: 'white', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} color="#94a3b8" /></InputAdornment> } }}
        />
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <SortHead field="name" sx={{ width: '25%' }}>User</SortHead>
              <SortHead field="email" sx={{ width: '25%' }}>Email</SortHead>
              <SortHead field="role" sx={{ width: '25%' }}>Role</SortHead>
              <SortHead field="must_change_password" sx={{ width: '12%' }}>Status</SortHead>
              <TableCell sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Users size={40} color="#cbd5e1" style={{ marginBottom: 8 }} />
                  <Typography color="text.secondary" fontWeight={600}>
                    {search ? 'No users match your search' : 'No users found'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredUsers.map((user) => {
              const roles = user.roles || [user.role];
              const rc = ROLE_COLORS[roles[0]] || ROLE_COLORS.FACULTY;
              return (
                <TableRow key={user.id} hover sx={{ '&:last-child td': { borderBottom: 0 }, transition: 'background 0.15s' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: rc.color, color: 'white', fontSize: '0.75rem', fontWeight: 800 }}>
                        {getInitials(user.first_name, user.last_name)}
                      </Avatar>
                      <Typography fontWeight={600} fontSize="0.875rem">
                        {user.first_name} {user.last_name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontSize="0.8125rem">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {roles.map((r, idx) => {
                        const c = ROLE_COLORS[r] || ROLE_COLORS.FACULTY;
                        return (
                          <Chip key={idx} label={r.replace('_', ' ')} size="small" sx={{
                            height: 22, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                            bgcolor: c.bg, color: c.color, border: `1px solid ${c.border}`,
                          }} />
                        );
                      })}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: user.must_change_password ? '#f59e0b' : '#10b981' }} />
                      <Typography variant="body2" fontWeight={600} fontSize="0.8125rem" color={user.must_change_password ? '#b45309' : '#059669'}>
                        {user.must_change_password ? 'Pending' : 'Active'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Reset Password" arrow>
                        <IconButton size="small" onClick={() => handleResetPassword(user.id)} sx={{ color: '#f59e0b', '&:hover': { bgcolor: '#fef3c7' } }}>
                          <RotateCcw size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit" arrow>
                        <IconButton size="small" onClick={() => handleOpenModal(user)} sx={{ color: '#6366f1', '&:hover': { bgcolor: '#eef2ff' } }}>
                          <Edit2 size={15} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete" arrow>
                        <IconButton size="small" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(user.id); }} sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}>
                          <Trash2 size={15} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredUsers.length > 0 && filteredUsers.length < users.length && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block', fontWeight: 600 }}>
          Showing {filteredUsers.length} of {users.length} users
        </Typography>
      )}

      {/* Single User Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={3} fontWeight={700}>{editUser ? 'Edit User' : 'Add New User'}</Typography>
          <form onSubmit={handleSubmit}>
            <TextField label="Email" fullWidth value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} margin="normal" required disabled={!!editUser} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="First Name" fullWidth value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} margin="normal" required />
              <TextField label="Last Name" fullWidth value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} margin="normal" required />
            </Box>
            <TextField
              select fullWidth label="Roles" margin="normal" required value={formData.roles}
              onChange={(e) => setFormData({ ...formData, roles: e.target.value })}
              SelectProps={{ multiple: true, renderValue: (sel) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {sel.map(v => { const c = ROLE_COLORS[v] || ROLE_COLORS.FACULTY; return <Chip key={v} label={v.replace('_',' ')} size="small" sx={{ bgcolor: c.bg, color: c.color, border: `1px solid ${c.border}`, fontWeight: 600, fontSize: '0.7rem' }} />; })}
                </Box>
              )}}
            >
              {ROLE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </TextField>
            {formData.roles.includes('PROGRAM_SUPERVISOR') && (
              <TextField select label="Assigned Program" fullWidth value={formData.assigned_program} onChange={(e) => setFormData({ ...formData, assigned_program: e.target.value })} margin="normal" required>
                {programs.map(p => <MenuItem key={p.id} value={p.id}>{p.full_name} ({p.short_name})</MenuItem>)}
              </TextField>
            )}
            <Button fullWidth variant="contained" type="submit" sx={{ mt: 4, py: 1.5, borderRadius: 2, fontWeight: 700 }}>
              {editUser ? 'Update User' : 'Create User'}
            </Button>
          </form>
        </Box>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkOpen} onClose={handleBulkClose}>
        <Box sx={modalStyle}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <FileSpreadsheet size={24} color="#6366f1" />
            <Typography variant="h6" fontWeight={700}>Bulk Upload Users</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload a CSV with columns: <strong>email, first_name, last_name</strong>. Default password: <code>Password123!</code>
          </Typography>

          {bulkResult ? (
            <Box>
              <Alert severity={bulkResult.errors > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                <Typography variant="body2" fontWeight={700}>
                  {bulkResult.created} created, {bulkResult.skipped} skipped, {bulkResult.errors} error(s).
                </Typography>
              </Alert>
              {bulkResult.created_emails?.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="success.main">Created:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {bulkResult.created_emails.map(e => <Chip key={e} label={e} size="small" color="success" variant="outlined" />)}
                  </Box>
                </Box>
              )}
              {bulkResult.skipped_emails?.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="warning.main">Skipped:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {bulkResult.skipped_emails.map(e => <Chip key={e} label={e} size="small" color="warning" variant="outlined" />)}
                  </Box>
                </Box>
              )}
              {bulkResult.error_details?.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight={700} color="error.main">Errors:</Typography>
                  <Box component="ul" sx={{ mt: 0.5, pl: 2 }}>
                    {bulkResult.error_details.map((err, i) => <li key={i}><Typography variant="caption">{err}</Typography></li>)}
                  </Box>
                </Box>
              )}
              <Button fullWidth variant="outlined" onClick={handleBulkClose} sx={{ mt: 1 }}>Done</Button>
            </Box>
          ) : (
            <Box>
              <TextField select fullWidth label="Assign Role" value={bulkRole} onChange={(e) => setBulkRole(e.target.value)} margin="normal">
                {ROLE_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              {bulkRole === 'PROGRAM_SUPERVISOR' && (
                <TextField select fullWidth label="Assigned Program" value={bulkProgram} onChange={(e) => setBulkProgram(e.target.value)} margin="normal" required>
                  {programs.map(p => <MenuItem key={p.id} value={p.id}>{p.full_name} ({p.short_name})</MenuItem>)}
                </TextField>
              )}
              <Box sx={{
                mt: 3, p: 3, border: '2px dashed #cbd5e1', borderRadius: 3, textAlign: 'center', bgcolor: '#f8fafc',
                cursor: 'pointer', '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.02)' },
              }} onClick={() => bulkFileRef.current?.click()}>
                <input ref={bulkFileRef} type="file" accept=".csv" hidden onChange={(e) => setBulkFile(e.target.files?.[0] || null)} />
                <Upload size={32} color={bulkFile ? '#10b981' : '#94a3b8'} style={{ marginBottom: 8 }} />
                <Typography variant="body2" fontWeight={600} color={bulkFile ? 'success.main' : 'text.secondary'}>
                  {bulkFile ? bulkFile.name : 'Click to select a CSV file'}
                </Typography>
                {bulkFile && <Typography variant="caption" color="text.secondary">{(bulkFile.size / 1024).toFixed(1)} KB</Typography>}
              </Box>
              <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                <Button fullWidth variant="outlined" onClick={handleBulkClose}>Cancel</Button>
                <Button fullWidth variant="contained" startIcon={bulkUploading ? <CircularProgress size={16} color="inherit" /> : <Upload size={18} />}
                  onClick={handleBulkUpload} disabled={!bulkFile || bulkUploading}>
                  {bulkUploading ? 'Uploading...' : 'Upload Users'}
                </Button>
              </Stack>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default UserManagement;
