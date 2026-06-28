import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Key as KeyIcon, User as UserIcon, Shield as ShieldIcon, FileText as AuditIcon } from 'lucide-react';
import { isLoggedIn, isAdmin, redirectToAuthorize } from '../auth';
import { Panel } from '../components/ui';
import ClientsTab from './admin/ClientsTab';
import UsersTab from './admin/UsersTab';
import AuditLogsTab from './admin/AuditLogsTab';
import SystemStatusTab from './admin/SystemStatusTab';

export default function Admin() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'clients' | 'users' | 'audit-logs' | 'system'>('clients');
  const [accessDenied, setAccessDenied] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      redirectToAuthorize('/admin');
      return;
    }

    if (!isAdmin()) {
      setAccessDenied(true);
    }
    setAuthChecked(true);
  }, []);

  if (!authChecked) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center' }}>
        <div
          style={{
            margin: '0 auto 16px auto',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.06)',
            borderTopColor: 'var(--color-primary)',
            animation: 'spin 1s linear infinite',
          }}
        />
        <p style={{ color: 'var(--color-text-muted)' }}>{t('admin.checkingAccess')}</p>
      </div>
    );
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          <KeyIcon
            style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }}
          />
          {t('admin.tabClients')}
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <UserIcon
            style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }}
          />
          {t('admin.tabUsers')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'audit-logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit-logs')}
        >
          <AuditIcon
            style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }}
          />
          {t('admin.tabAuditLogs')}
        </button>
        <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
          <ShieldIcon
            style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }}
          />
          {t('admin.tabSystemStatus')}
        </button>
      </div>

      <Panel>
        {activeTab === 'clients' && <ClientsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'audit-logs' && <AuditLogsTab />}
        {activeTab === 'system' && <SystemStatusTab />}
      </Panel>
    </div>
  );
}
