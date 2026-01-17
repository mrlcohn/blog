import { useState } from 'react';
import { signIn, fetchAuthSession } from 'aws-amplify/auth';
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
}

export default function LoginForm({ onLoginSuccess, onForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('DEBUG: Starting signIn...');
      const signInResult = await signIn({ username: email, password });
      console.log('DEBUG: signIn result:', signInResult);
      console.log('DEBUG: signIn isSignedIn:', signInResult.isSignedIn);
      console.log('DEBUG: signIn nextStep:', signInResult.nextStep);

      console.log('DEBUG: Fetching auth session...');
      const session = await fetchAuthSession();
      console.log('DEBUG: Session result:', session);
      console.log('DEBUG: Session tokens:', session.tokens);
      console.log('DEBUG: Has idToken:', !!session.tokens?.idToken);

      console.log('DEBUG: localStorage keys:', Object.keys(localStorage));
      console.log('DEBUG: localStorage contents:', JSON.stringify(localStorage, null, 2));

      console.log('DEBUG: Calling onLoginSuccess...');
      onLoginSuccess();
    } catch (err: any) {
      console.error('DEBUG: Login error:', err);
      // Map common errors to user-friendly messages
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
