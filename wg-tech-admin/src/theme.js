import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8CE600',
      light: '#B0FF00',
      dark: '#6BA800',
    },
    secondary: {
      main: '#00D4AA',
      light: '#4DFFEB',
      dark: '#00A881',
    },
    background: {
      default: '#0F0F0F',
      paper: '#1A1A1A',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0B0B0',
    },
    divider: '#333333',
    error: {
      main: '#FF6B6B',
    },
    warning: {
      main: '#FFD93D',
    },
    success: {
      main: '#6BCF7F',
    },
    info: {
      main: '#4D96FF',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Marcellus", serif',
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontFamily: '"Marcellus", serif',
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontFamily: '"Marcellus", serif',
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h4: {
      fontFamily: '"Marcellus", serif',
      fontWeight: 700,
      fontSize: '1.5rem',
    },
    h5: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontFamily: '"Poppins", sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontFamily: '"Poppins", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontFamily: '"Poppins", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      fontFamily: '"Poppins", sans-serif',
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          background: '#8CE600',
          color: '#000',
          '&:hover': {
            background: '#8CE600',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
          borderRadius: '12px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A1A1A',
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0D0C0C',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0D0C0C',
          borderRight: '1px solid #333333',
        },
      },
    },
  },
});

export default theme;

