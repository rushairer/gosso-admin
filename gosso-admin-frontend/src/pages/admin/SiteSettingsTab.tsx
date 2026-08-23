import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AsyncState, FormField, PanelBody, PanelHeader, PlainSection, useToast } from '../../components/ui';
import { siteSettingsService } from '../../services';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from '../../config/site-defaults';
import type { SiteSettings } from '../../types/api';

export default function SiteSettingsTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextSettings = await siteSettingsService.getSiteSettings();
      setSettings(mergeSiteSettings(nextSettings));
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

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      const updated = await siteSettingsService.updateSiteSettings(settings);
      setSettings(mergeSiteSettings(updated));
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
              <input
                className="input-field"
                required
                maxLength={120}
                value={settings.product_name}
                onChange={(event) => update('product_name', event.target.value)}
              />
            </FormField>
          </PanelBody>

          <PlainSection title={t('site.loginAppearance')}>
            <div className="flex-col gap-lg">
              <FormField label={t('site.logoUrl')}>
                <input
                  className="input-field"
                  type="text"
                  placeholder="留空则显示产品名称文字标识"
                  value={settings.logo_url}
                  onChange={(event) => update('logo_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('site.faviconUrl')}>
                <input
                  className="input-field"
                  type="text"
                  placeholder="留空则保留浏览器默认图标"
                  value={settings.favicon_url}
                  onChange={(event) => update('favicon_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('site.loginTitle')}>
                <input
                  className="input-field"
                  maxLength={160}
                  placeholder={settings.product_name || 'GOSSO'}
                  value={settings.login_title}
                  onChange={(event) => update('login_title', event.target.value)}
                />
              </FormField>
              <FormField label={t('site.loginDescription')}>
                <textarea
                  className="input-field"
                  rows={3}
                  maxLength={500}
                  placeholder={t('login.subtitle')}
                  value={settings.login_description}
                  onChange={(event) => update('login_description', event.target.value)}
                />
              </FormField>
              <FormField label={t('site.loginBackgroundUrl')}>
                <input
                  className="input-field"
                  type="text"
                  placeholder="留空则使用控制台默认深色背景"
                  value={settings.login_background_url}
                  onChange={(event) => update('login_background_url', event.target.value)}
                />
              </FormField>
            </div>
            <div className="notice-card">
              <strong>{t('site.preview')}</strong>
              <div style={{ marginTop: '8px' }}>{settings.login_title || settings.product_name || 'GOSSO'}</div>
              <div className="text-muted">{settings.login_description || t('login.subtitle')}</div>
            </div>
          </PlainSection>

          <PanelBody>
            <button className="btn btn-primary self-start" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? t('common.loading') : t('site.save')}
            </button>
          </PanelBody>
        </form>
      </>
    </AsyncState>
  );
}
