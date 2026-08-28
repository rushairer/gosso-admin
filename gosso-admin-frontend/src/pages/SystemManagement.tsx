import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Key as KeyIcon,
  User as UserIcon,
  Shield as ShieldIcon,
  FileText as AuditIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { Panel, Tabs } from '../components/ui';
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
      value: 'clients' as const,
      label: t('systemManagement.tabClients'),
      icon: <KeyIcon aria-hidden="true" size={16} />,
    },
    {
      value: 'users' as const,
      label: t('systemManagement.tabUsers'),
      icon: <UserIcon aria-hidden="true" size={16} />,
    },
    {
      value: 'audit-logs' as const,
      label: t('systemManagement.tabAuditLogs'),
      icon: <AuditIcon aria-hidden="true" size={16} />,
    },
    {
      value: 'site-settings' as const,
      label: t('site.tabLabel'),
      icon: <SlidersHorizontal aria-hidden="true" size={16} />,
    },
    {
      value: 'system' as const,
      label: t('systemManagement.tabSystemStatus'),
      icon: <ShieldIcon aria-hidden="true" size={16} />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Tabs
        value={activeTab}
        items={tabs}
        onValueChange={(next) => navigate(`/system-management/${next}`)}
        ariaLabel={t('systemManagement.sectionsLabel')}
      />

      <Panel>
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'audit-logs' && <AuditLogsTab />}
        {activeTab === 'site-settings' && <SiteSettingsTab />}
        {activeTab === 'system' && <SystemStatusTab />}
      </Panel>
    </div>
  );
}
