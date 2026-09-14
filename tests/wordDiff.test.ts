import { describe, it, expect } from 'vitest';
import { generateWordDiff } from '../src/utils/citationMatcher';

describe('Word-Level Redline Diff Engine', () => {
  it('correctly marks deleted predatory language and keeps preserved words', () => {
    const original = 'Vendor shall indemnify Client unconditionally';
    const redline = 'Each party shall mutually indemnify the other';

    const tokens = generateWordDiff(original, redline);

    // 'Vendor' is in original but not in redline -> removed
    const vendorToken = tokens.find(t => t.text.toLowerCase() === 'vendor');
    expect(vendorToken).toBeDefined();
    expect(vendorToken?.type).toBe('removed');

    // 'indemnify' is in both -> unchanged
    const indemnifyToken = tokens.find(t => t.text.toLowerCase() === 'indemnify');
    expect(indemnifyToken).toBeDefined();
    expect(indemnifyToken?.type).toBe('unchanged');

    // 'unconditionally' is in original but not in redline -> removed
    const uncondToken = tokens.find(t => t.text.toLowerCase() === 'unconditionally');
    expect(uncondToken).toBeDefined();
    expect(uncondToken?.type).toBe('removed');
  });

  it('preserves whitespace formatting structure for readable legal rendering', () => {
    const original = 'Term 1.\nPayment Net-90.';
    const redline = 'Term 1.\nPayment Net-30.';

    const tokens = generateWordDiff(original, redline);
    expect(tokens.length).toBeGreaterThan(0);
    const hasWhitespace = tokens.some(t => t.text.includes('\n') || t.text.includes(' '));
    expect(hasWhitespace).toBe(true);
  });
});
