import { useState, useEffect } from 'react';
import { Shield, Key, Laptop, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUserProfile, isLoggedIn, redirectToAuthorize } from '../auth';
import ProfilePanel from './settings/ProfilePanel';
import MFAPanel from './settings/MFAPanel';
import PasskeysPanel from './settings/PasskeysPanel';
import SessionsPanel from './settings/SessionsPanel';

export default function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'mfa' | 'passkeys' | 'sessions'>('profile');
  const [authChecked, setAuthChecked] = useState(false);
  const profile = getUserProfile();

  useEffect(() => {
    if (!isLoggedIn()) {
      redirectToAuthorize('/settings');
      return;
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
        <p style={{ color: 'var(--color-text-muted)' }}>{t('settings.checkingAccess')}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User
            style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }}
          />
          {t('settings.tabProfile')}
        </button>
        <button className={`tab-btn ${activeTab === 'mfa' ? 'active' : ''}`} onClick={() => setActiveTab('mfa')}>
          <Shield
            style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }}
          />
          {t('settings.tabMFA')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'passkeys' ? 'active' : ''}`}
          onClick={() => setActiveTab('passkeys')}
        >
          <Key
            style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }}
          />
          {t('settings.tabPasskeys')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <Laptop
            style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline', verticalAlign: 'middle' }}
          />
          {t('settings.tabSessions')}
        </button>
      </div>

      {activeTab === 'profile' && <ProfilePanel profile={profile} />}
      {activeTab === 'mfa' && <MFAPanel />}
      {activeTab === 'passkeys' && <PasskeysPanel />}
      {activeTab === 'sessions' && <SessionsPanel />}
    </div>
  );
}
