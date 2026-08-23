import type { SiteSettings } from '../types/api';

// Keep every public/admin brand surface on the same fallback contract.
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  product_name: 'GOSSO',
  logo_url: '',
  favicon_url: '/favicon.svg',
  login_title: 'GOSSO',
  login_description: 'Identity & Access Provider Console',
  login_background_url: '',
};

export function mergeSiteSettings(settings?: Partial<SiteSettings> | null): SiteSettings {
  return { ...DEFAULT_SITE_SETTINGS, ...settings };
}
