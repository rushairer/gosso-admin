import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('app paths', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('builds paths under the configured base path', async () => {
    vi.stubEnv('VITE_APP_BASE_PATH', '/identity-admin');
    const { appBasePath, appPath, routerBasename } = await import('../appPaths');

    expect(appBasePath).toBe('/identity-admin');
    expect(routerBasename).toBe('/identity-admin');
    expect(appPath('/callback')).toBe('/identity-admin/callback');
    expect(appPath('/')).toBe('/identity-admin/');
  });
});
