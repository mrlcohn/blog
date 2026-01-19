import { Typography, Box, Paper, CircularProgress, Button } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchAbout, type AboutData } from '../services/api';
import { isAuthenticated } from '../utils/auth';

function AboutPage() {
  const navigate = useNavigate();
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [data, authed] = await Promise.all([
        fetchAbout(),
        isAuthenticated()
      ]);
      setAboutData(data);
      setAuthenticated(authed);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasContent = aboutData && (aboutData.name || aboutData.content);

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Box sx={{ maxWidth: '800px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {aboutData?.imageUrl ? (
            <Box
              component="img"
              src={aboutData.imageUrl}
              alt={aboutData.name || 'Profile'}
              sx={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 150,
                height: 150,
                borderRadius: '50%',
                backgroundColor: 'secondary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h2" sx={{ color: 'white' }}>
                {aboutData?.name ? aboutData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'ME'}
              </Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h2" component="h1" sx={{ textAlign: 'center' }}>
              About Me
            </Typography>
            {authenticated && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/edit-about')}
              >
                Edit
              </Button>
            )}
          </Box>
        </Box>

        <Paper sx={{ p: 4 }}>
          {hasContent ? (
            <>
              {aboutData.name && (
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                  Hi, I'm {aboutData.name}
                </Typography>
              )}

              {aboutData.content && (
                <Box
                  sx={{
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
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {aboutData.content}
                  </ReactMarkdown>
                </Box>
              )}
            </>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No content yet. {authenticated && 'Click Edit to add your about page content.'}
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default AboutPage;
