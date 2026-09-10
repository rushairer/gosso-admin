import { Shield, Key, Laptop, Lock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '@gouno/ui/core';
import { PageHeader } from '@gouno/ui/gouno';
import ProfilePanel from './account-settings/ProfilePanel';
import PasswordPanel from './account-settings/PasswordPanel';
import MFAPanel from './account-settings/MFAPanel';
import PasskeysPanel from './account-settings/PasskeysPanel';
import SessionsPanel from './account-settings/SessionsPanel';

const accountSettingsTabs = ['profile', 'password', 'mfa', 'passkeys', 'sessions'] as const;
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
    {
      key: 'profile' as const,
      label: t('accountSettings.tabProfile'),
      icon: <User aria-hidden="true" size={16} />,
      children: <ProfilePanel />,
    },
    {
      key: 'password' as const,
      label: t('accountSettings.tabPassword'),
      icon: <Lock aria-hidden="true" size={16} />,
      children: <PasswordPanel />,
    },
    {
      key: 'mfa' as const,
      label: t('accountSettings.tabMFA'),
      icon: <Shield aria-hidden="true" size={16} />,
      children: <MFAPanel />,
    },
    {
      key: 'passkeys' as const,
      label: t('accountSettings.tabPasskeys'),
      icon: <Key aria-hidden="true" size={16} />,
      children: <PasskeysPanel />,
    },
    {
      key: 'sessions' as const,
      label: t('accountSettings.tabSessions'),
      icon: <Laptop aria-hidden="true" size={16} />,
      children: <SessionsPanel />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('pageTitles.accountSettingsTitle')}
        description={t('pageTitles.accountSettingsDescription')}
      />
      <Tabs<AccountSettingsTab>
        activeKey={activeTab}
        items={tabs}
        onChange={(next) => navigate(`/account-settings/${next}`)}
        aria-label={t('accountSettings.sectionsLabel')}
      />
    </div>
  );
}
