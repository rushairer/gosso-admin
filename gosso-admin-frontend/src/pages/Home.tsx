import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, UserCheck, Key, Settings, User, Shield, Laptop, Info, LogOut } from 'lucide-react';
import { useSession } from '@gosso/client/react';
import { logout } from '../auth';
import { Button, Card } from '../components/ui';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin: userAdmin, profile: user } = useSession();

  const userName = user?.preferred_username || user?.name || (userAdmin ? 'Administrator' : 'User');

  return (
    <div className="flex-col gap-2xl">
      <Card className="home-hero">
        <div className="flex-col gap-xl">
          <div className="home-badge-icon">
            {userAdmin ? (
              <ShieldCheck size={28} color="var(--action-primary)" />
            ) : (
              <UserCheck size={28} color="var(--action-primary)" />
            )}
          </div>

          <h2 style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--text-primary)' }}>
            {userAdmin ? t('home.title') : t('home.userTitle')}
          </h2>

          <p className="text-muted" style={{ maxWidth: '680px', lineHeight: 'var(--line-height-relaxed)' }}>
            {userAdmin ? t('home.description') : t('home.userDescription')}
          </p>

          <div>
            {userAdmin ? (
              <div className="flex-row items-center flex-wrap gap-lg">
                <p className="flex-row items-center gap-xs font-bold" style={{ color: 'var(--status-success)' }}>
                  <span className="status-dot" />
                  {t('home.loggedInAsAdmin', { name: userName })}
                </p>
                <Button
                  variant="primary"
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                  onClick={() => navigate('/system-management')}
                >
                  {t('home.enterDashboard')}
                </Button>
              </div>
            ) : (
              <div className="flex-row items-center flex-wrap gap-lg">
                <p className="flex-row items-center gap-xs font-bold" style={{ color: 'var(--status-success)' }}>
                  <span className="status-dot" />
                  {t('home.loggedInAsUser', { name: userName })}
                </p>
                <Button
                  variant="primary"
                  icon={<ArrowRight size={16} />}
                  iconPosition="right"
                  onClick={() => navigate('/account-settings/profile')}
                >
                  {t('home.goToAccountSettings')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {!userAdmin && (
        <Card className="home-admin-notice flex-row items-center justify-between flex-wrap gap-md">
          <div className="flex-row items-center gap-md" style={{ flex: '1 1 300px' }}>
            <Info size={20} color="var(--action-primary)" style={{ flexShrink: 0 }} />
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              {t('home.adminNotice')}
            </p>
          </div>
          <Button variant="secondary" size="sm" icon={<LogOut size={14} />} onClick={() => logout('/')}>
            {t('home.switchAccount')}
          </Button>
        </Card>
      )}

      {userAdmin ? (
        <div className="card-grid">
          <Card
            className="glass-card--interactive flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/clients')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/clients')}
          >
            <div style={{ color: 'var(--action-primary)' }}>
              <Key size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
              {t('home.clientRegistry')}
            </h3>
            <p className="text-muted text-sm">{t('home.clientRegistryDescription')}</p>
          </Card>

          <Card
            className="glass-card--interactive flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/users')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/users')}
          >
            <div style={{ color: 'var(--text-secondary)' }}>
              <UserCheck size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>{t('home.userControl')}</h3>
            <p className="text-muted text-sm">{t('home.userControlDescription')}</p>
          </Card>

          <Card
            className="glass-card--interactive flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/system')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/system')}
          >
            <div style={{ color: 'var(--action-primary)' }}>
              <Settings size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
              {t('home.mfaAndPasskeys')}
            </h3>
            <p className="text-muted text-sm">{t('home.mfaAndPasskeysDescription')}</p>
          </Card>
        </div>
      ) : (
        <div className="card-grid">
          <Card
            className="glass-card--interactive flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/profile')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/profile')}
          >
            <div style={{ color: 'var(--action-primary)' }}>
              <User size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>{t('home.userProfile')}</h3>
            <p className="text-muted text-sm">{t('home.userProfileDescription')}</p>
          </Card>

          <Card
            className="glass-card--interactive flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/mfa')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/mfa')}
          >
            <div style={{ color: 'var(--text-secondary)' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>{t('home.userSecurity')}</h3>
            <p className="text-muted text-sm">{t('home.userSecurityDescription')}</p>
          </Card>

          <Card
            className="glass-card--interactive flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/sessions')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/sessions')}
          >
            <div style={{ color: 'var(--action-primary)' }}>
              <Laptop size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>{t('home.userSessions')}</h3>
            <p className="text-muted text-sm">{t('home.userSessionsDescription')}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
