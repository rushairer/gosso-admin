import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, LayoutDashboard, LogIn, LogOut, Settings, User } from 'lucide-react';
import { useSession } from '@gosso/client/react';
import { logout, redirectToAuthorize } from '../../auth';
import { siteSettingsService } from '../../services';
import type { SessionSnapshot } from '../../auth';
import { Button, IconButton } from '@gouno/ui';
import { AdminShell, NavigationGroup, navigationItemClass, ThemeToggle } from '@gouno/ui';

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

  const systemItems = [['clients',t('systemManagement.tabClients')],['users',t('systemManagement.tabUsers')],['audit-logs',t('systemManagement.tabAuditLogs')],['site-settings',t('site.tabLabel')],['system',t('systemManagement.tabSystemStatus')]];
  const accountItems = [['profile',t('accountSettings.tabProfile')],['password',t('accountSettings.tabPassword')],['mfa',t('accountSettings.tabMFA')],['passkeys',t('accountSettings.tabPasskeys')],['sessions',t('accountSettings.tabSessions')]];
  return <AdminShell brand={<Link to="/">{productName}</Link>} breadcrumbs={pageLabel} navigationLabel={t('nav.primaryNavigation')}
    navigation={close => <><NavLink to="/" end className={navigationItemClass} onClick={close}><Home/><span>{t('nav.overview')}</span></NavLink>{session.loggedIn && session.isAdmin ? <NavigationGroup label={t('nav.systemManagement')}>{systemItems.map(([key,label]) => <NavLink key={key} to={`/system-management/${key}`} className={navigationItemClass} onClick={close}><LayoutDashboard/><span>{label}</span></NavLink>)}</NavigationGroup> : null}{session.loggedIn ? <NavigationGroup label={t('nav.accountSettings')}>{accountItems.map(([key,label]) => <NavLink key={key} to={`/account-settings/${key}`} className={navigationItemClass} onClick={close}><Settings/><span>{label}</span></NavLink>)}</NavigationGroup> : null}</>}
    toolbar={<ThemeToggle label="Theme / 主题" labels={{light:'Light / 浅色',dark:'Dark / 深色',system:'System / 跟随系统'}}/>}
    account={session.loggedIn ? <IconButton label={t('nav.signOut')} icon={<LogOut/>} onClick={() => logout('/')}/> : <Button variant="primary" icon={<LogIn/>} onClick={() => redirectToAuthorize('/system-management/clients')}>{t('nav.signIn')}</Button>}
    footer={<div className="flex items-center gap-3 px-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-medium text-primary">{session.loggedIn ? initials(session) : <User/>}</span><div className="min-w-0"><strong className="block truncate text-sm">{userName}</strong><p className="text-xs text-muted-foreground">{session.loggedIn ? session.isAdmin ? t('nav.administrator') : t('nav.user') : t('nav.anonymous')}</p></div></div>}
  >{children}</AdminShell>;
}
