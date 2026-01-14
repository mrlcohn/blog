import { useState } from 'react';
import { Container, Paper, Typography } from '@mui/material';
import LoginForm from '../components/LoginForm';
import PasswordResetForm from '../components/PasswordResetForm';

const LoginPage = () => {
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const handleLoginSuccess = () => {
    // Force a page reload to ensure auth state is fully updated
    window.location.href = '/create';
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {showPasswordReset ? 'Reset Password' : 'Admin Login'}
        </Typography>

        {showPasswordReset ? (
          <PasswordResetForm
            onCancel={() => setShowPasswordReset(false)}
            onResetComplete={() => setShowPasswordReset(false)}
          />
        ) : (
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => setShowPasswordReset(true)}
          />
        )}
      </Paper>
    </Container>
  );
};

export default LoginPage;
