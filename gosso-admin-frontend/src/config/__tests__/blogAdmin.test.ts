import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('blog admin url', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('defaults to the blog admin route on the current origin', async () => {
    const { resolveBlogAdminUrl } = await import('../blogAdmin');

    expect(resolveBlogAdminUrl('http://localhost:8080')).toBe('http://localhost:8080/admin');
  });

  it('uses VITE_BLOG_ADMIN_URL when configured', async () => {
    vi.stubEnv('VITE_BLOG_ADMIN_URL', 'https://blog.example.com/admin');
    const { resolveBlogAdminUrl } = await import('../blogAdmin');

    expect(resolveBlogAdminUrl('http://localhost:8080')).toBe('https://blog.example.com/admin');
  });
});
