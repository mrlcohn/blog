import { useParams } from 'react-router-dom';
import { Typography, Box, Chip, Paper } from '@mui/material';
import { mockPosts } from '../data/mockPosts';

function BlogPostPage() {
  const { id: slug } = useParams<{ id: string }>();

  const post = mockPosts.find((p) => p.slug === slug);

  if (!post) {
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

          <Typography
            variant="body1"
            component="div"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              color: 'text.primary',
              '& code': {
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9em',
              },
            }}
          >
            {post.content}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

export default BlogPostPage;
