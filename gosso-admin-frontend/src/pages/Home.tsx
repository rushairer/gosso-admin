import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Info, Key, Laptop, LogOut, Settings, Shield, ShieldCheck, User, UserCheck } from 'lucide-react';
import type { ComponentType } from 'react';
import { useSession } from '@gosso/client/react';
import { logout } from '../auth';
import { Button, Card } from '../components/ui';

const iconTileTones = {
  primary: 'bg-blue-500/10 border border-blue-500/20 text-blue-400',
  neutral: 'bg-slate-500/10 border border-slate-500/20 text-slate-300',
} as const;

interface QuickLink {
  to: string;
  icon: ComponentType<{ size?: number }>;
  tone: keyof typeof iconTileTones;
  title: string;
  description: string;
}

function QuickCard({ link, onOpen }: { link: QuickLink; onOpen: () => void }) {
  const { icon: Icon, tone, title, description } = link;

  return (
    <Card
      className="home-nav-card flex items-center gap-4 p-5"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
    >
      <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${iconTileTones[tone]}`}>
        <Icon size={20} />
      </div>

      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <h3 className="home-nav-card__title text-base font-semibold m-0">{title}</h3>
        <p className="text-muted text-xs leading-relaxed m-0">{description}</p>
      </div>

      <span className="home-nav-card__arrow" aria-hidden="true">
        <ArrowRight size={16} />
      </span>
    </Card>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin: userAdmin, profile: user } = useSession();

  const userName = user?.preferred_username || user?.name || (userAdmin ? 'Administrator' : 'User');

  const adminQuickLinks: QuickLink[] = [
    {
      to: '/system-management/clients',
      icon: Key,
      tone: 'primary',
      title: t('home.clientRegistry'),
      description: t('home.clientRegistryDescription'),
    },
    {
      to: '/system-management/users',
      icon: UserCheck,
      tone: 'neutral',
      title: t('home.userControl'),
      description: t('home.userControlDescription'),
    },
    {
      to: '/system-management/system',
      icon: Settings,
      tone: 'primary',
      title: t('home.mfaAndPasskeys'),
      description: t('home.mfaAndPasskeysDescription'),
    },
  ];

  const userQuickLinks: QuickLink[] = [
    {
      to: '/account-settings/profile',
      icon: User,
      tone: 'primary',
      title: t('home.userProfile'),
      description: t('home.userProfileDescription'),
    },
    {
      to: '/account-settings/mfa',
      icon: Shield,
      tone: 'neutral',
      title: t('home.userSecurity'),
      description: t('home.userSecurityDescription'),
    },
    {
      to: '/account-settings/sessions',
      icon: Laptop,
      tone: 'primary',
      title: t('home.userSessions'),
      description: t('home.userSessionsDescription'),
    },
  ];

  const quickLinks = userAdmin ? adminQuickLinks : userQuickLinks;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <Card className="home-hero p-7 sm:p-9">
        <div className="home-hero__glow" aria-hidden="true" />

        <div className="relative flex flex-col items-start gap-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <div className="home-hero__icon shrink-0">
              {userAdmin ? (
                <ShieldCheck size={28} color="var(--action-primary)" />
              ) : (
                <UserCheck size={28} color="var(--action-primary)" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <h2 className="home-hero-title text-2xl sm:text-3xl font-bold tracking-tight m-0">
                {userAdmin ? t('home.title') : t('home.userTitle')}
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 shrink-0">
                <span className="status-dot" />
                <span>
                  {userAdmin
                    ? t('home.loggedInAsAdmin', { name: userName })
                    : t('home.loggedInAsUser', { name: userName })}
                </span>
              </span>
            </div>
          </div>

          <p className="home-hero-desc text-sm sm:text-base leading-relaxed text-[var(--color-text-muted)] m-0 max-w-3xl">
            {userAdmin ? t('home.description') : t('home.userDescription')}
          </p>

          <div className="pt-2">
            <Button
              variant="primary"
              size="base"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
              className="px-5 py-2.5 shadow-md shadow-blue-500/15"
              onClick={() => navigate(userAdmin ? '/system-management' : '/account-settings/profile')}
            >
              {userAdmin ? t('home.enterDashboard') : t('home.goToAccountSettings')}
            </Button>
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

      <div className="flex flex-col gap-5 lg:gap-6">
        <div className="home-section-label">{t('home.quickNavigation')}</div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {quickLinks.map((link) => (
            <QuickCard key={link.to} link={link} onOpen={() => navigate(link.to)} />
          ))}
        </div>
      </div>
    </div>
  );
}
