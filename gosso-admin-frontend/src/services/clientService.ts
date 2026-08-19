import { apiFetch } from '../auth';
import type { OAuth2Client } from '../types/api';

export interface CreateClientPayload {
  name: string;
  description?: string;
  redirect_uris: string[];
  post_logout_redirect_uris?: string[];
  grant_types: string[];
  scopes: string[];
  is_confidential: boolean;
}

export interface UpdateClientPayload {
  name: string;
  description?: string;
  redirect_uris: string[];
  post_logout_redirect_uris?: string[];
  grant_types: string[];
  scopes: string[];
  is_confidential: boolean;
}

export interface CreateClientResponse {
  client: OAuth2Client;
  client_secret?: string;
}

export interface RotateSecretResponse {
  client_id: string;
  client_secret: string;
}

export const clientService = {
  async fetchClients(): Promise<OAuth2Client[]> {
    const res = await apiFetch('/api/v1/oauth2/clients');
    if (!res.ok) {
      throw new Error(`Failed to load clients: ${res.statusText}`);
    }
    const body = await res.json();
    return body.data || [];
  },

  async createClient(payload: CreateClientPayload): Promise<CreateClientResponse> {
    const res = await apiFetch('/api/v1/oauth2/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || body.message || `Failed to create client: ${res.statusText}`);
    }
    const body = await res.json();
    return body.data;
  },

  async updateClient(clientId: string, payload: UpdateClientPayload): Promise<OAuth2Client> {
    const res = await apiFetch(`/api/v1/oauth2/clients/${encodeURIComponent(clientId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || body.message || `Failed to update client: ${res.statusText}`);
    }
    const body = await res.json();
    return body.data;
  },

  async deleteClient(clientId: string): Promise<void> {
    const res = await apiFetch(`/api/v1/oauth2/clients/${encodeURIComponent(clientId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || body.message || `Failed to delete client: ${res.statusText}`);
    }
  },

  async rotateSecret(clientId: string): Promise<RotateSecretResponse> {
    const res = await apiFetch(`/api/v1/oauth2/clients/${encodeURIComponent(clientId)}/rotate-secret`, {
      method: 'POST',
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || body.message || `Failed to rotate secret: ${res.statusText}`);
    }
    const body = await res.json();
    return body.data;
  },
};
