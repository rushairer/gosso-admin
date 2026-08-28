import { gossoClient } from '../auth';
import type { PublicSiteBranding, SecurityPolicy, SiteSettings } from '../types/api';

export const siteSettingsService = {
  getSiteSettings(): Promise<SiteSettings> {
    return gossoClient.get<SiteSettings>('/api/v1/admin/site-settings');
  },
  updateSiteSettings(settings: SiteSettings): Promise<SiteSettings> {
    return gossoClient.put<SiteSettings>('/api/v1/admin/site-settings', settings);
  },
  getSecurityPolicy(): Promise<SecurityPolicy> {
    return gossoClient.get<SecurityPolicy>('/api/v1/admin/security-policy');
  },
  getPublicSiteBranding(): Promise<PublicSiteBranding> {
    return gossoClient.get<PublicSiteBranding>('/api/v1/public/site-branding');
  },
};
