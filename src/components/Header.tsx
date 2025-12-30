import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(74, 123, 167, 0.15)',
        boxShadow: 1,
      }}
    >
      <Toolbar sx={{ maxWidth: '1100px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          My Blog
        </Typography>
        <Button
          color="inherit"
          onClick={() => navigate('/about')}
          sx={{
            ml: 4,
            color: location.pathname === '/about' ? 'primary.main' : 'text.primary',
            fontWeight: location.pathname === '/about' ? 600 : 400,
          }}
        >
          About Me
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
