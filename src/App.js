import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import { ThemeProvider, useTheme } from './ThemeContext';
import Home from './pages/Home';
import Traders from './pages/Traders';
import LPs from './pages/LPs';
import Refer from './pages/Refer';
import Markets from './pages/Markets';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Docs from './pages/Docs';
import Blog from './pages/Blog';
import Community from './pages/Community';
import './App.css';

function App() {
  return (
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID || 'clpispdty00ycl80fpueukbhl'}
      config={{
        loginMethods: ['email', 'social', 'wallet'],
        appearance: { theme: 'dark', accentColor: '#2DD4BF' }
      }}
    >
      <ThemeProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/traders" element={<Traders />} />
            <Route path="/lps" element={<LPs />} />
            <Route path="/refer" element={<Refer />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/community" element={<Community />} />
          </Routes>
          <Footer />
        </Router>
      </ThemeProvider>
    </PrivyProvider>
  );
}

function Header() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header>
      <div className="container">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="url(#grad1)">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#1E3A8A', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#2DD4BF', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.5L20 8v8l-8 4-8-4V8l8-3.5z"/>
          </svg>
          PredictProp
        </div>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/traders">Traders</Link></li>
            <li><Link to="/lps">LPs</Link></li>
            <li><Link to="/refer">Refer & Earn</Link></li>
            <li><Link to="/markets">Markets</Link></li>
            <li>
              <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </button>
            </li>
            <li><Link to="#" className="connect-orb" onClick={() => alert('Connect with Privy')}>Connect (Privy)</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer>
      <div className="container">
        <div>
          <Link to="/about">About</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/discord">Discord</Link>
          <Link to="/twitter">Twitter</Link>
        </div>
        <div className="security">
          Join our community for 2025 launch updates
        </div>
      </div>
    </footer>
  );
}

export default App;