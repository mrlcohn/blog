import { Typography, Box, Paper } from '@mui/material';

function AboutPage() {
  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      <Box sx={{ maxWidth: '800px', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
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
              LW
            </Typography>
          </Box>
          <Typography variant="h2" component="h1" sx={{ textAlign: 'center' }}>
            About Me
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
            Hi, I'm Your Name
          </Typography>

          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            I'm a software engineer passionate about web development, cloud technologies, and building
            scalable applications. This blog is where I share my thoughts, experiences, and learnings
            from my journey in tech.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mt: 4, mb: 2 }}>
            What I Do
          </Typography>

          <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
            I specialize in modern web development using React, TypeScript, and cloud platforms like AWS.
            I enjoy solving complex problems and creating elegant solutions that make a difference.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mt: 4, mb: 2 }}>
            Get In Touch
          </Typography>

          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            Feel free to reach out if you'd like to discuss technology, collaborate on a project,
            or just connect. You can find me on various platforms or drop me an email.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

export default AboutPage;
