import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Home,
  Key,
  KeyRound,
  Laptop,
  Lock,
  LogIn,
  LogOut,
  Shield,
  SlidersHorizontal,
  User,
  Users,
} from 'lucide-react';
import { useSession } from '@gosso/client/react';
import { logout, redirectToAuthorize } from '../../auth';
import { siteSettingsService } from '../../services';
import type { SessionSnapshot } from '../../auth';
import { Button, IconButton } from '@gouno/ui/core';
import { AppShell, NavigationGroup, PageContainer, navigationItemClass } from '@gouno/ui/gouno';
import { ThemeToggle } from '@gouno/ui/theme';

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
      .then((branding) => setProductName(branding.product_name || 'GOSSO'))
      .catch(() => undefined);
  }, []);

  const page = useMemo(() => {
    if (location.pathname.startsWith('/system-management')) return pageTitles['/system-management'];
    if (location.pathname.startsWith('/account-settings')) return pageTitles['/account-settings'];
    return pageTitles[location.pathname] || pageTitles['/'];
  }, [pageTitles, location.pathname]);

  const pageLabel = useMemo(() => {
    const systemManagementSection = location.pathname.match(/^\/system-management\/([^/]+)/)?.[1];
    const systemManagementLabels: Record<string, string> = {
      clients: t('systemManagement.tabClients'),
      users: t('systemManagement.tabUsers'),
      'audit-logs': t('systemManagement.tabAuditLogs'),
      'site-settings': t('site.tabLabel'),
      system: t('systemManagement.tabSystemStatus'),
    };
    if (systemManagementSection) {
      return systemManagementLabels[systemManagementSection] || pageTitles['/system-management'].title;
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
  const systemManagementItems = [
    { key: 'clients', label: t('systemManagement.tabClients'), icon: <KeyRound aria-hidden="true" /> },
    { key: 'users', label: t('systemManagement.tabUsers'), icon: <Users aria-hidden="true" /> },
    { key: 'audit-logs', label: t('systemManagement.tabAuditLogs'), icon: <FileText aria-hidden="true" /> },
    { key: 'site-settings', label: t('site.tabLabel'), icon: <SlidersHorizontal aria-hidden="true" /> },
    { key: 'system', label: t('systemManagement.tabSystemStatus'), icon: <Shield aria-hidden="true" /> },
  ];
  const accountItems = [
    { key: 'profile', label: t('accountSettings.tabProfile'), icon: <User aria-hidden="true" /> },
    { key: 'password', label: t('accountSettings.tabPassword'), icon: <Lock aria-hidden="true" /> },
    { key: 'mfa', label: t('accountSettings.tabMFA'), icon: <Shield aria-hidden="true" /> },
    { key: 'passkeys', label: t('accountSettings.tabPasskeys'), icon: <Key aria-hidden="true" /> },
    { key: 'sessions', label: t('accountSettings.tabSessions'), icon: <Laptop aria-hidden="true" /> },
  ];

  return (
    <AppShell
      brand={<Link to="/">{productName}</Link>}
      breadcrumbs={pageLabel}
      navigationLabel={t('nav.primaryNavigation')}
      navigation={(close) => (
        <>
          <NavigationGroup>
            <NavLink to="/" end className={navigationItemClass} onClick={close}>
              <Home />
              <span>{t('nav.overview')}</span>
            </NavLink>
          </NavigationGroup>
          {session.loggedIn && session.isAdmin ? (
            <NavigationGroup label={t('nav.systemManagement')}>
              {systemManagementItems.map(({ key, label, icon }) => (
                <NavLink key={key} to={`/system-management/${key}`} className={navigationItemClass} onClick={close}>
                  {icon}
                  <span>{label}</span>
                </NavLink>
              ))}
            </NavigationGroup>
          ) : null}
          {session.loggedIn ? (
            <NavigationGroup label={t('nav.accountSettings')}>
              {accountItems.map(({ key, label, icon }) => (
                <NavLink key={key} to={`/account-settings/${key}`} className={navigationItemClass} onClick={close}>
                  {icon}
                  <span>{label}</span>
                </NavLink>
              ))}
            </NavigationGroup>
          ) : null}
        </>
      )}
      toolbar={
        <ThemeToggle
          label="Theme / 主题"
          labels={{ light: 'Light / 浅色', dark: 'Dark / 深色', system: 'System / 跟随系统' }}
        />
      }
      account={
        session.loggedIn ? (
          <IconButton label={t('nav.signOut')} icon={<LogOut />} onClick={() => logout('/')} />
        ) : (
          <Button
            variant="solid"
            color="primary"
            icon={<LogIn />}
            onClick={() => redirectToAuthorize('/system-management/clients')}
          >
            {t('nav.signIn')}
          </Button>
        )
      }
      footer={
        <div className="flex items-center gap-3 px-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-medium text-primary">
            {session.loggedIn ? initials(session) : <User />}
          </span>
          <div className="min-w-0">
            <strong className="block truncate text-sm">{userName}</strong>
            <p className="m-0 text-xs text-muted-foreground">
              {session.loggedIn ? (session.isAdmin ? t('nav.administrator') : t('nav.user')) : t('nav.anonymous')}
            </p>
          </div>
        </div>
      }
    >
      <PageContainer>{children}</PageContainer>
    </AppShell>
  );
}
