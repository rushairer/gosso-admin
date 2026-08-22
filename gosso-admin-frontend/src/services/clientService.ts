import { apiFetch } from '../auth';
import type { OAuth2Client } from '../types/api';
import { extractErrorMessage } from './helper';

export interface CreateClientPayload {
  name: string;
  description?: string;
  redirect_uris: string[];
  post_logout_redirect_uris?: string[];
  grant_types: string[];
  scopes: string[];
  is_confidential: boolean;
}

export type UpdateClientPayload = CreateClientPayload;


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
      throw new Error(await extractErrorMessage(res, 'Failed to load clients'));
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
      throw new Error(await extractErrorMessage(res, 'Failed to create client'));
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
      throw new Error(await extractErrorMessage(res, 'Failed to update client'));
    }
    const body = await res.json();
    return body.data;
  },

  async deleteClient(clientId: string): Promise<void> {
    const res = await apiFetch(`/api/v1/oauth2/clients/${encodeURIComponent(clientId)}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to delete client'));
    }
  },

  async rotateSecret(clientId: string): Promise<RotateSecretResponse> {
    const res = await apiFetch(`/api/v1/oauth2/clients/${encodeURIComponent(clientId)}/rotate-secret`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res, 'Failed to rotate secret'));
    }
    const body = await res.json();
    return body.data;
  },
};
