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
      await signIn({ username: email, password });
      onLoginSuccess();
    } catch (err: any) {
      console.error('Login error - Full error object:', err);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error underlyingError:', err.underlyingError);

      // Show the actual error message in UI for debugging
      setError(`${err.name || 'Error'}: ${err.message || 'Login failed'}`);
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
