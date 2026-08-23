import type { CreateClientPayload } from '../../services/clientService';
import type { OAuth2Client } from '../../types/api';

export interface ClientFormData {
  name: string;
  description: string;
  redirect_uris: string;
  post_logout_redirect_uris: string;
  is_confidential: boolean;
  grant_types: string[];
  scopes: string[];
}

export const defaultClientForm: ClientFormData = {
  name: '',
  description: '',
  redirect_uris: '',
  post_logout_redirect_uris: '',
  is_confidential: false,
  grant_types: ['authorization_code'],
  scopes: ['openid', 'profile', 'email'],
};

function splitUris(value: string) {
  return value
    .split(',')
    .map((uri) => uri.trim())
    .filter(Boolean);
}

export function formFromClient(client: OAuth2Client): ClientFormData {
  return {
    name: client.name,
    description: client.description,
    redirect_uris: client.redirect_uris.join(', '),
    post_logout_redirect_uris: client.post_logout_redirect_uris?.join(', ') || '',
    is_confidential: client.is_confidential,
    grant_types: client.grant_types,
    scopes: client.scopes,
  };
}

export function clientPayloadFromForm(form: ClientFormData): CreateClientPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    redirect_uris: splitUris(form.redirect_uris),
    post_logout_redirect_uris: splitUris(form.post_logout_redirect_uris),
    grant_types: form.grant_types,
    scopes: form.scopes,
    is_confidential: form.is_confidential,
  };
}

export function toggleClientFormSelection(
  form: ClientFormData,
  field: 'grant_types' | 'scopes',
  value: string
): ClientFormData {
  const list = form[field];
  return {
    ...form,
    [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
  };
}
