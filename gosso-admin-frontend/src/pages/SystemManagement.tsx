import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, KeyRound, Shield, SlidersHorizontal, Users } from 'lucide-react';
import { Tabs } from '@gouno/ui/core';
import { PageHeader } from '@gouno/ui/gouno';
import ClientsTab from './system-management/ClientsTab';
import UsersTab from './system-management/UsersTab';
import AuditLogsTab from './system-management/AuditLogsTab';
import SystemStatusTab from './system-management/SystemStatusTab';
import SiteSettingsTab from './system-management/SiteSettingsTab';

const systemManagementTabs = ['clients', 'users', 'audit-logs', 'site-settings', 'system'] as const;
type SystemManagementTab = (typeof systemManagementTabs)[number];

function isSystemManagementTab(value: string | undefined): value is SystemManagementTab {
  return Boolean(value && systemManagementTabs.includes(value as SystemManagementTab));
}

export default function SystemManagement() {
  const { t } = useTranslation();
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = isSystemManagementTab(tab) ? tab : 'clients';
  if (!isSystemManagementTab(tab)) {
    return <Navigate replace to="/system-management/clients" />;
  }

  const tabs = [
    {
      key: 'clients' as const,
      label: t('systemManagement.tabClients'),
      icon: <KeyRound aria-hidden="true" className="size-4" />,
      children: <ClientsTab />,
    },
    {
      key: 'users' as const,
      label: t('systemManagement.tabUsers'),
      icon: <Users aria-hidden="true" className="size-4" />,
      children: <UsersTab />,
    },
    {
      key: 'audit-logs' as const,
      label: t('systemManagement.tabAuditLogs'),
      icon: <FileText aria-hidden="true" className="size-4" />,
      children: <AuditLogsTab />,
    },
    {
      key: 'site-settings' as const,
      label: t('site.tabLabel'),
      icon: <SlidersHorizontal aria-hidden="true" className="size-4" />,
      children: <SiteSettingsTab />,
    },
    {
      key: 'system' as const,
      label: t('systemManagement.tabSystemStatus'),
      icon: <Shield aria-hidden="true" className="size-4" />,
      children: <SystemStatusTab />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('pageTitles.systemManagementTitle')}
        description={t('pageTitles.systemManagementDescription')}
      />
      <Tabs<SystemManagementTab>
        activeKey={activeTab}
        items={tabs}
        onChange={(next) => navigate(`/system-management/${next}`)}
        ariaLabel={t('systemManagement.sectionsLabel')}
      />
    </div>
  );
}
