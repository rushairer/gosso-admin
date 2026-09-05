import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Key, LayoutDashboard, LogIn, LogOut, Settings, ShieldCheck, User } from 'lucide-react';
import { useSession } from '@gosso/client/react';
import { logout, redirectToAuthorize } from '../../auth';
import { siteSettingsService } from '../../services';
import type { SessionSnapshot } from '../../auth';
import { Button, IconButton } from '../ui';
import { cn } from '../../lib/utils';

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
    <div className="grid min-h-screen w-full lg:grid-cols-[260px_1fr] bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-[#11161d] p-4 lg:flex">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 px-2 py-3 mb-2 rounded-lg hover:bg-card/50 transition-colors">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck size={20} />
          </span>
          <div className="flex flex-col">
            <strong className="text-base font-bold leading-tight text-foreground">{productName}</strong>
            <small className="text-xs text-muted-foreground font-medium">{t('nav.brandSubtitle')}</small>
          </div>
        </Link>

        {/* Navigation */}
        <nav
          className="flex flex-1 flex-col gap-1 pt-3 border-t border-border/60"
          aria-label={t('nav.primaryNavigation')}
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )
            }
          >
            <Home size={17} />
            <span>{t('nav.overview')}</span>
          </NavLink>
          {session.loggedIn && session.isAdmin && (
            <NavLink
              to="/system-management/clients"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <LayoutDashboard size={17} />
              <span>{t('nav.systemManagement')}</span>
            </NavLink>
          )}
          {session.loggedIn && (
            <NavLink
              to="/account-settings/profile"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <Settings size={17} />
              <span>{t('nav.accountSettings')}</span>
            </NavLink>
          )}
        </nav>

        {/* Session card */}
        <div className="flex flex-col gap-3 pt-4 border-t border-border/60">
          <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
            {t('nav.sessionSection')}
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold text-xs">
              {session.loggedIn ? initials(session) : <User size={16} />}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-xs font-semibold text-foreground">{userName}</strong>
              <span className="block truncate text-[11px] text-muted-foreground">
                {session.loggedIn ? (session.isAdmin ? t('nav.administrator') : t('nav.user')) : t('nav.anonymous')}
              </span>
            </div>
          </div>
          {session.loggedIn ? (
            <Button variant="secondary" size="sm" icon={<LogOut size={15} />} onClick={() => logout('/')}>
              {t('nav.signOut')}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<LogIn size={15} />}
              onClick={() => redirectToAuthorize('/system-management/clients')}
            >
              {t('nav.signIn')}
            </Button>
          )}
        </div>
      </aside>

      {/* Main Workbench */}
      <div className="flex min-w-0 flex-col">
        {/* Top Header */}
        <header className="flex flex-col justify-end border-b border-border bg-[#121720] px-6 py-6 lg:px-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Key size={13} />
                {t('nav.selfHostedProvider')}
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground lg:text-3xl">{page.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{page.description}</p>
            </div>
            {session.loggedIn && (
              <IconButton
                label={t('nav.signOut')}
                icon={<LogOut size={16} />}
                variant="ghost"
                className="lg:hidden shrink-0"
                onClick={() => logout('/')}
              />
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="w-full max-w-7xl mx-auto p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
