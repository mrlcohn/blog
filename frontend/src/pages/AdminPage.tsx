import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Chip,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { isAuthenticated, getAuthHeader, clearTokens } from '../utils/auth';
import { getAuthUrl } from '../config/cognito';

const API_URL = import.meta.env.VITE_API_URL || '';

interface BlogFormData {
  slug: string;
  title: string;
  author: string;
  summary: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published';
}

const AdminPage = () => {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<BlogFormData>({
    slug: '',
    title: '',
    author: '',
    summary: '',
    content: '',
    tags: [],
    status: 'draft',
  });

  useEffect(() => {
    // Check authentication status
    if (!isAuthenticated()) {
      setAuthenticated(false);
      setLoading(false);
    } else {
      setAuthenticated(true);
      setLoading(false);
    }
  }, []);

  const handleLogin = () => {
    window.location.href = getAuthUrl('login');
  };

  const handleLogout = () => {
    clearTokens();
    window.location.href = getAuthUrl('logout');
  };

  const handleInputChange = (field: keyof BlogFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create blog post');
      }

      const result = await response.json();
      setSuccess(`Blog post "${formData.title}" created successfully as ${result.status}!`);

      // Reset form
      setFormData({
        slug: '',
        title: '',
        author: '',
        summary: '',
        content: '',
        tags: [],
        status: 'draft',
      });

      // Redirect to home after a delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
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

  if (!authenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Admin Login Required
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please log in to access the blog admin panel.
          </Typography>
          <Button variant="contained" size="large" onClick={handleLogin}>
            Log In with Cognito
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3" component="h1">
          Create New Blog Post
        </Typography>
        <Button variant="outlined" onClick={handleLogout}>
          Log Out
        </Button>
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
              label="Title"
              required
              fullWidth
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              onBlur={generateSlug}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Slug"
                required
                fullWidth
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                helperText="URL-friendly identifier (e.g., my-blog-post)"
              />
              <Button variant="outlined" onClick={generateSlug}>
                Generate
              </Button>
            </Box>

            <TextField
              label="Author"
              required
              fullWidth
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
            />

            <TextField
              label="Summary"
              required
              fullWidth
              multiline
              rows={2}
              value={formData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              helperText="Brief description for the blog card"
            />

            <TextField
              label="Content"
              required
              fullWidth
              multiline
              rows={12}
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              helperText="Full blog post content in Markdown"
            />

            <Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <TextField
                  label="Add Tag"
                  fullWidth
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button variant="outlined" onClick={handleAddTag}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formData.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                  />
                ))}
              </Box>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                label="Status"
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Blog Post'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default AdminPage;
