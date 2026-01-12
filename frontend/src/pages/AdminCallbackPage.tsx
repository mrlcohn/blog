import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, CircularProgress, Typography } from '@mui/material';
import { parseTokensFromUrl, saveTokens } from '../utils/auth';

const AdminCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const tokens = parseTokensFromUrl();

    if (tokens) {
      saveTokens(tokens.accessToken, tokens.idToken, tokens.expiresIn);
      // Clear hash from URL and redirect to admin page
      window.history.replaceState(null, '', '/admin');
      navigate('/admin', { replace: true });
    } else {
      // No tokens found, redirect to login
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  return (
    <Container
      maxWidth="sm"
      sx={{
        mt: 8,
        textAlign: 'center',
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3 }}>
        Completing authentication...
      </Typography>
    </Container>
  );
};

export default AdminCallbackPage;
