import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Info, Key, Laptop, LogOut, Settings, Shield, ShieldCheck, User, UserCheck } from 'lucide-react';
import type { ComponentType } from 'react';
import { useSession } from '@gosso/client/react';
import { logout } from '../auth';
import { Badge, Button, Card } from '../components/ui';

const iconTileTones = {
  primary: 'home-nav-card__icon-tile--primary',
  neutral: 'home-nav-card__icon-tile--neutral',
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
      interactive
      className="home-nav-card flex items-center gap-4"
      role="button"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className={`home-nav-card__icon-tile ${iconTileTones[tone]}`}>
        <Icon size={20} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="home-nav-card__title m-0 text-base font-semibold">{title}</h3>
        <p className="text-muted m-0 text-xs leading-relaxed">{description}</p>
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
      <Card className="home-hero" padding="lg">
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
              <h2 className="home-hero-title m-0 text-2xl font-bold tracking-tight sm:text-3xl">
                {userAdmin ? t('home.title') : t('home.userTitle')}
              </h2>
              <Badge tone="success">
                {userAdmin
                  ? t('home.loggedInAsAdmin', { name: userName })
                  : t('home.loggedInAsUser', { name: userName })}
              </Badge>
            </div>
          </div>

          <p className="home-hero-desc m-0 max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
            {userAdmin ? t('home.description') : t('home.userDescription')}
          </p>

          <div className="pt-2">
            <Button
              variant="primary"
              size="default"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
              onClick={() => navigate(userAdmin ? '/system-management' : '/account-settings/profile')}
            >
              {userAdmin ? t('home.enterDashboard') : t('home.goToAccountSettings')}
            </Button>
          </div>
        </div>
      </Card>

      {!userAdmin && (
        <Card className="home-admin-notice flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <Info size={20} color="var(--action-primary)" className="shrink-0" />
            <p className="text-muted m-0 text-sm">{t('home.adminNotice')}</p>
          </div>
          <Button variant="secondary" size="sm" icon={<LogOut size={14} />} onClick={() => logout('/')}>
            {t('home.switchAccount')}
          </Button>
        </Card>
      )}

      <div className="flex flex-col gap-6">
        <div className="home-section-label">{t('home.quickNavigation')}</div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {quickLinks.map((link) => (
            <QuickCard key={link.to} link={link} onOpen={() => navigate(link.to)} />
          ))}
        </div>
      </div>
    </div>
  );
}
