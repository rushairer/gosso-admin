import { apiFetch } from '../auth';
import type { PublicSiteBranding, SecurityPolicy, SiteSettings } from '../types/api';
import { extractErrorMessage } from './helper';

async function readData<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) throw new Error(await extractErrorMessage(response, fallback));
  const body = await response.json();
  return body.data as T;
}

export const siteSettingsService = {
  async getSiteSettings(): Promise<SiteSettings> {
    return readData<SiteSettings>(await apiFetch('/api/v1/admin/site-settings'), 'Failed to load site settings');
  },
  async updateSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
    return readData<SiteSettings>(
      await apiFetch('/api/v1/admin/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }),
      'Failed to update site settings'
    );
  },
  async getSecurityPolicy(): Promise<SecurityPolicy> {
    return readData<SecurityPolicy>(await apiFetch('/api/v1/admin/security-policy'), 'Failed to load security policy');
  },
  async getPublicSiteBranding(): Promise<PublicSiteBranding> {
    return readData<PublicSiteBranding>(await fetch('/api/v1/public/site-branding'), 'Failed to load site branding');
  },
};
