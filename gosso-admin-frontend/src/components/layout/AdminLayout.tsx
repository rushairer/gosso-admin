import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Key, LayoutDashboard, LogIn, LogOut, Settings, ShieldCheck, User } from 'lucide-react';
import { useSession } from '@gosso/client/react';
import { logout, redirectToAuthorize } from '../../auth';
import { siteSettingsService } from '../../services';
import type { SessionSnapshot } from '../../auth';
import { Button, IconButton } from '../ui';

function initials(snapshot: SessionSnapshot) {
  const name = snapshot.profile?.preferred_username || snapshot.profile?.name || 'Guest';
  return name.slice(0, 2).toUpperCase();
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const location = useLocation();
  const session = useSession();
  const [productName, setProductName] = useState('GOSSO');

  const pageTitles: Record<string, { title: string; description: string }> = useMemo(
    () => ({
      '/': {
        title: t('pageTitles.overviewTitle'),
        description: t('pageTitles.overviewDescription'),
      },
      '/system-management': {
        title: t('pageTitles.systemManagementTitle'),
        description: t('pageTitles.systemManagementDescription'),
      },
      '/account-settings': {
        title: t('pageTitles.accountSettingsTitle'),
        description: t('pageTitles.accountSettingsDescription'),
      },
    }),
    [t]
  );

  useEffect(() => {
    void siteSettingsService
      .getPublicSiteBranding()
      .then((branding) => {
        const name = branding.product_name || 'GOSSO';
        setProductName(name);
      })
      .catch(() => undefined);
  }, []);

  const page = useMemo(() => {
    if (location.pathname.startsWith('/system-management')) return pageTitles['/system-management'];
    if (location.pathname.startsWith('/account-settings')) return pageTitles['/account-settings'];
    return pageTitles[location.pathname] || pageTitles['/'];
  }, [pageTitles, location.pathname]);

  const pageLabel = useMemo(() => {
    const systemManagementTab = location.pathname.match(/^\/system-management\/([^/]+)/)?.[1];
    const systemManagementLabels: Record<string, string> = {
      clients: t('systemManagement.tabClients'),
      users: t('systemManagement.tabUsers'),
      'audit-logs': t('systemManagement.tabAuditLogs'),
      'site-settings': t('site.tabLabel'),
      system: t('systemManagement.tabSystemStatus'),
    };
    if (systemManagementTab) {
      return systemManagementLabels[systemManagementTab] || pageTitles['/system-management'].title;
    }

    const accountSettingsTab = location.pathname.match(/^\/account-settings\/([^/]+)/)?.[1];
    const accountSettingsLabels: Record<string, string> = {
      profile: t('accountSettings.tabProfile'),
      password: t('accountSettings.tabPassword'),
      mfa: t('accountSettings.tabMFA'),
      passkeys: t('accountSettings.tabPasskeys'),
      sessions: t('accountSettings.tabSessions'),
    };
    if (accountSettingsTab) {
      return accountSettingsLabels[accountSettingsTab] || pageTitles['/account-settings'].title;
    }
    return page.title;
  }, [location.pathname, page.title, pageTitles, t]);

  useEffect(() => {
    document.title = `${pageLabel} - ${productName} ${t('nav.brandSubtitle')}`;
  }, [pageLabel, productName, t]);

  const userName = session.profile?.preferred_username || session.profile?.name || t('nav.notSignedIn');

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="sidebar-brand">
          <span className="brand-mark">
            <ShieldCheck size={20} />
          </span>
          <span>
            <strong>{productName}</strong>
            <small>{t('nav.brandSubtitle')}</small>
          </span>
        </Link>

        <nav className="sidebar-nav" aria-label={t('nav.primaryNavigation')}>
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <Home size={17} />
            <span>{t('nav.overview')}</span>
          </NavLink>
          {session.loggedIn && session.isAdmin && (
            <NavLink
              to="/system-management/clients"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={17} />
              <span>{t('nav.systemManagement')}</span>
            </NavLink>
          )}
          {session.loggedIn && (
            <NavLink
              to="/account-settings/profile"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Settings size={17} />
              <span>{t('nav.accountSettings')}</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-section-title">{t('nav.sessionSection')}</div>
          <div className="session-card">
            <div className="avatar">{session.loggedIn ? initials(session) : <User size={16} />}</div>
            <div className="session-meta">
              <strong>{userName}</strong>
              <span>
                {session.loggedIn ? (session.isAdmin ? t('nav.administrator') : t('nav.user')) : t('nav.anonymous')}
              </span>
            </div>
          </div>
          {session.loggedIn ? (
            <Button
              variant="secondary"
              className="sidebar-action"
              icon={<LogOut size={16} />}
              onClick={() => logout('/')}
            >
              {t('nav.signOut')}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="sidebar-action primary"
              icon={<LogIn size={16} />}
              onClick={() => redirectToAuthorize('/system-management/clients')}
            >
              {t('nav.signIn')}
            </Button>
          )}
        </div>
      </aside>

      <div className="workbench">
        <header className="topbar">
          <div className="flex-row items-start justify-between flex-1 min-w-0">
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
              <IconButton
                label={t('nav.signOut')}
                icon={<LogOut size={16} />}
                variant="ghost"
                className="mobile-signout"
                onClick={() => logout('/')}
              />
            )}
          </div>
        </header>
        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}
