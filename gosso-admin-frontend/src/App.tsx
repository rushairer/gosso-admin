import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom';
import { LogIn, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';
import { isLoggedIn, logout, getUserProfile, redirectToAuthorize } from './auth';
import type { UserProfile } from './auth';

// Import Pages
import Home from './pages/Home';
import Callback from './pages/Callback';
import Login from './pages/Login';
import Admin from './pages/Admin';

function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    setLogged(isLoggedIn());
    setUser(getUserProfile());
  }, []);

  const handleLogout = () => {
    logout();
    setLogged(false);
    setUser(null);
  };

  const handleSignIn = () => {
    redirectToAuthorize('/admin');
  };

  return (
    <div className="app-container">
      {/* Header Navigation */}
      <header className="navbar">
        <div className="navbar-container">
          <Link to="/" className="logo">
            <ShieldCheck style={{ width: '24px', height: '24px', stroke: 'var(--color-primary)' }} />
            GOSSO Admin
          </Link>
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Welcome
            </NavLink>
            {logged && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Admin Dashboard
              </NavLink>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '16px' }}>
              {logged ? (
                <>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--color-text-main)', fontWeight: '600' }}>{user?.preferred_username || user?.name || 'Admin'}</span>
                    {user?.roles?.includes('admin') ? (
                      <span className="badge" style={{ margin: 0, padding: '2px 6px', fontSize: '10px' }}>Admin</span>
                    ) : (
                      <span className="badge badge-secondary" style={{ margin: 0, padding: '2px 6px', fontSize: '10px' }}>User</span>
                    )}
                  </span>
                  <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                    <LogOut style={{ width: '13px', height: '13px' }} />
                    Sign Out
                  </button>
                </>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={handleSignIn}>
                  <LogIn style={{ width: '13px', height: '13px' }} />
                  Sign In
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <ShieldAlert style={{ width: '16px', height: '16px' }} />
          <span>GOSSO Identity Platform</span>
        </div>
        <p>&copy; {new Date().getFullYear()} GOSSO. OpenID Connect Self-Hosted Identity Service.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* OIDC flow callbacks and triggers */}
        <Route path="/callback" element={<Callback />} />
        <Route path="/login" element={<Login />} />

        {/* Regular layouts */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/admin" element={<Layout><Admin /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
