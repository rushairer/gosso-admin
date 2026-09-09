import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Key, Laptop, LogOut, Settings, Shield, ShieldCheck, User, UserCheck } from 'lucide-react';
import type { ComponentType } from 'react';
import { useSession } from '@gosso/client/react';
import { logout } from '../auth';
import { Alert, Button, Card, Heading, Tag, Text } from '@gouno/ui/core';

interface QuickLink {
  to: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function QuickCard({ link }: { link: QuickLink }) {
  const { icon: Icon, title, description } = link;
  return (
    <Link
      to={link.to}
      className="group flex min-h-32 w-full items-center gap-4 rounded-lg border bg-card px-6 py-5 text-left text-card-foreground shadow-surface transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/20 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-primary" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
      </span>
      <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
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
      title: t('home.clientRegistry'),
      description: t('home.clientRegistryDescription'),
    },
    {
      to: '/system-management/users',
      icon: UserCheck,
      title: t('home.userControl'),
      description: t('home.userControlDescription'),
    },
    {
      to: '/system-management/system',
      icon: Settings,
      title: t('home.mfaAndPasskeys'),
      description: t('home.mfaAndPasskeysDescription'),
    },
  ];

  const userQuickLinks: QuickLink[] = [
    {
      to: '/account-settings/profile',
      icon: User,
      title: t('home.userProfile'),
      description: t('home.userProfileDescription'),
    },
    {
      to: '/account-settings/mfa',
      icon: Shield,
      title: t('home.userSecurity'),
      description: t('home.userSecurityDescription'),
    },
    {
      to: '/account-settings/sessions',
      icon: Laptop,
      title: t('home.userSessions'),
      description: t('home.userSessionsDescription'),
    },
  ];

  const quickLinks = userAdmin ? adminQuickLinks : userQuickLinks;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <Card padding="base" variant="elevated" className="relative overflow-hidden border-primary/20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 size-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col items-start gap-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-accent text-primary ring-1 ring-primary/15">
              {userAdmin ? <ShieldCheck className="size-7" aria-hidden="true" /> : <UserCheck className="size-7" aria-hidden="true" />}
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
              <Heading level={1} className="text-2xl sm:text-3xl">
                {userAdmin ? t('home.title') : t('home.userTitle')}
              </Heading>
              <Tag color="success">
                {userAdmin
                  ? t('home.loggedInAsAdmin', { name: userName })
                  : t('home.loggedInAsUser', { name: userName })}
              </Tag>
            </div>
          </div>

          <Text tone="muted" className="max-w-3xl leading-relaxed">
            {userAdmin ? t('home.description') : t('home.userDescription')}
          </Text>

          <Button
            variant="solid"
            color="primary"
            icon={<ArrowRight />}
            iconPlacement="end"
            onClick={() => navigate(userAdmin ? '/system-management' : '/account-settings/profile')}
          >
            {userAdmin ? t('home.enterDashboard') : t('home.goToAccountSettings')}
          </Button>
        </div>
      </Card>

      {!userAdmin ? (
        <Alert
          type="info"
          showIcon
          title={t('home.adminNotice')}
          action={
            <Button size="small" icon={<LogOut />} onClick={() => void logout('/')}>
              {t('home.switchAccount')}
            </Button>
          }
        />
      ) : null}

      <section aria-labelledby="home-quick-navigation" className="flex flex-col gap-5">
        <Heading id="home-quick-navigation" level={2} className="text-sm font-semibold text-muted-foreground">
          {t('home.quickNavigation')}
        </Heading>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {quickLinks.map((link) => <QuickCard key={link.to} link={link} />)}
        </div>
      </section>
    </div>
  );
}
