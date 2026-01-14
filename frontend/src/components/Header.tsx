import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAuthenticated, clearTokens } from '../utils/auth';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated();
      setAuthenticated(authed);
    };
    checkAuth();

    // Re-check authentication when location changes
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, [location]);

  const handleLogout = async () => {
    await clearTokens();
    setAuthenticated(false);
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(74, 123, 167, 0.15)',
        boxShadow: 1,
        zIndex: 1100, // Ensure header appears over other content
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

        <Box sx={{ display: 'flex', gap: 2, ml: 4, flexGrow: 1 }}>
          <Button
            color="inherit"
            onClick={() => navigate('/about')}
            sx={{
              color: location.pathname === '/about' ? 'primary.main' : 'text.primary',
              fontWeight: location.pathname === '/about' ? 600 : 400,
            }}
          >
            About Me
          </Button>

          {authenticated && (
            <Button
              color="inherit"
              onClick={() => navigate('/admin')}
              sx={{
                color: location.pathname === '/admin' ? 'primary.main' : 'text.primary',
                fontWeight: location.pathname === '/admin' ? 600 : 400,
              }}
            >
              Admin
            </Button>
          )}
        </Box>

        {authenticated ? (
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{
              color: 'text.primary',
              fontWeight: 400,
            }}
          >
            Logout
          </Button>
        ) : (
          <Button
            color="inherit"
            onClick={() => navigate('/admin')}
            sx={{
              color: 'text.primary',
              fontWeight: 400,
            }}
          >
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
