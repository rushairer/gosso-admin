import { gossoClient } from '../auth';
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
    const data = await gossoClient.get<OAuth2Client[]>('/api/v1/oauth2/clients');
    return data || [];
  },

  createClient(payload: CreateClientPayload): Promise<CreateClientResponse> {
    return gossoClient.post<CreateClientResponse>('/api/v1/oauth2/clients', payload);
  },

  updateClient(clientId: string, payload: UpdateClientPayload): Promise<OAuth2Client> {
    return gossoClient.put<OAuth2Client>(`/api/v1/oauth2/clients/${encodeURIComponent(clientId)}`, payload);
  },

  deleteClient(clientId: string): Promise<void> {
    return gossoClient.delete<void>(`/api/v1/oauth2/clients/${encodeURIComponent(clientId)}`);
  },

  rotateSecret(clientId: string): Promise<RotateSecretResponse> {
    return gossoClient.post<RotateSecretResponse>(
      `/api/v1/oauth2/clients/${encodeURIComponent(clientId)}/rotate-secret`
    );
  },
};
