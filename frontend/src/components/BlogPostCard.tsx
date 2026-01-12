import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { BlogPost } from '../types/blog';

interface BlogPostCardProps {
  post: BlogPost;
}

function BlogPostCard({ post }: BlogPostCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/posts/${post.slug}`);
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Typography gutterBottom variant="h5" component="h2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
          {post.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
          {new Date(post.publishDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
          {post.summary}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
          {post.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                backgroundColor: 'secondary.light',
                color: 'white',
                fontWeight: 500,
                height: '24px',
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default BlogPostCard;
