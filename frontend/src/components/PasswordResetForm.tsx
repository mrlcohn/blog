import { useState } from 'react';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import {
  Box,
  TextField,
  Button,
  Alert,
  Typography,
  Stack,
} from '@mui/material';

interface PasswordResetFormProps {
  onCancel: () => void;
  onResetComplete: () => void;
}

const mapResetError = (err: any): string => {
  switch (err.name) {
    case 'UserNotFoundException':
      return 'No account found with this email';
    case 'LimitExceededException':
      return 'Too many reset attempts. Please try again later';
    case 'CodeMismatchException':
      return 'Invalid verification code';
    case 'ExpiredCodeException':
      return 'Verification code expired. Please request a new one';
    case 'InvalidPasswordException':
      return 'Password doesn\'t meet requirements: 8+ chars, uppercase, lowercase, number, symbol';
    default:
      return 'An error occurred. Please try again.';
  }
};

export default function PasswordResetForm({ onCancel, onResetComplete }: PasswordResetFormProps) {
  const [step, setStep] = useState<'email' | 'confirm'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await resetPassword({ username: email });
      setSuccess('Verification code sent to your email');
      setStep('confirm');
    } catch (err: any) {
      setError(mapResetError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      setSuccess('Password reset successfully! You can now log in.');
      setTimeout(() => {
        onResetComplete();
      }, 2000);
    } catch (err: any) {
      setError(mapResetError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {step === 'email' && (
        <Box component="form" onSubmit={handleSendCode}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your email address and we'll send you a verification code to reset your password.
          </Typography>

          <TextField
            label="Email"
            type="email"
            required
            fullWidth
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Stack direction="row" spacing={2}>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Code'}
            </Button>
          </Stack>
        </Box>
      )}

      {step === 'confirm' && (
        <Box component="form" onSubmit={handleConfirmReset}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter the verification code sent to {email} and your new password.
          </Typography>

          <TextField
            label="Verification Code"
            required
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Check your email for the 6-digit code"
          />

          <TextField
            label="New Password"
            type="password"
            required
            fullWidth
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 3 }}
            helperText="8+ chars, uppercase, lowercase, number, symbol"
          />

          <Stack direction="row" spacing={2}>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}
