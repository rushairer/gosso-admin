import { describe, expect, it } from 'vitest';

describe('Vitest URL contract', () => {
  it('uses the standard HTTPS SSO origin for the identity-admin app root', () => {
    expect(window.location.origin).toBe('https://sso.dev.local');
    expect(window.location.pathname).toBe('/identity-admin/');
  });

  it('preserves the standard origin for both root and identity-admin paths', () => {
    window.history.replaceState({}, '', '/');
    expect(window.location.href).toBe('https://sso.dev.local/');

    window.history.replaceState({}, '', '/identity-admin/');
    expect(window.location.href).toBe('https://sso.dev.local/identity-admin/');
  });
});
