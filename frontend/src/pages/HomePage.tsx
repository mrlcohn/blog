import { Typography, Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BlogPostCard from '../components/BlogPostCard';
import { fetchBlogCards, type BlogCardData } from '../services/api';

function HomePage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      const data = await fetchBlogCards();
      setPosts(data);
      setLoading(false);
    }
    loadPosts();
  }, []);
  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Box sx={{ maxWidth: '1100px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 1, minWidth: '300px' }}>
            <Typography variant="h2" component="h1" gutterBottom>
              My Blog
            </Typography>
            <Typography variant="h6" component="p" color="text.secondary">
              Thoughts on web development, AWS, and technology
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'background.paper',
              p: 2.5,
              borderRadius: 2,
              boxShadow: 1,
              width: '200px',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'secondary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Typography variant="h4" sx={{ color: 'white' }}>
                LW
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Your Name
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                Software engineer passionate about web development and cloud technologies.
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'primary.main',
                  cursor: 'pointer',
                  fontWeight: 600,
                  '&:hover': { textDecoration: 'underline' },
                }}
                onClick={() => navigate('/about')}
              >
                About Me →
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : posts.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
              No posts yet. Check back soon!
            </Typography>
          ) : (
            posts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default HomePage;
