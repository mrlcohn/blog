import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import BlogPostPage from './pages/BlogPostPage';
import AboutPage from './pages/AboutPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2c5f8d',
      light: '#4a7ba7',
      dark: '#1a3a5a',
    },
    secondary: {
      main: '#455a64',
      light: '#607d8b',
      dark: '#263238',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a3a5a',
      secondary: '#546e7a',
    },
  },
  shape: {
    borderRadius: 16,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/:id" element={<BlogPostPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
