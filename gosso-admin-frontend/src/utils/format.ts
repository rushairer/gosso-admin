import type { DependencyStatus } from '../types/api';

export function parseUserAgent(ua: string): string {
  if (!ua) return 'Unknown Device';
  if (ua.includes('iPhone')) return 'Apple iPhone';
  if (ua.includes('iPad')) return 'Apple iPad';
  if (ua.includes('Android')) return 'Android Mobile';
  if (ua.includes('Macintosh')) return 'Mac Computer';
  if (ua.includes('Windows')) return 'Windows Computer';
  if (ua.includes('Linux')) return 'Linux Computer';
  return ua.split(' ')[0] || 'Web Browser';
}

export function dependencyLabel(status?: DependencyStatus): string {
  if (status === 'ok') return 'HEALTHY';
  if (status === 'unavailable') return 'UNAVAILABLE';
  if (status === 'error') return 'CHECK FAILED';
  return 'UNKNOWN';
}

export function dependencyIsHealthy(status?: DependencyStatus): boolean {
  return status === 'ok';
}

export function formatHealthTimestamp(value?: string): string {
  if (!value) return 'Not checked yet';
  return new Date(value).toLocaleString();
}
