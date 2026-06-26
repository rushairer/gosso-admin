import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Key,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { authSession, redirectToAuthorize } from '../../services/authSession';
import type { SessionSnapshot } from '../../services/authSession';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Overview',
    description: 'GOSSO identity administration entry point.',
  },
  '/admin': {
    title: 'Administration',
    description: 'Manage clients, accounts, audit records, and service status.',
  },
  '/settings': {
    title: 'Account Settings',
    description: 'Manage profile, MFA, passkeys, and active sessions.',
  },
};

function initials(snapshot: SessionSnapshot) {
  const name = snapshot.profile?.preferred_username || snapshot.profile?.name || 'Guest';
  return name.slice(0, 2).toUpperCase();
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [session, setSession] = useState<SessionSnapshot>(() => authSession.getSnapshot());

  useEffect(() => {
    setSession(authSession.getSnapshot());
  }, [location.pathname]);

  const page = useMemo(() => pageTitles[location.pathname] || pageTitles['/'], [location.pathname]);
  const userName = session.profile?.preferred_username || session.profile?.name || 'Not signed in';

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand">
          <span className="brand-mark">
            <ShieldCheck size={20} />
          </span>
          <span>
            <strong>GOSSO</strong>
            <small>Admin Console</small>
          </span>
        </Link>

        <nav className="sidebar-nav" aria-label="Primary">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Home size={17} />
            <span>Overview</span>
          </NavLink>
          {session.loggedIn && session.isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={17} />
              <span>Administration</span>
            </NavLink>
          )}
          {session.loggedIn && (
            <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Settings size={17} />
              <span>Settings</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Session</div>
          <div className="session-card">
            <div className="avatar">{session.loggedIn ? initials(session) : <User size={16} />}</div>
            <div className="session-meta">
              <strong>{userName}</strong>
              <span>{session.loggedIn ? (session.isAdmin ? 'Administrator' : 'User') : 'Anonymous'}</span>
            </div>
          </div>
          {session.loggedIn ? (
            <button className="sidebar-action" onClick={() => authSession.logout('/')}>
              <LogOut size={16} />
              Sign out
            </button>
          ) : (
            <button className="sidebar-action primary" onClick={() => redirectToAuthorize('/admin')}>
              <LogIn size={16} />
              Sign in
            </button>
          )}
        </div>
      </aside>

      <div className="workbench">
        <header className="topbar">
          <div>
            <p className="eyebrow">
              <Key size={14} />
              Self-hosted OIDC provider
            </p>
            <h1>{page.title}</h1>
            <p>{page.description}</p>
          </div>
        </header>
        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}
