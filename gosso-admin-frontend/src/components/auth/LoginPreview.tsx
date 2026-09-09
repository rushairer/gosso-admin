import { useLayoutEffect, useRef, useState, type FormEventHandler } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PublicSiteBranding } from '../../types/api';
import { Button } from '@gouno/ui/core';
import LoginSurface from './LoginSurface';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

type PreviewViewport = keyof typeof VIEWPORTS;

interface LoginPreviewProps {
  branding: PublicSiteBranding;
}

const noop = () => undefined;
const preventSubmit: FormEventHandler<HTMLFormElement> = (event) => event.preventDefault();

export default function LoginPreview({ branding }: LoginPreviewProps) {
  const { t } = useTranslation();
  const showDevCredentials = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEV_CREDENTIALS === 'true';
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<PreviewViewport>('desktop');
  const [scale, setScale] = useState(1);
  const dimensions = VIEWPORTS[viewport];

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = () => {
      if (stage.clientWidth > 0) setScale(Math.min(stage.clientWidth / dimensions.width, 1));
    };
    resize();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [dimensions.width]);

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="flex items-center gap-2 border-b bg-card p-3" role="group" aria-label={t('site.previewViewport')}>
        <Button
          variant={viewport === 'desktop' ? 'solid' : 'outline'}
          color={viewport === 'desktop' ? 'primary' : 'default'}
          size="small"
          type="button"
          aria-pressed={viewport === 'desktop'}
          icon={<Monitor />}
          onClick={() => setViewport('desktop')}
        >
          {t('site.previewDesktop')}
        </Button>
        <Button
          variant={viewport === 'mobile' ? 'solid' : 'outline'}
          color={viewport === 'mobile' ? 'primary' : 'default'}
          size="small"
          type="button"
          aria-pressed={viewport === 'mobile'}
          icon={<Smartphone />}
          onClick={() => setViewport('mobile')}
        >
          {t('site.previewMobile')}
        </Button>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {dimensions.width} × {dimensions.height}
        </span>
      </div>

      <div
        ref={stageRef}
        className="relative w-full overflow-hidden bg-background transition-[height] duration-200"
        style={{ height: dimensions.height * scale }}
      >
        <div
          className="absolute left-1/2 top-0 origin-top"
          style={{ width: dimensions.width, height: dimensions.height, transform: `translateX(-50%) scale(${scale})` }}
        >
          <LoginSurface
            branding={branding}
            username=""
            password=""
            error={null}
            loading={false}
            passkeyLoading={false}
            mfaRequired={false}
            mfaCode=""
            showDevCredentials={showDevCredentials}
            preview
            onUsernameChange={noop}
            onPasswordChange={noop}
            onMfaCodeChange={noop}
            onLoginSubmit={preventSubmit}
            onMfaSubmit={preventSubmit}
            onPasskeyLogin={noop}
            onBackToLogin={noop}
          />
        </div>
      </div>
    </div>
  );
}
