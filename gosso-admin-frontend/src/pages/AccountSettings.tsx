import { Shield, Key, Laptop, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '../components/ui';
import ProfilePanel from './account-settings/ProfilePanel';
import MFAPanel from './account-settings/MFAPanel';
import PasskeysPanel from './account-settings/PasskeysPanel';
import SessionsPanel from './account-settings/SessionsPanel';

const accountSettingsTabs = ['profile', 'mfa', 'passkeys', 'sessions'] as const;
type AccountSettingsTab = (typeof accountSettingsTabs)[number];

function isAccountSettingsTab(value: string | undefined): value is AccountSettingsTab {
  return Boolean(value && accountSettingsTabs.includes(value as AccountSettingsTab));
}

export default function AccountSettings() {
  const { t } = useTranslation();
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = isAccountSettingsTab(tab) ? tab : 'profile';
  if (!isAccountSettingsTab(tab)) {
    return <Navigate replace to="/account-settings/profile" />;
  }

  const tabs = [
    { value: 'profile' as const, label: t('accountSettings.tabProfile'), icon: <User aria-hidden="true" size={16} /> },
    { value: 'mfa' as const, label: t('accountSettings.tabMFA'), icon: <Shield aria-hidden="true" size={16} /> },
    { value: 'passkeys' as const, label: t('accountSettings.tabPasskeys'), icon: <Key aria-hidden="true" size={16} /> },
    {
      value: 'sessions' as const,
      label: t('accountSettings.tabSessions'),
      icon: <Laptop aria-hidden="true" size={16} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Tabs
        value={activeTab}
        items={tabs}
        onValueChange={(next) => navigate(`/account-settings/${next}`)}
        ariaLabel={t('accountSettings.sectionsLabel')}
      />

      {activeTab === 'profile' && <ProfilePanel />}
      {activeTab === 'mfa' && <MFAPanel />}
      {activeTab === 'passkeys' && <PasskeysPanel />}
      {activeTab === 'sessions' && <SessionsPanel />}
    </div>
  );
}
