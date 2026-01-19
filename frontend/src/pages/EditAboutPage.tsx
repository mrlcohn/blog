import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Stack,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { isAuthenticated } from '../utils/auth';
import { fetchAbout, updateAbout, uploadImage } from '../services/api';

interface AboutFormData {
  name: string;
  bio: string;
  content: string;
  imageUrl: string;
}

const EditAboutPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<AboutFormData>({
    name: '',
    bio: '',
    content: '',
    imageUrl: '',
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authed = await isAuthenticated();
      if (!authed) {
        navigate('/login');
        return;
      }

      try {
        const aboutData = await fetchAbout();
        setFormData({
          name: aboutData.name || '',
          bio: aboutData.bio || '',
          content: aboutData.content || '',
          imageUrl: aboutData.imageUrl || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load about data');
      }

      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleInputChange = (field: keyof AboutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const imageUrl = await uploadImage(file, 'about');
      setFormData(prev => ({ ...prev, imageUrl }));
      setSuccess('Image uploaded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await updateAbout({
        name: formData.name,
        bio: formData.bio,
        content: formData.content,
        imageUrl: formData.imageUrl || undefined,
      });
      setSuccess('About page updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3" component="h1">
          Edit About Page
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              helperText="Your name displayed on the About page"
            />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Profile Picture
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                {formData.imageUrl && (
                  <Box
                    component="img"
                    src={formData.imageUrl}
                    alt="Profile preview"
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid',
                      borderColor: 'divider',
                    }}
                  />
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={uploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </Button>
                  </label>
                  <Typography variant="caption" color="text.secondary">
                    JPEG, PNG, GIF, or WebP. Max 5MB.
                  </Typography>
                </Box>
              </Box>
              {formData.imageUrl && (
                <TextField
                  fullWidth
                  size="small"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  sx={{ mt: 2 }}
                  helperText="Or enter an image URL directly"
                />
              )}
              {!formData.imageUrl && (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Or paste an image URL..."
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </Box>

            <TextField
              label="Short Bio"
              required
              fullWidth
              multiline
              rows={2}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              helperText="Brief description shown on the homepage bumper"
            />

            <TextField
              label="Full Content"
              required
              fullWidth
              multiline
              rows={12}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              helperText="Full about page content in Markdown format"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting || uploading}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/about')}
              >
                View About Page
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default EditAboutPage;
