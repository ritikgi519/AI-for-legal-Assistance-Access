import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Security, Sanitization & Performance Infrastructure', () => {
  function sanitizeInput(text: string): string {
    return text.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  }

  function validateDocumentText(text: any): { valid: boolean; error?: string } {
    if (!text || typeof text !== 'string') {
      return { valid: false, error: 'Document text is required and must be a string.' };
    }
    const clean = sanitizeInput(text);
    if (clean.length < 20) {
      return { valid: false, error: 'Document text too short. Minimum 20 characters required.' };
    }
    if (clean.length > 150000) {
      return { valid: false, error: 'Document text exceeds maximum allowed size (150,000 characters).' };
    }
    return { valid: true };
  }

  function computeCacheKey(prefix: string, content: string, extra = ''): string {
    return crypto.createHash('sha256').update(`${prefix}:${content}:${extra}`).digest('hex');
  }

  it('strips dangerous non-printable ASCII control characters from untrusted inputs', () => {
    const dirty = 'Contract Agreement\x00\x07 with hidden \x1F characters';
    const clean = sanitizeInput(dirty);
    expect(clean).toBe('Contract Agreement with hidden  characters');
    expect(clean).not.toContain('\x00');
    expect(clean).not.toContain('\x07');
  });

  it('enforces rigorous length bounds for DoS prevention', () => {
    expect(validateDocumentText('').valid).toBe(false);
    expect(validateDocumentText('Short text').valid).toBe(false);
    expect(validateDocumentText('A valid legal clause spanning more than twenty characters.').valid).toBe(true);
    expect(validateDocumentText(12345).valid).toBe(false);
  });

  it('generates consistent SHA-256 cache fingerprints for identical inputs', () => {
    const text = 'Party A shall pay Party B Net 30.';
    const key1 = computeCacheKey('analysis', text, 'Vendor');
    const key2 = computeCacheKey('analysis', text, 'Vendor');
    const keyDifferent = computeCacheKey('analysis', text, 'Customer');

    expect(key1).toBe(key2);
    expect(key1).not.toBe(keyDifferent);
    expect(key1).toHaveLength(64); // SHA-256 hex length
  });
});
