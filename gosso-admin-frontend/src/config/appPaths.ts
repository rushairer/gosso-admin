function normalizeBasePath(value: string | undefined): string {
  if (!value || value === '/') return '';
  const withLeadingSlash = value.startsWith('/') ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

export const appBasePath = normalizeBasePath(import.meta.env.VITE_APP_BASE_PATH || import.meta.env.BASE_URL);
export const routerBasename = appBasePath || '/';

export function appPath(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!appBasePath) return normalizedPath;
  if (normalizedPath === '/') return `${appBasePath}/`;
  return `${appBasePath}${normalizedPath}`;
}
