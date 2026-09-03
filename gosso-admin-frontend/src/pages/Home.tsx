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

          <h2 className="home-hero-title">{userAdmin ? t('home.title') : t('home.userTitle')}</h2>

          <p className="text-muted home-hero-desc">{userAdmin ? t('home.description') : t('home.userDescription')}</p>

          <div>
            {userAdmin ? (
              <div className="flex-row items-center flex-wrap gap-lg">
                <p className="flex-row items-center gap-xs font-bold home-user-status">
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
                <p className="flex-row items-center gap-xs font-bold home-user-status">
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
          <div className="flex-row items-center gap-md flex-1">
            <Info size={20} color="var(--action-primary)" className="shrink-0" />
            <p className="text-muted text-sm m-0">{t('home.adminNotice')}</p>
          </div>
          <Button variant="secondary" size="sm" icon={<LogOut size={14} />} onClick={() => logout('/')}>
            {t('home.switchAccount')}
          </Button>
        </Card>
      )}

      {userAdmin ? (
        <div className="card-grid">
          <Card
            className="home-nav-card flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/clients')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/clients')}
          >
            <div className="home-nav-card__icon">
              <Key size={24} />
            </div>
            <h3 className="home-nav-card__title">{t('home.clientRegistry')}</h3>
            <p className="text-muted text-sm">{t('home.clientRegistryDescription')}</p>
          </Card>

          <Card
            className="home-nav-card flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/users')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/users')}
          >
            <div className="home-nav-card__icon--secondary">
              <UserCheck size={24} />
            </div>
            <h3 className="home-nav-card__title">{t('home.userControl')}</h3>
            <p className="text-muted text-sm">{t('home.userControlDescription')}</p>
          </Card>

          <Card
            className="home-nav-card flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/system')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/system')}
          >
            <div className="home-nav-card__icon">
              <Settings size={24} />
            </div>
            <h3 className="home-nav-card__title">{t('home.mfaAndPasskeys')}</h3>
            <p className="text-muted text-sm">{t('home.mfaAndPasskeysDescription')}</p>
          </Card>
        </div>
      ) : (
        <div className="card-grid">
          <Card
            className="home-nav-card flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/profile')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/profile')}
          >
            <div className="home-nav-card__icon">
              <User size={24} />
            </div>
            <h3 className="home-nav-card__title">{t('home.userProfile')}</h3>
            <p className="text-muted text-sm">{t('home.userProfileDescription')}</p>
          </Card>

          <Card
            className="home-nav-card flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/mfa')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/mfa')}
          >
            <div className="home-nav-card__icon--secondary">
              <Shield size={24} />
            </div>
            <h3 className="home-nav-card__title">{t('home.userSecurity')}</h3>
            <p className="text-muted text-sm">{t('home.userSecurityDescription')}</p>
          </Card>

          <Card
            className="home-nav-card flex-col gap-md"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/sessions')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/sessions')}
          >
            <div className="home-nav-card__icon">
              <Laptop size={24} />
            </div>
            <h3 className="home-nav-card__title">{t('home.userSessions')}</h3>
            <p className="text-muted text-sm">{t('home.userSessionsDescription')}</p>
          </Card>
        </div>
      )}
    </div>
  );
}
