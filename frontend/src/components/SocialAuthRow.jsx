import React, { useState } from 'react';
import { Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { googleLoginApi } from '../utils/api';
import { firebaseGoogleSignIn } from '../utils/firebase';

const buttonSx = {
  border: '1px solid #e5e7eb',
  color: 'text.primary',
  backgroundColor: '#ffffff',
  textTransform: 'none',
  '&:hover': { backgroundColor: '#f9fafb' }
};

const SocialAuthRow = ({ onGoogleSuccess }) => {
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const handleGoogle = async () => {
    try {
      const { idToken } = await firebaseGoogleSignIn();
      const data = await googleLoginApi(idToken);
      if (onGoogleSuccess) onGoogleSuccess(data);
    } catch (e) {
      console.error(e);
      const friendly = 'Google sign-in failed: Authentication was cancelled or blocked by browser security policy. Please try again.';
      const msg = e && e.message ? `Google sign-in failed: ${e.message}` : friendly;
      // Prefer the friendly message when common cancellation/block cases are detected
      const lower = String(e && e.message ? e.message : '').toLowerCase();
      if (lower.includes('popup') || lower.includes('cancel') || lower.includes('blocked')) {
        setErrorMessage(friendly);
      } else {
        setErrorMessage(msg);
      }
      setErrorOpen(true);
    }
  };

  return (
    <>
      <Stack direction="row" justifyContent="center">
        <Button onClick={handleGoogle} variant="outlined" startIcon={<GoogleIcon />} sx={buttonSx}>
          Continue with Google
        </Button>
      </Stack>
      <Dialog open={errorOpen} onClose={() => setErrorOpen(false)} aria-labelledby="google-error-title">
        <DialogTitle id="google-error-title">Google Sign-in Failed</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setErrorOpen(false)}>OK</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SocialAuthRow;
