import { useLayoutEffect, useRef, useState, type FormEventHandler } from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PublicSiteBranding } from '../../types/api';
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
    <div className="login-preview">
      <div className="login-preview__toolbar" role="group" aria-label={t('site.previewViewport')}>
        <button
          className={`btn btn-sm ${viewport === 'desktop' ? 'btn-primary' : 'btn-secondary'}`}
          type="button"
          aria-pressed={viewport === 'desktop'}
          onClick={() => setViewport('desktop')}
        >
          <Monitor size={15} />
          {t('site.previewDesktop')}
        </button>
        <button
          className={`btn btn-sm ${viewport === 'mobile' ? 'btn-primary' : 'btn-secondary'}`}
          type="button"
          aria-pressed={viewport === 'mobile'}
          onClick={() => setViewport('mobile')}
        >
          <Smartphone size={15} />
          {t('site.previewMobile')}
        </button>
        <span className="text-muted">
          {dimensions.width} × {dimensions.height}
        </span>
      </div>

      <div
        ref={stageRef}
        className={`login-preview__stage login-preview__stage--${viewport}`}
        style={{ height: dimensions.height * scale }}
      >
        <div
          className="login-preview__viewport"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            transform: viewport === 'mobile' ? `translateX(-50%) scale(${scale})` : `scale(${scale})`,
          }}
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
