import { useEffect, useState, type ChangeEvent } from 'react';
import { Image, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardFooter,
  FormField,
  Input,
  Text,
  Textarea,
  useMessage,
} from '@gouno/ui/core';
import { siteSettingsService } from '../../services';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings } from '../../config/site-defaults';
import type { SiteSettings } from '../../types/api';
import LoginPreview from '../../components/auth/LoginPreview';
import { useSudo } from '../../components/auth/SudoContext';
import { ManagementPanelLead } from './shared';
import { SiteSettingsLoading } from './loading';

const MAX_LOGIN_BACKGROUND_SOURCE_LENGTH = 8 * 1024 * 1024;

export default function SiteSettingsTab() {
  const { t } = useTranslation();
  const message = useMessage();
  const { requireSudo } = useSudo();
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
  const hasLoadedSettings = baseline !== null;
  const initialLoading = loading && !hasLoadedSettings;
  const fatalLoadError = Boolean(error) && !hasLoadedSettings;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    await requireSudo({
      actionTitle: t('site.title'),
      onSuccess: async () => {
        try {
          setSaving(true);
          const updated = mergeSiteSettings(await siteSettingsService.updateSiteSettings(settings));
          setSettings(updated);
          setBaseline(JSON.stringify(updated));
          message.success(t('site.saved'));
        } catch (reason: unknown) {
          message.error(reason instanceof Error ? reason.message : t('site.saveFailed'));
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <ManagementPanelLead description={t('site.description')} />

      {initialLoading ? (
        <SiteSettingsLoading label={t('site.loading')} />
      ) : (
        <>
          {error ? (
            <Alert
              type="error"
              showIcon
              title={error}
              action={
                <Button size="small" onClick={() => void load()}>
                  {t('common.retry')}
                </Button>
              }
            />
          ) : null}

          {fatalLoadError ? null : (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]" aria-busy={loading}>
              <form onSubmit={save} className="min-w-0">
                <Card padding="none" className="gap-0 overflow-clip">
                  <CardContent className="flex flex-col gap-5 p-6">
                    <FormField label={t('site.productName')} required>
                      <Input
                        required
                        maxLength={120}
                        value={settings.product_name}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => update('product_name', event.target.value)}
                      />
                    </FormField>
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
                        showCount
                        placeholder={t('login.subtitle')}
                        value={settings.login_description}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                          update('login_description', event.target.value)
                        }
                      />
                    </FormField>
                    <FormField
                      label={`${t('site.loginBackgroundUrl')} / Base64`}
                      hint="PNG · JPEG · GIF · WebP · Base64 ≤ 8 MiB"
                    >
                      <Textarea
                        rows={5}
                        maxLength={MAX_LOGIN_BACKGROUND_SOURCE_LENGTH}
                        spellCheck={false}
                        placeholder={`${t('site.loginBackgroundUrlPlaceholder')} · https://… / data:image/png;base64,…`}
                        value={settings.login_background_url}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                          update('login_background_url', event.target.value)
                        }
                      />
                    </FormField>
                  </CardContent>
                  <CardFooter className="sticky bottom-0 z-10 justify-between border-t bg-card/95 px-6 py-4 backdrop-blur">
                    <Text size="sm" tone="muted" aria-live="polite">
                      {dirty ? t('site.unsavedChanges') : ''}
                    </Text>
                    <Button
                      type="submit"
                      variant="solid"
                      color="primary"
                      loading={saving}
                      icon={<Save />}
                      disabled={!dirty || saving || loading}
                    >
                      {t('site.save')}
                    </Button>
                  </CardFooter>
                </Card>
              </form>

              <div className="xl:sticky xl:top-20 xl:self-start">
                <Card padding="base" className="overflow-hidden">
                  <div className="mb-4 flex items-center gap-2">
                    <Image aria-hidden="true" className="size-4 text-muted-foreground" />
                    <Text size="sm" className="font-medium">
                      {t('site.preview')}
                    </Text>
                  </div>
                  <LoginPreview branding={settings} />
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
