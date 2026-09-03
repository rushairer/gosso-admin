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
    <div className="flex flex-col gap-6 lg:gap-8">
      <Card className="home-hero p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-start gap-4">
            <div className="home-badge-icon">
              {userAdmin ? (
                <ShieldCheck size={28} color="var(--action-primary)" />
              ) : (
                <UserCheck size={28} color="var(--action-primary)" />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="home-hero-title text-xl sm:text-2xl font-bold tracking-tight m-0">
                {userAdmin ? t('home.title') : t('home.userTitle')}
              </h2>
              <p className="home-hero-desc text-sm leading-relaxed text-[var(--color-text-muted)] max-w-2xl m-0">
                {userAdmin ? t('home.description') : t('home.userDescription')}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-white/[0.08]">
            {userAdmin ? (
              <>
                <p className="flex items-center gap-2 text-sm font-semibold home-user-status m-0">
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
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-sm font-semibold home-user-status m-0">
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
              </>
            )}
          </div>
        </div>
      </Card>

      {!userAdmin && (
        <Card className="home-admin-notice flex flex-row items-center justify-between flex-wrap gap-4 p-4 sm:p-5">
          <div className="flex items-center gap-3 flex-1">
            <Info size={20} color="var(--action-primary)" className="shrink-0" />
            <p className="text-muted text-sm m-0">{t('home.adminNotice')}</p>
          </div>
          <Button variant="secondary" size="sm" icon={<LogOut size={14} />} onClick={() => logout('/')}>
            {t('home.switchAccount')}
          </Button>
        </Card>
      )}

      {userAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          <Card
            className="home-nav-card flex flex-col gap-4 p-6"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/clients')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/clients')}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Key size={20} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="home-nav-card__title text-base font-semibold m-0">{t('home.clientRegistry')}</h3>
              <p className="text-muted text-xs leading-relaxed m-0">{t('home.clientRegistryDescription')}</p>
            </div>
          </Card>

          <Card
            className="home-nav-card flex flex-col gap-4 p-6"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/users')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/users')}
          >
            <div className="w-10 h-10 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-300 shrink-0">
              <UserCheck size={20} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="home-nav-card__title text-base font-semibold m-0">{t('home.userControl')}</h3>
              <p className="text-muted text-xs leading-relaxed m-0">{t('home.userControlDescription')}</p>
            </div>
          </Card>

          <Card
            className="home-nav-card flex flex-col gap-4 p-6"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/system-management/system')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/system-management/system')}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Settings size={20} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="home-nav-card__title text-base font-semibold m-0">{t('home.mfaAndPasskeys')}</h3>
              <p className="text-muted text-xs leading-relaxed m-0">{t('home.mfaAndPasskeysDescription')}</p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          <Card
            className="home-nav-card flex flex-col gap-4 p-6"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/profile')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/profile')}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <User size={20} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="home-nav-card__title text-base font-semibold m-0">{t('home.userProfile')}</h3>
              <p className="text-muted text-xs leading-relaxed m-0">{t('home.userProfileDescription')}</p>
            </div>
          </Card>

          <Card
            className="home-nav-card flex flex-col gap-4 p-6"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/mfa')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/mfa')}
          >
            <div className="w-10 h-10 rounded-lg bg-slate-500/10 border border-slate-500/20 flex items-center justify-center text-slate-300 shrink-0">
              <Shield size={20} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="home-nav-card__title text-base font-semibold m-0">{t('home.userSecurity')}</h3>
              <p className="text-muted text-xs leading-relaxed m-0">{t('home.userSecurityDescription')}</p>
            </div>
          </Card>

          <Card
            className="home-nav-card flex flex-col gap-4 p-6"
            role="button"
            tabIndex={0}
            onClick={() => navigate('/account-settings/sessions')}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/account-settings/sessions')}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Laptop size={20} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="home-nav-card__title text-base font-semibold m-0">{t('home.userSessions')}</h3>
              <p className="text-muted text-xs leading-relaxed m-0">{t('home.userSessionsDescription')}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
