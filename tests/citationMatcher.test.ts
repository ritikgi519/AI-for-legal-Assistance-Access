import { describe, it, expect } from 'vitest';
import { verifyCitation } from '../src/utils/citationMatcher';

describe('Strict Citation Lock & Ground-Truth Matcher', () => {
  const sampleContract = `MASTER SERVICES AGREEMENT
Section 5. Indemnification.
Vendor shall indemnify, defend, and hold harmless Client from and against any claims, losses, liabilities, damages, and expenses (including reasonable attorneys' fees) arising out of or resulting from Vendor's breach of this Agreement.

Section 8. Limitation of Liability.
IN NO EVENT SHALL CLIENT'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED ONE HUNDRED DOLLARS ($100).

Section 12. Governing Law.
This Agreement shall be governed by the laws of the State of Delaware.`;

  it('verifies exact verbatim quote with 100% confidence and correct line coordinate', () => {
    const quote = "IN NO EVENT SHALL CLIENT'S AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED ONE HUNDRED DOLLARS ($100).";
    const result = verifyCitation(sampleContract, quote);

    expect(result.isVerified).toBe(true);
    expect(result.confidence).toBe(100);
    expect(result.isOmission).toBe(false);
    expect(result.lineNumber).toBe(6);
    expect(result.matchedText).toBe(quote);
  });

  it('verifies case-insensitive matches with high confidence', () => {
    const quote = "section 12. governing law.";
    const result = verifyCitation(sampleContract, quote);

    expect(result.isVerified).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(95);
    expect(result.lineNumber).toBe(8);
  });

  it('flags [OMISSION DETECTED] as an omission with zero false positive ground truth', () => {
    const omissionQuote = "[OMISSION DETECTED: Lack of mutual indemnification or vendor liability cap]";
    const result = verifyCitation(sampleContract, omissionQuote);

    expect(result.isOmission).toBe(true);
    expect(result.isVerified).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.lineNumber).toBe(-1);
  });

  it('rejects hallucinated or non-existent quotes', () => {
    const nonExistentQuote = "Client agrees to pay Vendor a bonus of One Million Dollars within thirty days.";
    const result = verifyCitation(sampleContract, nonExistentQuote);

    expect(result.isVerified).toBe(false);
    expect(result.confidence).toBe(0);
    expect(result.startIndex).toBe(-1);
  });

  it('handles normalized whitespace variations across lines', () => {
    const quote = "Vendor shall indemnify, defend, and hold harmless Client";
    const result = verifyCitation(sampleContract, quote);

    expect(result.isVerified).toBe(true);
    expect(result.startIndex).toBeGreaterThan(0);
  });
});
