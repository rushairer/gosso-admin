export function resolveBlogAdminUrl(origin = window.location.origin): string {
  const configuredUrl = import.meta.env.VITE_BLOG_ADMIN_URL?.trim();
  if (configuredUrl) return configuredUrl;
  return `${origin}/admin`;
}

export const blogAdminUrl = resolveBlogAdminUrl();
