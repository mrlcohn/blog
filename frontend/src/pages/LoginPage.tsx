import { useState } from 'react';
import { Container, Paper, Typography } from '@mui/material';
import LoginForm from '../components/LoginForm';
import PasswordResetForm from '../components/PasswordResetForm';
import NewPasswordForm from '../components/NewPasswordForm';

type LoginStep = 'login' | 'newPassword' | 'forgotPassword';

const LoginPage = () => {
  const [step, setStep] = useState<LoginStep>('login');

  const handleLoginSuccess = () => {
    window.location.href = '/create';
  };

  const getTitle = () => {
    switch (step) {
      case 'newPassword':
        return 'Set New Password';
      case 'forgotPassword':
        return 'Reset Password';
      default:
        return 'Admin Login';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {getTitle()}
        </Typography>

        {step === 'login' && (
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => setStep('forgotPassword')}
            onNewPasswordRequired={() => setStep('newPassword')}
          />
        )}

        {step === 'newPassword' && (
          <NewPasswordForm
            onSuccess={handleLoginSuccess}
            onCancel={() => setStep('login')}
          />
        )}

        {step === 'forgotPassword' && (
          <PasswordResetForm
            onCancel={() => setStep('login')}
            onResetComplete={() => setStep('login')}
          />
        )}
      </Paper>
    </Container>
  );
};

export default LoginPage;
