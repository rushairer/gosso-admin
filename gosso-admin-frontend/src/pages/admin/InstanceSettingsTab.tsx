import { useEffect, useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AsyncState,
  DefinitionList,
  DefinitionRow,
  FormField,
  PanelBody,
  PanelHeader,
  PlainSection,
  useToast,
} from '../../components/ui';
import { instanceSettingsService } from '../../services';
import type { InstanceSettings, SecurityPolicy } from '../../types/api';

const fallbackSettings: InstanceSettings = {
  product_name: 'GOSSO',
  logo_url: '',
  favicon_url: '',
  primary_color: '#3b82f6',
  login_title: '',
  login_description: '',
  login_background_url: '',
  support_email: '',
  support_url: '',
  privacy_policy_url: '',
  terms_of_service_url: '',
  default_locale: 'en',
};

export default function InstanceSettingsTab() {
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [settings, setSettings] = useState<InstanceSettings>(fallbackSettings);
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [nextSettings, nextPolicy] = await Promise.all([
        instanceSettingsService.getSettings(),
        instanceSettingsService.getSecurityPolicy(),
      ]);
      setSettings(nextSettings);
      setPolicy(nextPolicy);
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
            <FormField label={t('instance.primaryColor')} hint={t('instance.primaryColorHint')} required>
              <input
                className="input-field"
                required
                pattern="#[0-9a-fA-F]{6}"
                value={settings.primary_color}
                onChange={(event) => update('primary_color', event.target.value)}
              />
            </FormField>
            <FormField label={t('instance.defaultLocale')}>
              <select
                className="input-field"
                value={settings.default_locale}
                onChange={(event) => update('default_locale', event.target.value as InstanceSettings['default_locale'])}
              >
                <option value="en">English</option>
                <option value="zh">简体中文</option>
              </select>
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

          <PlainSection title={t('instance.supportAndLegal')}>
            <div className="flex-col gap-lg">
              <FormField label={t('instance.supportEmail')}>
                <input
                  className="input-field"
                  type="email"
                  value={settings.support_email}
                  onChange={(event) => update('support_email', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.supportUrl')}>
                <input
                  className="input-field"
                  type="text"
                  value={settings.support_url}
                  onChange={(event) => update('support_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.privacyUrl')}>
                <input
                  className="input-field"
                  type="text"
                  value={settings.privacy_policy_url}
                  onChange={(event) => update('privacy_policy_url', event.target.value)}
                />
              </FormField>
              <FormField label={t('instance.termsUrl')}>
                <input
                  className="input-field"
                  type="text"
                  value={settings.terms_of_service_url}
                  onChange={(event) => update('terms_of_service_url', event.target.value)}
                />
              </FormField>
              <button className="btn btn-primary self-start" type="submit" disabled={saving}>
                <Save size={16} />
                {saving ? t('common.loading') : t('instance.save')}
              </button>
            </div>
          </PlainSection>
        </form>

        <PlainSection title={t('instance.securityPolicy')}>
          <p className="text-muted mb-md">{t('instance.securityPolicyDescription')}</p>
          {policy && (
            <DefinitionList>
              <DefinitionRow label={t('instance.sessionTtl')}>{policy.session_ttl}</DefinitionRow>
              <DefinitionRow label={t('instance.maxSessions')}>{policy.max_sessions}</DefinitionRow>
              <DefinitionRow label={t('instance.tokenExpiry')}>
                {policy.access_token_expiry} / {policy.refresh_token_expiry}
              </DefinitionRow>
              <DefinitionRow label={t('instance.protections')}>
                <span className="flex-row items-center gap-sm">
                  <ShieldCheck size={16} />{' '}
                  {policy.enforce_pkce_for_confidential ? t('instance.pkceEnabled') : t('instance.pkceDisabled')} ·{' '}
                  {policy.enforce_ip_binding ? t('instance.ipBindingEnabled') : t('instance.ipBindingDisabled')}
                </span>
              </DefinitionRow>
              <DefinitionRow label={t('instance.loginRateLimit')}>
                {policy.login_max_attempts} / {policy.login_rate_limit_window}
              </DefinitionRow>
              <DefinitionRow label={t('instance.mfaRateLimit')}>
                {policy.mfa_account_max_attempts} / {policy.mfa_account_rate_limit_window}
              </DefinitionRow>
            </DefinitionList>
          )}
        </PlainSection>
      </>
    </AsyncState>
  );
}
