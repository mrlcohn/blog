import { useParams } from 'react-router-dom';
import { Typography, Box, Chip, Paper, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchBlogPost, type BlogPost } from '../services/api';

function BlogPostPage() {
  const { id: slug } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadPost() {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const data = await fetchBlogPost(slug);
      if (data) {
        setPost(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    loadPost();
  }, [slug]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (notFound || !post) {
    return (
      <Box sx={{ minHeight: '100vh', py: 4 }}>
        <Box sx={{ maxWidth: '900px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
          <Typography variant="h4">Post not found</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Box sx={{ maxWidth: '900px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Paper elevation={0} sx={{ p: 4, backgroundColor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
            {post.title}
          </Typography>

          <Box sx={{ mb: 3, pb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              By {post.author} • {new Date(post.publishDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            {post.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  mr: 1,
                  mb: 1,
                  backgroundColor: 'secondary.light',
                  color: 'white',
                  fontWeight: 500,
                  height: '24px',
                }}
              />
            ))}
          </Box>

          {post.imageKey && (
            <Box
              component="img"
              src={post.imageKey}
              alt={post.title}
              sx={{
                width: '100%',
                maxHeight: 400,
                objectFit: 'cover',
                borderRadius: 2,
                mb: 4,
              }}
            />
          )}

          <Box
            sx={{
              lineHeight: 1.8,
              color: 'text.primary',
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                fontWeight: 600,
                color: 'primary.main',
                mt: 4,
                mb: 2,
              },
              '& h1': { fontSize: '1.75rem' },
              '& h2': { fontSize: '1.5rem' },
              '& h3': { fontSize: '1.25rem' },
              '& p': {
                lineHeight: 1.8,
                mb: 2,
              },
              '& ul, & ol': {
                pl: 3,
                mb: 2,
              },
              '& li': {
                lineHeight: 1.8,
                mb: 0.5,
              },
              '& a': {
                color: 'primary.main',
                textDecoration: 'underline',
              },
              '& code': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9em',
              },
              '& pre': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: 2,
                borderRadius: 1,
                overflow: 'auto',
                '& code': {
                  backgroundColor: 'transparent',
                  padding: 0,
                },
              },
              '& blockquote': {
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                pl: 2,
                ml: 0,
                fontStyle: 'italic',
                color: 'text.secondary',
              },
              '& table': {
                borderCollapse: 'collapse',
                width: '100%',
                mb: 2,
              },
              '& th, & td': {
                border: '1px solid',
                borderColor: 'divider',
                padding: 1,
                textAlign: 'left',
              },
              '& th': {
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                fontWeight: 600,
              },
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 1,
              },
              '& hr': {
                border: 'none',
                borderTop: '1px solid',
                borderColor: 'divider',
                my: 3,
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {post.content || ''}
            </ReactMarkdown>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

export default BlogPostPage;
