import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Key, LayoutDashboard, LogIn, LogOut, Settings, ShieldCheck, User } from 'lucide-react';
import { authSession, redirectToAuthorize } from '../../services/authSession';
import type { SessionSnapshot } from '../../services/authSession';

function initials(snapshot: SessionSnapshot) {
  const name = snapshot.profile?.preferred_username || snapshot.profile?.name || 'Guest';
  return name.slice(0, 2).toUpperCase();
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [session, setSession] = useState<SessionSnapshot>(() => authSession.getSnapshot());

  const pageTitles: Record<string, { title: string; description: string }> = useMemo(() => ({
    '/': {
      title: t('pageTitles.overviewTitle'),
      description: t('pageTitles.overviewDescription'),
    },
    '/admin': {
      title: t('pageTitles.administrationTitle'),
      description: t('pageTitles.administrationDescription'),
    },
    '/settings': {
      title: t('pageTitles.settingsTitle'),
      description: t('pageTitles.settingsDescription'),
    },
  }), [t]);

  useEffect(() => {
    setSession(authSession.getSnapshot());
  }, [location.pathname]);

  const page = useMemo(() => pageTitles[location.pathname] || pageTitles['/'], [pageTitles, location.pathname]);
  const userName = session.profile?.preferred_username || session.profile?.name || t('nav.notSignedIn');

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand">
          <span className="brand-mark">
            <ShieldCheck size={20} />
          </span>
          <span>
            <strong>{t('nav.brandName')}</strong>
            <small>{t('nav.brandSubtitle')}</small>
          </span>
        </Link>

        <nav className="sidebar-nav" aria-label="Primary">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Home size={17} />
            <span>{t('nav.overview')}</span>
          </NavLink>
          {session.loggedIn && session.isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={17} />
              <span>{t('nav.administration')}</span>
            </NavLink>
          )}
          {session.loggedIn && (
            <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Settings size={17} />
              <span>{t('nav.settings')}</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('nav.sessionSection')}</div>
          <div className="session-card">
            <div className="avatar">{session.loggedIn ? initials(session) : <User size={16} />}</div>
            <div className="session-meta">
              <strong>{userName}</strong>
              <span>{session.loggedIn ? (session.isAdmin ? t('nav.administrator') : t('nav.user')) : t('nav.anonymous')}</span>
            </div>
          </div>
          {session.loggedIn ? (
            <button className="sidebar-action" onClick={() => authSession.logout('/')}>
              <LogOut size={16} />
              {t('nav.signOut')}
            </button>
          ) : (
            <button className="sidebar-action primary" onClick={() => redirectToAuthorize('/admin')}>
              <LogIn size={16} />
              {t('nav.signIn')}
            </button>
          )}
        </div>
      </aside>

      <div className="workbench">
        <header className="topbar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div>
              <p className="eyebrow">
                <Key size={14} />
                {t('nav.selfHostedProvider')}
              </p>
              <h1>{page.title}</h1>
              <p>{page.description}</p>
            </div>
            {/* Mobile session indicator — hidden on desktop via CSS */}
            {session.loggedIn && (
              <button
                className="mobile-signout"
                onClick={() => authSession.logout('/')}
                title={t('nav.signOut')}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </header>
        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}
