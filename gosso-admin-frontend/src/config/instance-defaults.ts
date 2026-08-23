import type { InstanceSettings } from '../types/api';

// Keep every public/admin brand surface on the same fallback contract.
export const DEFAULT_INSTANCE_SETTINGS: InstanceSettings = {
  product_name: 'GOSSO',
  logo_url: '',
  favicon_url: '/favicon.svg',
  login_title: 'GOSSO',
  login_description: 'Identity & Access Provider Console',
  login_background_url: '',
};

export function mergeInstanceSettings(settings?: Partial<InstanceSettings> | null): InstanceSettings {
  return { ...DEFAULT_INSTANCE_SETTINGS, ...settings };
}
