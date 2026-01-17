import { useState } from 'react';
import { signIn } from 'aws-amplify/auth';
import {
  Box,
  TextField,
  Button,
  Alert,
  Link,
} from '@mui/material';

interface LoginFormProps {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
  onNewPasswordRequired: () => void;
}

export default function LoginForm({ onLoginSuccess, onForgotPassword, onNewPasswordRequired }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const signInResult = await signIn({ username: email, password });

      if (signInResult.isSignedIn) {
        onLoginSuccess();
      } else if (signInResult.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        onNewPasswordRequired();
      } else {
        setError(`Unexpected sign-in step: ${signInResult.nextStep.signInStep}`);
      }
    } catch (err: any) {
      let errorMessage = 'Invalid email or password';

      if (err.name === 'UserNotConfirmedException') {
        errorMessage = 'Please verify your email address';
      } else if (err.name === 'PasswordResetRequiredException') {
        errorMessage = 'Password reset required. Please use "Forgot Password?"';
      } else if (err.name === 'TooManyRequestsException') {
        errorMessage = 'Too many attempts. Please try again later';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextField
        label="Email"
        type="email"
        required
        fullWidth
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        label="Password"
        type="password"
        required
        fullWidth
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        sx={{ mb: 2 }}
      >
        {loading ? 'Logging in...' : 'Log In'}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Link
          component="button"
          type="button"
          variant="body2"
          onClick={onForgotPassword}
          sx={{ cursor: 'pointer' }}
        >
          Forgot Password?
        </Link>
      </Box>
    </Box>
  );
}
