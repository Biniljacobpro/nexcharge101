import React, { useState } from 'react';
import { Box, Container, Card, CardContent, Typography, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { updatePasswordApi } from '../utils/api';

const FirstLoginReset = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    if (error) setError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.currentPassword || !form.newPassword) {
      setError('All fields are required');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await updatePasswordApi({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess('Password changed successfully. Redirecting to dashboard...');
      setTimeout(() => navigate('/corporate/dashboard'), 1000);
    } catch (e) {
      setError(e.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Set a New Password
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              For security, please change your temporary password before continuing.
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            <Box component="form" onSubmit={onSubmit}>
              <TextField
                label="Current (Temporary) Password"
                type="password"
                fullWidth
                margin="normal"
                value={form.currentPassword}
                onChange={onChange('currentPassword')}
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                margin="normal"
                value={form.newPassword}
                onChange={onChange('newPassword')}
                helperText="At least 8 chars, incl. upper, lower, and a number"
              />
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                margin="normal"
                value={form.confirmPassword}
                onChange={onChange('confirmPassword')}
              />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
                {loading ? 'Saving...' : 'Change Password'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
      <Footer />
    </Box>
  );
};

export default FirstLoginReset;



