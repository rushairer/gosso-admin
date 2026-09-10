import type { ComponentType } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@gouno/ui/gouno';
import ClientsPanel from './system-management/ClientsTab';
import UsersPanel from './system-management/UsersTab';
import AuditLogsPanel from './system-management/AuditLogsTab';
import SystemStatusPanel from './system-management/SystemStatusTab';
import SiteSettingsPanel from './system-management/SiteSettingsTab';

const systemManagementSections = ['clients', 'users', 'audit-logs', 'site-settings', 'system'] as const;
type SystemManagementSection = (typeof systemManagementSections)[number];

type SectionConfig = {
  titleKey: string;
  panel: ComponentType;
};

const sectionConfig: Record<SystemManagementSection, SectionConfig> = {
  clients: {
    titleKey: 'systemManagement.tabClients',
    panel: ClientsPanel,
  },
  users: {
    titleKey: 'systemManagement.tabUsers',
    panel: UsersPanel,
  },
  'audit-logs': {
    titleKey: 'systemManagement.tabAuditLogs',
    panel: AuditLogsPanel,
  },
  'site-settings': {
    titleKey: 'site.tabLabel',
    panel: SiteSettingsPanel,
  },
  system: {
    titleKey: 'systemManagement.tabSystemStatus',
    panel: SystemStatusPanel,
  },
};

function isSystemManagementSection(value: string | undefined): value is SystemManagementSection {
  return Boolean(value && systemManagementSections.includes(value as SystemManagementSection));
}

export default function SystemManagement() {
  const { t } = useTranslation();
  const { section } = useParams();

  if (!isSystemManagementSection(section)) {
    return <Navigate replace to="/system-management/clients" />;
  }

  const page = sectionConfig[section];
  const Panel = page.panel;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t(page.titleKey)} />
      <Panel />
    </div>
  );
}
