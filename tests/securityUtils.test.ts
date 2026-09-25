/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  sanitizeTextInput, 
  escapeHtml, 
  validateLegalDocumentFile, 
  safeRegexMatch 
} from '../src/utils/security';

describe('Security Utility Suite (Sanitization, File Upload, Anti-XSS, ReDoS)', () => {
  it('strips dangerous control characters and null bytes from document input', () => {
    const dirtyText = 'Section 1. \x00NullByte \x08Backspace \x1FUnitSeparator Valid Agreement Text.';
    const cleaned = sanitizeTextInput(dirtyText);
    expect(cleaned).not.toContain('\x00');
    expect(cleaned).not.toContain('\x08');
    expect(cleaned).not.toContain('\x1F');
    expect(cleaned).toContain('Valid Agreement Text.');
  });

  it('normalizes CRLF line breaks to LF and trims whitespace', () => {
    const raw = '  Line 1\r\nLine 2\r\nLine 3  ';
    const cleaned = sanitizeTextInput(raw);
    expect(cleaned).toBe('Line 1\nLine 2\nLine 3');
  });

  it('escapes HTML special characters to prevent XSS payloads', () => {
    const malicious = '<script>alert("xss")</script> & "quotes" \'apostrophe\'';
    const escaped = escapeHtml(malicious);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &quot;quotes&quot; &#039;apostrophe&#039;');
    expect(escaped).not.toContain('<script>');
  });

  it('rejects disallowed file extensions in file upload validation', () => {
    const mockFile = new File(['echo malicious'], 'exploit.sh', { type: 'application/x-sh' });
    const result = validateLegalDocumentFile(mockFile, 'echo malicious');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('not supported');
  });

  it('rejects binary executable headers (MZ / PE / ELF) disguised as text files', () => {
    const mockExeFile = new File(['MZ9000 executable binary stream'], 'contract.txt', { type: 'text/plain' });
    const result = validateLegalDocumentFile(mockExeFile, 'MZ9000 executable binary stream');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('binary or executable');
  });

  it('accepts legitimate .txt and .md legal contracts with proper length', () => {
    const contractText = 'THIS MASTER SERVICES AGREEMENT is made between Client and Provider. Section 1: Services.';
    const mockFile = new File([contractText], 'agreement.txt', { type: 'text/plain' });
    const result = validateLegalDocumentFile(mockFile, contractText);
    expect(result.valid).toBe(true);
    expect(result.sanitizedText).toBeDefined();
  });

  it('safeRegexMatch executes standard patterns safely without throwing', () => {
    const pattern = /indemnity/i;
    const text = 'The customer provides full indemnity against third-party claims.';
    const match = safeRegexMatch(pattern, text);
    expect(match).not.toBeNull();
    expect(match?.[0].toLowerCase()).toBe('indemnity');
  });
});
