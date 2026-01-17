import { useState } from 'react';
import { confirmSignIn } from 'aws-amplify/auth';
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
} from '@mui/material';

interface NewPasswordFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function NewPasswordForm({ onSuccess, onCancel }: NewPasswordFormProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await confirmSignIn({ challengeResponse: newPassword });
      onSuccess();
    } catch (err: any) {
      if (err.name === 'InvalidPasswordException') {
        setError('Password must have 8+ chars, uppercase, lowercase, number, and symbol');
      } else {
        setError(err.message || 'Failed to set password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please set a new password for your account.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TextField
        label="New Password"
        type="password"
        required
        fullWidth
        autoComplete="new-password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        helperText="8+ chars, uppercase, lowercase, number, symbol"
        sx={{ mb: 2 }}
      />

      <TextField
        label="Confirm Password"
        type="password"
        required
        fullWidth
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
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
        {loading ? 'Setting Password...' : 'Set New Password'}
      </Button>

      <Button
        type="button"
        variant="text"
        fullWidth
        onClick={onCancel}
      >
        Cancel
      </Button>
    </Box>
  );
}
