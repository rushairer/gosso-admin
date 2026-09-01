import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, UserCheck, Key, Settings, User, Shield, Laptop, Info, LogOut } from 'lucide-react';
import { useSession } from '@gosso/client/react';
import { logout } from '../auth';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin: userAdmin, profile: user } = useSession();

  const userName = user?.preferred_username || user?.name || (userAdmin ? 'Administrator' : 'User');

  return (
    <div className="flex-col gap-2xl">
      <div className="glass-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
        <div className="flex-col gap-xl">
          <div
            style={{
              background: 'rgba(59, 130, 246, 0.12)',
              padding: '12px',
              borderRadius: '8px',
              display: 'inline-flex',
              width: 'fit-content',
              border: '1px solid rgba(59, 130, 246, 0.22)',
            }}
          >
            {userAdmin ? (
              <ShieldCheck style={{ width: '28px', height: '28px', stroke: 'var(--color-primary)' }} />
            ) : (
              <UserCheck style={{ width: '28px', height: '28px', stroke: 'var(--color-primary)' }} />
            )}
          </div>

          <h2 style={{ fontSize: '26px', lineHeight: '1.25', color: 'var(--color-text-main)' }}>
            {userAdmin ? t('home.title') : t('home.userTitle')}
          </h2>

          <p className="text-muted" style={{ fontSize: '15px', maxWidth: '680px', lineHeight: '1.6' }}>
            {userAdmin ? t('home.description') : t('home.userDescription')}
          </p>

          <div>
            {userAdmin ? (
              <div className="flex-row items-center flex-wrap gap-lg">
                <p
                  className="flex-row items-center gap-xs"
                  style={{
                    color: 'var(--success-color)',
                    fontWeight: '600',
                    fontSize: '15px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success-color)',
                    }}
                  />
                  {t('home.loggedInAsAdmin', { name: userName })}
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/system-management')}>
                  {t('home.enterDashboard')}
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            ) : (
              <div className="flex-row items-center flex-wrap gap-lg">
                <p
                  className="flex-row items-center gap-xs"
                  style={{
                    color: 'var(--success-color)',
                    fontWeight: '600',
                    fontSize: '15px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success-color)',
                    }}
                  />
                  {t('home.loggedInAsUser', { name: userName })}
                </p>
                <button className="btn btn-primary" onClick={() => navigate('/account-settings/profile')}>
                  {t('home.goToAccountSettings')}
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!userAdmin && (
        <div
          className="glass-card flex-row items-center justify-between flex-wrap gap-md"
          style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(59, 130, 246, 0.05)',
            borderColor: 'rgba(59, 130, 246, 0.2)',
          }}
        >
          <div className="flex-row items-center gap-md" style={{ flex: '1 1 300px' }}>
            <Info style={{ width: '20px', height: '20px', color: 'var(--color-primary)', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: '1.5', margin: 0 }}>
              {t('home.adminNotice')}
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => logout('/')}>
            <LogOut style={{ width: '14px', height: '14px' }} />
            {t('home.switchAccount')}
          </button>
        </div>
      )}

      {userAdmin ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
          <div
            className="glass-card glass-card--interactive flex-col gap-md"
            style={{ padding: '24px' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/clients')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/clients')}
          >
            <div style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
              <Key style={{ width: '24px', height: '24px' }} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>{t('home.clientRegistry')}</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {t('home.clientRegistryDescription')}
            </p>
          </div>

          <div
            className="glass-card glass-card--interactive flex-col gap-md"
            style={{ padding: '24px' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/users')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/users')}
          >
            <div style={{ display: 'inline-flex', color: 'var(--color-secondary)' }}>
              <UserCheck style={{ width: '24px', height: '24px' }} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>{t('home.userControl')}</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {t('home.userControlDescription')}
            </p>
          </div>

          <div
            className="glass-card glass-card--interactive flex-col gap-md"
            style={{ padding: '24px' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/system')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/system')}
          >
            <div style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
              <Settings style={{ width: '24px', height: '24px' }} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>{t('home.mfaAndPasskeys')}</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {t('home.mfaAndPasskeysDescription')}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
          <div
            className="glass-card glass-card--interactive flex-col gap-md"
            style={{ padding: '24px' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/profile')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/profile')}
          >
            <div style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
              <User style={{ width: '24px', height: '24px' }} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>{t('home.userProfile')}</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {t('home.userProfileDescription')}
            </p>
          </div>

          <div
            className="glass-card glass-card--interactive flex-col gap-md"
            style={{ padding: '24px' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/mfa')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/mfa')}
          >
            <div style={{ display: 'inline-flex', color: 'var(--color-secondary)' }}>
              <Shield style={{ width: '24px', height: '24px' }} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>{t('home.userSecurity')}</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {t('home.userSecurityDescription')}
            </p>
          </div>

          <div
            className="glass-card glass-card--interactive flex-col gap-md"
            style={{ padding: '24px' }}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/sessions')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/sessions')}
          >
            <div style={{ display: 'inline-flex', color: 'var(--color-primary)' }}>
              <Laptop style={{ width: '24px', height: '24px' }} />
            </div>
            <h3 style={{ fontSize: '18px', color: 'var(--color-text-main)' }}>{t('home.userSessions')}</h3>
            <p className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              {t('home.userSessionsDescription')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
