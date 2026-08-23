import { describe, expect, it } from 'vitest';
import { clientPayloadFromForm, defaultClientForm, formFromClient, toggleClientFormSelection } from './clientForm';

describe('client form mapping', () => {
  it('maps client URI arrays into editable comma-separated fields', () => {
    expect(
      formFromClient({
        client_id: 'client-1',
        name: 'Portal',
        description: 'Customer portal',
        redirect_uris: ['https://portal.example/callback', 'https://portal.example/alt'],
        grant_types: ['authorization_code'],
        scopes: ['openid'],
        is_confidential: true,
      })
    ).toMatchObject({
      redirect_uris: 'https://portal.example/callback, https://portal.example/alt',
      post_logout_redirect_uris: '',
    });
  });

  it('normalizes URI lists and trims text before submitting', () => {
    expect(
      clientPayloadFromForm({
        ...defaultClientForm,
        name: ' Portal ',
        description: ' Customer portal ',
        redirect_uris: ' https://portal.example/callback, , https://portal.example/alt ',
        post_logout_redirect_uris: ' https://portal.example/logout ',
      })
    ).toMatchObject({
      name: 'Portal',
      description: 'Customer portal',
      redirect_uris: ['https://portal.example/callback', 'https://portal.example/alt'],
      post_logout_redirect_uris: ['https://portal.example/logout'],
    });
  });

  it('adds and removes list selections immutably', () => {
    const withAdmin = toggleClientFormSelection(defaultClientForm, 'scopes', 'admin');
    expect(withAdmin.scopes).toContain('admin');
    expect(toggleClientFormSelection(withAdmin, 'scopes', 'admin').scopes).not.toContain('admin');
  });
});
