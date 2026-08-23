import { useState, useEffect } from 'react';
import { Shield, Key, Laptop, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { gossoClient, redirectToAuthorize } from '../auth';
import { PageLoader, Tabs } from '../components/ui';
import ProfilePanel from './settings/ProfilePanel';
import MFAPanel from './settings/MFAPanel';
import PasskeysPanel from './settings/PasskeysPanel';
import SessionsPanel from './settings/SessionsPanel';

const settingsTabs = ['profile', 'mfa', 'passkeys', 'sessions'] as const;
type SettingsTab = (typeof settingsTabs)[number];

function isSettingsTab(value: string | undefined): value is SettingsTab {
  return Boolean(value && settingsTabs.includes(value as SettingsTab));
}

export default function Settings() {
  const { t } = useTranslation();
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = isSettingsTab(tab) ? tab : 'profile';
  const [authChecked, setAuthChecked] = useState(false);
  const profile = gossoClient.getUserProfile();

  useEffect(() => {
    if (!gossoClient.isLoggedIn()) {
      redirectToAuthorize(`/settings/${activeTab}`);
      return;
    }
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return <PageLoader message={t('settings.checkingAccess')} />;
  }

  if (!isSettingsTab(tab)) {
    return <Navigate replace to="/settings/profile" />;
  }

  const tabs = [
    { value: 'profile' as const, label: t('settings.tabProfile'), icon: <User aria-hidden="true" size={16} /> },
    { value: 'mfa' as const, label: t('settings.tabMFA'), icon: <Shield aria-hidden="true" size={16} /> },
    { value: 'passkeys' as const, label: t('settings.tabPasskeys'), icon: <Key aria-hidden="true" size={16} /> },
    { value: 'sessions' as const, label: t('settings.tabSessions'), icon: <Laptop aria-hidden="true" size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Tabs
        value={activeTab}
        items={tabs}
        onValueChange={(next) => navigate(`/settings/${next}`)}
        ariaLabel="Settings sections"
      />

      {activeTab === 'profile' && <ProfilePanel profile={profile} />}
      {activeTab === 'mfa' && <MFAPanel />}
      {activeTab === 'passkeys' && <PasskeysPanel />}
      {activeTab === 'sessions' && <SessionsPanel />}
    </div>
  );
}
