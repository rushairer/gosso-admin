import { useEffect, useState, type ChangeEvent } from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AsyncState,
  Button,
  ButtonGroup,
  FormField,
  Input,
  PanelBody,
  PanelHeader,
  PlainSection,
  Textarea,
  useToast,
} from '../../components/ui';
import { siteSettingsService } from '../../services';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from '../../config/site-defaults';
import type { SiteSettings } from '../../types/api';
import LoginPreview from '../../components/auth/LoginPreview';

export default function SiteSettingsTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextSettings = mergeSiteSettings(await siteSettingsService.getSiteSettings());
      setSettings(nextSettings);
      setBaseline(JSON.stringify(nextSettings));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t('site.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const update = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const dirty = baseline !== null && JSON.stringify(settings) !== baseline;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      const updated = mergeSiteSettings(await siteSettingsService.updateSiteSettings(settings));
      setSettings(updated);
      setBaseline(JSON.stringify(updated));
      showSuccess(t('site.saved'));
    } catch (reason: unknown) {
      showError(reason instanceof Error ? reason.message : t('site.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AsyncState
      loading={loading}
      loadingMessage={t('site.loading')}
      error={error}
      retryLabel={t('common.retry')}
      onRetry={() => void load()}
    >
      <>
        <PanelHeader title={t('site.title')} description={t('site.description')} />
        <form onSubmit={save}>
          <PanelBody stack>
            <FormField label={t('site.productName')} required>
              <Input
                required
                maxLength={120}
                value={settings.product_name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => update('product_name', event.target.value)}
              />
            </FormField>
          </PanelBody>

          <PlainSection title={t('site.loginAppearance')}>
            <div className="flex-col gap-lg">
              <FormField label={t('site.logoUrl')}>
                <Input
                  type="text"
                  placeholder={t('site.logoUrlPlaceholder')}
                  value={settings.logo_url}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => update('logo_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('site.faviconUrl')}>
                <Input
                  type="text"
                  placeholder={t('site.faviconUrlPlaceholder')}
                  value={settings.favicon_url}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => update('favicon_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('site.loginTitle')}>
                <Input
                  maxLength={160}
                  placeholder={settings.product_name || 'GOSSO'}
                  value={settings.login_title}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => update('login_title', event.target.value)}
                />
              </FormField>
              <FormField label={t('site.loginDescription')}>
                <Textarea
                  rows={3}
                  maxLength={500}
                  placeholder={t('login.subtitle')}
                  value={settings.login_description}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    update('login_description', event.target.value)
                  }
                />
              </FormField>
              <FormField label={t('site.loginBackgroundUrl')}>
                <Input
                  type="text"
                  placeholder={t('site.loginBackgroundUrlPlaceholder')}
                  value={settings.login_background_url}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    update('login_background_url', event.target.value)
                  }
                />
              </FormField>
            </div>
          </PlainSection>

          <PanelBody className={`form-action-bar${dirty ? ' is-sticky' : ''}`}>
            <p className="form-action-bar__status m-0" aria-live="polite">
              {dirty && (
                <>
                  <span className="status-dot status-dot--warning" aria-hidden="true" />
                  {t('site.unsavedChanges')}
                </>
              )}
            </p>
            <ButtonGroup align="right">
              <Button variant="primary" type="submit" loading={saving} icon={<Save size={16} />}>
                {t('site.save')}
              </Button>
            </ButtonGroup>
          </PanelBody>
        </form>

        <PlainSection title={t('site.preview')}>
          <LoginPreview branding={settings} />
        </PlainSection>
      </>
    </AsyncState>
  );
}
