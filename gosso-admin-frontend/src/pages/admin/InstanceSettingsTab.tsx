import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AsyncState, FormField, PanelBody, PanelHeader, PlainSection, useToast } from '../../components/ui';
import { instanceSettingsService } from '../../services';
import type { InstanceSettings } from '../../types/api';

const fallbackSettings: InstanceSettings = {
  product_name: 'GOSSO',
  logo_url: '',
  favicon_url: '',
  login_title: '',
  login_description: '',
  login_background_url: '',
};

export default function InstanceSettingsTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState<InstanceSettings>(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const nextSettings = await instanceSettingsService.getSettings();
      setSettings(nextSettings);
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
      setSettings(updated);
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
                  value={settings.logo_url}
                  onChange={(event) => update('logo_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.faviconUrl')}>
                <input
                  className="input-field"
                  type="text"
                  value={settings.favicon_url}
                  onChange={(event) => update('favicon_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.loginTitle')}>
                <input
                  className="input-field"
                  maxLength={160}
                  value={settings.login_title}
                  onChange={(event) => update('login_title', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.loginDescription')}>
                <textarea
                  className="input-field"
                  rows={3}
                  maxLength={500}
                  value={settings.login_description}
                  onChange={(event) => update('login_description', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.loginBackgroundUrl')}>
                <input
                  className="input-field"
                  type="text"
                  value={settings.login_background_url}
                  onChange={(event) => update('login_background_url', event.target.value)}
                />
              </FormField>
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
