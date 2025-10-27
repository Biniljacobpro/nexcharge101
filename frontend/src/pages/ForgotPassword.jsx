import React, { useState } from 'react';
import { Box, Container, Card, CardContent, TextField, Button, Typography, Grid, Alert, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import { requestPasswordResetOtpApi, verifyPasswordResetOtpApi, resetPasswordWithOtpApi } from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    setError(''); setSuccess('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    try {
      setLoading(true);
      await requestPasswordResetOtpApi(email);
      setSuccess('If an account exists, an OTP has been sent');
      setStep('otp');
    } catch (e) {
      setError(e.message || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(''); setSuccess('');
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    try {
      setLoading(true);
      await verifyPasswordResetOtpApi(email, otp);
      setSuccess('OTP verified');
      setStep('reset');
    } catch (e) {
      setError(e.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(''); setSuccess('');
    if (newPassword.length < 8) return setError('Password must be at least 8 characters');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) return setError('Use upper, lower, and a number');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    try {
      setLoading(true);
      await resetPasswordWithOtpApi(email, newPassword);
      setSuccess('Password reset successful. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (e) {
      setError(e.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      <AnimatedBackground />
      <Navbar />
      <Box component="main" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: { xs: 4, md: 8 } }}>
        <Container maxWidth="sm">
          <Card sx={{ p: { xs: 2, sm: 3 }, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: '#2d3436' }}>Forgot Password</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {step === 'email' && 'Enter your email to receive a 6-digit OTP.'}
                {step === 'otp' && 'Enter the 6-digit OTP sent to your email.'}
                {step === 'reset' && 'Set a new password for your account.'}
              </Typography>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

              {step === 'email' && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button fullWidth variant="contained" disabled={loading} onClick={handleRequestOtp}>Send OTP</Button>
                  </Grid>
                </Grid>
              )}

              {step === 'otp' && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2}>
                      <Button variant="outlined" onClick={() => setStep('email')}>Change Email</Button>
                      <Button variant="contained" disabled={loading} onClick={handleVerifyOtp}>Verify OTP</Button>
                    </Stack>
                  </Grid>
                </Grid>
              )}

              {step === 'reset' && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </Grid>
                  <Grid item xs={12}>
                    <Button fullWidth variant="contained" disabled={loading} onClick={handleResetPassword}>Reset Password</Button>
                  </Grid>
                </Grid>
              )}

              <Stack alignItems="center" sx={{ mt: 3 }}>
                <Button variant="text" size="small" onClick={() => navigate('/login')} sx={{ color: 'primary.main' }}>
                  Back to Login
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
};

export default ForgotPassword;




