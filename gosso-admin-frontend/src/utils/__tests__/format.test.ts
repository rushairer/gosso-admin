import { describe, it, expect } from 'vitest';
import { parseUserAgent, dependencyLabel, dependencyIsHealthy, formatHealthTimestamp } from '../format';

describe('format utils', () => {
  describe('parseUserAgent', () => {
    it('detects iPhone', () => {
      expect(parseUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)')).toBe('Apple iPhone');
    });

    it('detects iPad', () => {
      expect(parseUserAgent('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe('Apple iPad');
    });

    it('detects Android', () => {
      expect(parseUserAgent('Mozilla/5.0 (Linux; Android 13)')).toBe('Android Mobile');
    });

    it('detects Mac', () => {
      expect(parseUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('Mac Computer');
    });

    it('detects Windows', () => {
      expect(parseUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Windows Computer');
    });

    it('detects Linux', () => {
      expect(parseUserAgent('Mozilla/5.0 (X11; Linux x86_64)')).toBe('Linux Computer');
    });

    it('returns Unknown Device for empty string', () => {
      expect(parseUserAgent('')).toBe('Unknown Device');
    });

    it('falls back to first token for unknown UA', () => {
      expect(parseUserAgent('CustomBot/1.0')).toBe('CustomBot/1.0');
    });
  });

  describe('dependencyLabel', () => {
    it('returns HEALTHY for ok', () => expect(dependencyLabel('ok')).toBe('HEALTHY'));
    it('returns UNAVAILABLE for unavailable', () => expect(dependencyLabel('unavailable')).toBe('UNAVAILABLE'));
    it('returns CHECK FAILED for error', () => expect(dependencyLabel('error')).toBe('CHECK FAILED'));
    it('returns UNKNOWN for undefined', () => expect(dependencyLabel(undefined)).toBe('UNKNOWN'));
    it('returns UNKNOWN for unknown', () => expect(dependencyLabel('unknown')).toBe('UNKNOWN'));
  });

  describe('dependencyIsHealthy', () => {
    it('returns true for ok', () => expect(dependencyIsHealthy('ok')).toBe(true));
    it('returns false for error', () => expect(dependencyIsHealthy('error')).toBe(false));
    it('returns false for undefined', () => expect(dependencyIsHealthy(undefined)).toBe(false));
  });

  describe('formatHealthTimestamp', () => {
    it('formats a valid ISO string', () => {
      const result = formatHealthTimestamp('2024-01-15T10:30:00Z');
      expect(result).not.toBe('Not checked yet');
      expect(result).toContain('2024');
    });

    it('returns fallback for undefined', () => {
      expect(formatHealthTimestamp(undefined)).toBe('Not checked yet');
    });

    it('returns fallback for empty string', () => {
      expect(formatHealthTimestamp('')).toBe('Not checked yet');
    });
  });
});
