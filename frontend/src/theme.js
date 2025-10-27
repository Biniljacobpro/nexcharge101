import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00E6B6',
      light: '#33EBC4',
      dark: '#00B894',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2D5A87',
      light: '#4A7BA7',
      dark: '#1E3A5F',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F8F8F8',
      paper: '#ffffff',
    },
    text: {
      primary: '#222222',
      secondary: '#6B7280',
    },
    grey: {
      50: '#F8F8F8',
      100: '#EAEAEA',
      200: '#D1D5DB',
      300: '#9CA3AF',
      400: '#6B7280',
      500: '#4B5563',
      600: '#374151',
      700: '#1F2937',
      800: '#111827',
      900: '#0F172A',
    },
    success: {
      main: '#10B981',
    },
    info: {
      main: '#3B82F6',
    },
    warning: {
      main: '#F59E0B',
    },
    error: {
      main: '#EF4444',
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Poppins", "Lato", "Open Sans", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", "Poppins", sans-serif',
      fontWeight: 800,
      fontSize: '3.5rem',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
      '@media (max-width:600px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontFamily: '"Montserrat", "Poppins", sans-serif',
      fontWeight: 700,
      fontSize: '2.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h3: {
      fontFamily: '"Montserrat", "Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: '"Montserrat", "Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: '"Montserrat", "Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Montserrat", "Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    body1: {
      fontFamily: '"Lato", "Open Sans", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.7,
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"Lato", "Open Sans", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    button: {
      fontFamily: '"Montserrat", "Poppins", sans-serif',
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 28px',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 230, 182, 0.25)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00E6B6 0%, #00B894 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #00B894 0%, #00A085 100%)',
          },
        },
        outlined: {
          borderColor: '#00E6B6',
          color: '#00E6B6',
          borderWidth: '2px',
          '&:hover': {
            backgroundColor: 'rgba(0, 230, 182, 0.08)',
            borderColor: '#00B894',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #EAEAEA',
          background: '#ffffff',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#ffffff !important',
            transition: 'border-color 0.2s ease',
            '& fieldset': {
              borderColor: '#D1D5DB',
              borderWidth: '1px',
            },
            '&:hover': {
              backgroundColor: '#ffffff !important',
              '& fieldset': {
                borderColor: '#9CA3AF',
                backgroundColor: 'transparent',
              },
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff !important',
              '& fieldset': {
                borderColor: '#00E6B6',
                borderWidth: '2px',
                boxShadow: '0 0 0 3px rgba(0, 230, 182, 0.1)',
              },
            },
            '& input': {
              color: '#222222 !important',
              padding: '12px 14px',
              fontSize: '0.95rem',
              fontWeight: 400,
              backgroundColor: 'transparent !important',
              '&::placeholder': {
                color: '#9CA3AF',
                opacity: 1,
              },
            },
            '& label': {
              color: '#6B7280',
              fontSize: '0.9rem',
              fontWeight: 500,
              '&.Mui-focused': {
                color: '#00E6B6',
              },
            },
            '&.Mui-error': {
              backgroundColor: '#ffffff !important',
              '& fieldset': {
                borderColor: '#EF4444',
              },
              '&:hover': {
                backgroundColor: '#ffffff !important',
                '& fieldset': {
                  borderColor: '#EF4444',
                },
              },
              '&.Mui-focused': {
                backgroundColor: '#ffffff !important',
                '& fieldset': {
                  borderColor: '#EF4444',
                  boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
                },
              },
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          background: '#ffffff',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.08)',
          borderBottom: '1px solid #EAEAEA',
        },
      },
    },
  },
});

export default theme;
