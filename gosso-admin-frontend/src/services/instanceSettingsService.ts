import { apiFetch } from '../auth';
import type { InstanceSettings, PublicInstanceBranding, SecurityPolicy } from '../types/api';
import { extractErrorMessage } from './helper';

async function readData<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) throw new Error(await extractErrorMessage(response, fallback));
  const body = await response.json();
  return body.data as T;
}

export const instanceSettingsService = {
  async getSettings(): Promise<InstanceSettings> {
    return readData<InstanceSettings>(
      await apiFetch('/api/v1/admin/instance-settings'),
      'Failed to load instance settings'
    );
  },
  async updateSettings(settings: InstanceSettings): Promise<InstanceSettings> {
    return readData<InstanceSettings>(
      await apiFetch('/api/v1/admin/instance-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      }),
      'Failed to update instance settings'
    );
  },
  async getSecurityPolicy(): Promise<SecurityPolicy> {
    return readData<SecurityPolicy>(await apiFetch('/api/v1/admin/security-policy'), 'Failed to load security policy');
  },
  async getPublicBranding(): Promise<PublicInstanceBranding> {
    return readData<PublicInstanceBranding>(
      await fetch('/api/v1/public/instance-branding'),
      'Failed to load instance branding'
    );
  },
};
