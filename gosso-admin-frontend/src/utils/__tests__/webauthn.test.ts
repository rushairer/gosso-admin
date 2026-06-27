import { describe, it, expect } from 'vitest';
import { bufferToBase64URL, base64URLToBuffer } from '../webauthn';

describe('webauthn utils', () => {
  describe('bufferToBase64URL', () => {
    it('converts ArrayBuffer to base64url string', () => {
      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = bufferToBase64URL(data.buffer);
      expect(result).toBe(btoa('Hello').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
    });

    it('returns empty string for empty buffer', () => {
      const empty = new ArrayBuffer(0);
      expect(bufferToBase64URL(empty)).toBe('');
    });

    it('handles null/undefined input', () => {
      expect(bufferToBase64URL(null as unknown as ArrayBuffer)).toBe('');
      expect(bufferToBase64URL(undefined as unknown as ArrayBuffer)).toBe('');
    });
  });

  describe('base64URLToBuffer', () => {
    it('converts base64url string back to Uint8Array', () => {
      const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const encoded = bufferToBase64URL(original.buffer);
      const decoded = base64URLToBuffer(encoded);
      expect(decoded).toEqual(original);
    });

    it('returns empty Uint8Array for empty string', () => {
      const result = base64URLToBuffer('');
      expect(result).toEqual(new Uint8Array(0));
    });

    it('roundtrips complex data', () => {
      const data = new Uint8Array([0, 1, 2, 255, 254, 253, 128, 64, 32]);
      const encoded = bufferToBase64URL(data.buffer);
      const decoded = base64URLToBuffer(encoded);
      expect(decoded).toEqual(data);
    });
  });
});
