import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AsyncState, FormField, PanelBody, PanelHeader, PlainSection, useToast } from '../../components/ui';
import { instanceSettingsService } from '../../services';
import { DEFAULT_INSTANCE_SETTINGS, mergeInstanceSettings } from '../../config/instance-defaults';
import type { InstanceSettings } from '../../types/api';

export default function InstanceSettingsTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState<InstanceSettings>(DEFAULT_INSTANCE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextSettings = await instanceSettingsService.getSettings();
      setSettings(mergeInstanceSettings(nextSettings));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t('instance.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const update = <K extends keyof InstanceSettings>(key: K, value: InstanceSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      const updated = await instanceSettingsService.updateSettings(settings);
      setSettings(mergeInstanceSettings(updated));
      showSuccess(t('instance.saved'));
    } catch (reason: unknown) {
      showError(reason instanceof Error ? reason.message : t('instance.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AsyncState
      loading={loading}
      loadingMessage={t('instance.loading')}
      error={error}
      retryLabel={t('common.retry')}
      onRetry={() => void load()}
    >
      <>
        <PanelHeader title={t('instance.title')} description={t('instance.description')} />
        <form onSubmit={save}>
          <PanelBody stack>
            <FormField label={t('instance.productName')} required>
              <input
                className="input-field"
                required
                maxLength={120}
                value={settings.product_name}
                onChange={(event) => update('product_name', event.target.value)}
              />
            </FormField>
          </PanelBody>

          <PlainSection title={t('instance.loginAppearance')}>
            <div className="flex-col gap-lg">
              <FormField label={t('instance.logoUrl')}>
                <input
                  className="input-field"
                  type="text"
                  placeholder="留空则显示产品名称文字标识"
                  value={settings.logo_url}
                  onChange={(event) => update('logo_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.faviconUrl')}>
                <input
                  className="input-field"
                  type="text"
                  placeholder="留空则保留浏览器默认图标"
                  value={settings.favicon_url}
                  onChange={(event) => update('favicon_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.loginTitle')}>
                <input
                  className="input-field"
                  maxLength={160}
                  placeholder={settings.product_name || 'GOSSO'}
                  value={settings.login_title}
                  onChange={(event) => update('login_title', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.loginDescription')}>
                <textarea
                  className="input-field"
                  rows={3}
                  maxLength={500}
                  placeholder={t('login.subtitle')}
                  value={settings.login_description}
                  onChange={(event) => update('login_description', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.loginBackgroundUrl')}>
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
              <strong>登录页预览</strong>
              <div style={{ marginTop: '8px' }}>{settings.login_title || settings.product_name || 'GOSSO'}</div>
              <div className="text-muted">{settings.login_description || t('login.subtitle')}</div>
            </div>
          </PlainSection>

          <PanelBody>
            <button className="btn btn-primary self-start" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? t('common.loading') : t('instance.save')}
            </button>
          </PanelBody>
        </form>
      </>
    </AsyncState>
  );
}
