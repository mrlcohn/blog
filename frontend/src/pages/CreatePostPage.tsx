import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { isAuthenticated, getAuthHeader } from '../utils/auth';
import { fetchAdminPosts, updateBlogPost, BlogPost } from '../services/api';

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

const generateSlugFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove punctuation (keep letters, numbers, spaces, hyphens)
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
};

const CreatePostPage = () => {
  const navigate = useNavigate();
  const { slug: editSlug } = useParams<{ slug: string }>();
  const isEditMode = Boolean(editSlug);

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
    const init = async () => {
      setLoading(true);
      const authed = await isAuthenticated();
      if (!authed) {
        navigate('/login');
        return;
      }

      if (isEditMode && editSlug) {
        try {
          const posts = await fetchAdminPosts();
          const post = posts.find((p: BlogPost) => p.slug === editSlug);
          if (post) {
            setFormData({
              slug: post.slug,
              title: post.title,
              author: post.author,
              summary: post.summary,
              content: post.content || '',
              tags: post.tags,
              status: post.status || 'draft',
            });
          } else {
            setError('Post not found');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load post');
        }
      }

      setLoading(false);
    };
    init();
  }, [navigate, isEditMode, editSlug]);

  const handleInputChange = (field: keyof BlogFormData, value: string | string[]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug when title changes (only in create mode)
      if (field === 'title' && !isEditMode) {
        updated.slug = generateSlugFromTitle(value as string);
      }
      return updated;
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        throw new Error('Not authenticated');
      }

      if (isEditMode && editSlug) {
        // Update existing post
        const result = await updateBlogPost(editSlug, {
          title: formData.title,
          author: formData.author,
          summary: formData.summary,
          content: formData.content,
          tags: formData.tags,
          status: formData.status,
        });
        setSuccess(`Blog post "${formData.title}" updated successfully as ${result.status}!`);
      } else {
        // Create new post
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
      }

      // Redirect to manage posts after a delay
      setTimeout(() => {
        navigate('/manage');
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

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3" component="h1">
          {isEditMode ? 'Edit Blog Post' : 'Create New Blog Post'}
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
              label="Title"
              required
              fullWidth
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              helperText={!isEditMode && formData.slug ? `Slug: ${formData.slug}` : undefined}
            />

            {isEditMode && (
              <Typography variant="body2" color="text.secondary">
                Slug: {formData.slug} (cannot be changed)
              </Typography>
            )}

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
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
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
              {submitting
                ? (isEditMode ? 'Updating...' : 'Creating...')
                : (isEditMode ? 'Update Blog Post' : 'Create Blog Post')
              }
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
};

export default CreatePostPage;
