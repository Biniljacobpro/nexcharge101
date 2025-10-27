import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const steps = ['Company Information', 'Contact Details', 'Business Details', 'Review & Submit'];

const CorporateApplicationPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    contactPersonName: '',
    contactNumber: '',
    businessRegistrationNumber: '',
    additionalInfo: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Company Information
        if (!formData.companyName.trim()) {
          newErrors.companyName = 'Company name is required';
        }
        if (!formData.companyEmail.trim()) {
          newErrors.companyEmail = 'Company email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.companyEmail)) {
          newErrors.companyEmail = 'Please enter a valid email address';
        }
        break;
      
      case 1: // Contact Details
        if (!formData.contactPersonName.trim()) {
          newErrors.contactPersonName = 'Contact person name is required';
        }
        if (!formData.contactNumber.trim()) {
          newErrors.contactNumber = 'Contact number is required';
        } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.contactNumber.replace(/[\s\-\(\)]/g, ''))) {
          newErrors.contactNumber = 'Please enter a valid phone number';
        }
        break;
      
      case 2: // Business Details
        if (!formData.businessRegistrationNumber.trim()) {
          newErrors.businessRegistrationNumber = 'Business registration number is required';
        }
        break;
      
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(activeStep)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5000'}/corporates/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application. Please try again.');
      }

      const result = await response.json();
      setShowSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1f2937' }}>
                Company Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.companyName}
                onChange={handleInputChange('companyName')}
                error={!!errors.companyName}
                helperText={errors.companyName}
                required
                InputProps={{
                  startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Email"
                type="email"
                value={formData.companyEmail}
                onChange={handleInputChange('companyEmail')}
                error={!!errors.companyEmail}
                helperText={errors.companyEmail}
                required
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1f2937' }}>
                Contact Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Person Name"
                value={formData.contactPersonName}
                onChange={handleInputChange('contactPersonName')}
                error={!!errors.contactPersonName}
                helperText={errors.contactPersonName}
                required
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contactNumber}
                onChange={handleInputChange('contactNumber')}
                error={!!errors.contactNumber}
                helperText={errors.contactNumber}
                required
                InputProps={{
                  startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1f2937' }}>
                Business Details
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business Registration Number/ID"
                value={formData.businessRegistrationNumber}
                onChange={handleInputChange('businessRegistrationNumber')}
                error={!!errors.businessRegistrationNumber}
                helperText={errors.businessRegistrationNumber}
                required
                InputProps={{
                  startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Additional Information"
                multiline
                rows={4}
                value={formData.additionalInfo}
                onChange={handleInputChange('additionalInfo')}
                placeholder="Tell us more about your company and why you want to join NexCharge..."
                InputProps={{
                  startAdornment: <DescriptionIcon sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />,
                }}
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 3, color: '#1f2937' }}>
              Review Your Application
            </Typography>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
                    <Typography variant="body1">{formData.companyName}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Company Email</Typography>
                    <Typography variant="body1">{formData.companyEmail}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Contact Person</Typography>
                    <Typography variant="body1">{formData.contactPersonName}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Contact Number</Typography>
                    <Typography variant="body1">{formData.contactNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">Business Registration</Typography>
                    <Typography variant="body1">{formData.businessRegistrationNumber}</Typography>
                  </Grid>
                  {formData.additionalInfo && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Additional Information</Typography>
                      <Typography variant="body1">{formData.additionalInfo}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please review your application details above. Once submitted, our team will review your application and contact you within 3-5 business days.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Navbar />
      
      <Box component="main" sx={{ flex: 1, py: { xs: 4, md: 8 } }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  color: '#1f2937',
                  mb: 2
                }}
              >
                Corporate Admin Application
              </Typography>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ maxWidth: '600px', mx: 'auto', lineHeight: 1.6 }}
              >
                Join NexCharge as a Corporate Partner and manage multiple charging stations across your network
              </Typography>
            </Box>

            {/* Stepper */}
            <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>

            {/* Form Content */}
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
              {renderStepContent(activeStep)}
              
              <Divider sx={{ my: 4 }} />
              
              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                
                <Box>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                      sx={{
                        background: '#00D4AA',
                        '&:hover': {
                          background: '#009B7A',
                        },
                        px: 4,
                        py: 1.5
                      }}
                    >
                      {loading ? 'Submitting...' : 'Submit Application'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      sx={{
                        background: '#00D4AA',
                        '&:hover': {
                          background: '#009B7A',
                        },
                        px: 4,
                        py: 1.5
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}
          </motion.div>
        </Container>
      </Box>

      <Footer />

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccess(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          Application submitted successfully! You will receive an email after review.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CorporateApplicationPage;

