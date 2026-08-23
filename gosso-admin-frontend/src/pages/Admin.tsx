import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Key as KeyIcon,
  User as UserIcon,
  Shield as ShieldIcon,
  FileText as AuditIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { gossoClient, redirectToAuthorize } from '../auth';
import { Panel, PageLoader, Tabs } from '../components/ui';
import ClientsTab from './admin/ClientsTab';
import UsersTab from './admin/UsersTab';
import AuditLogsTab from './admin/AuditLogsTab';
import SystemStatusTab from './admin/SystemStatusTab';
import InstanceSettingsTab from './admin/InstanceSettingsTab';

const adminTabs = ['clients', 'users', 'audit-logs', 'instance-settings', 'system'] as const;
type AdminTab = (typeof adminTabs)[number];

function isAdminTab(value: string | undefined): value is AdminTab {
  return Boolean(value && adminTabs.includes(value as AdminTab));
}

export default function Admin() {
  const { t } = useTranslation();
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = isAdminTab(tab) ? tab : 'clients';
  const [accessDenied, setAccessDenied] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!gossoClient.isLoggedIn()) {
      redirectToAuthorize(`/admin/${activeTab}`);
      return;
    }

    if (!gossoClient.isAdmin()) {
      setAccessDenied(true);
    }
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return <PageLoader message={t('admin.checkingAccess')} />;
  }

  if (!isAdminTab(tab)) {
    return <Navigate replace to="/admin/clients" />;
  }

  if (accessDenied) {
    return (
      <div
        className="glass-card"
        style={{
          maxWidth: '560px',
          margin: '80px auto',
          textAlign: 'center',
          padding: '48px 32px',
          borderLeft: '4px solid var(--warning-color)',
        }}
      >
        <ShieldIcon
          style={{
            width: '48px',
            height: '48px',
            color: 'var(--warning-color)',
            marginBottom: '20px',
            display: 'inline-block',
          }}
        />
        <h3 style={{ color: 'var(--color-text-main)', marginBottom: '12px', fontSize: '20px' }}>
          {t('admin.accessDeniedTitle')}
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          {t('admin.accessDeniedDescription')}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => (window.location.href = '/')}>
            {t('admin.backHome')}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { value: 'clients' as const, label: t('admin.tabClients'), icon: <KeyIcon aria-hidden="true" size={16} /> },
    { value: 'users' as const, label: t('admin.tabUsers'), icon: <UserIcon aria-hidden="true" size={16} /> },
    {
      value: 'audit-logs' as const,
      label: t('admin.tabAuditLogs'),
      icon: <AuditIcon aria-hidden="true" size={16} />,
    },
    {
      value: 'instance-settings' as const,
      label: t('instance.tabLabel'),
      icon: <SlidersHorizontal aria-hidden="true" size={16} />,
    },
    { value: 'system' as const, label: t('admin.tabSystemStatus'), icon: <ShieldIcon aria-hidden="true" size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Tabs
        value={activeTab}
        items={tabs}
        onValueChange={(next) => navigate(`/admin/${next}`)}
        ariaLabel="Administration sections"
      />

      <Panel>
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'audit-logs' && <AuditLogsTab />}
        {activeTab === 'instance-settings' && <InstanceSettingsTab />}
        {activeTab === 'system' && <SystemStatusTab />}
      </Panel>
    </div>
  );
}
