import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { isAuthenticated } from '../utils/auth';
import { fetchAdminPosts, BlogPost } from '../services/api';

const ManagePostsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const authed = await isAuthenticated();
      if (!authed) {
        navigate('/login');
        return;
      }

      try {
        const fetchedPosts = await fetchAdminPosts();
        setPosts(fetchedPosts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h3" component="h1">
          Manage Posts
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No posts found. Create your first post!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.slug} hover>
                  <TableCell>
                    <Typography fontWeight={500}>{post.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      /{post.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={post.status || 'draft'}
                      size="small"
                      color={post.status === 'published' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>{formatDate(post.createdAt || '')}</TableCell>
                  <TableCell>{formatDate(post.updatedAt || '')}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {post.tags.slice(0, 3).map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                      {post.tags.length > 3 && (
                        <Chip label={`+${post.tags.length - 3}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit post">
                      <IconButton
                        onClick={() => navigate(`/edit/${post.slug}`)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default ManagePostsPage;
