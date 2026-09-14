import { describe, it, expect } from 'vitest';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';
import { verifyCitation } from '../src/utils/citationMatcher';

describe('Sample Contracts Ground-Truth & Rubric Conformance', () => {
  it('contains valid high-exposure contracts across multiple legal domains', () => {
    expect(SAMPLE_CONTRACTS.length).toBeGreaterThanOrEqual(3);
    SAMPLE_CONTRACTS.forEach(contract => {
      expect(contract.id).toBeTruthy();
      expect(contract.title).toBeTruthy();
      expect(contract.content.length).toBeGreaterThan(100);
      expect(contract.presetAnalysis).toBeDefined();
    });
  });

  it('guarantees 100% ground truth verbatim quotes in all sample preset audits', () => {
    SAMPLE_CONTRACTS.forEach(contract => {
      const { content, presetAnalysis } = contract;
      expect(presetAnalysis.critical_clause_audit.length).toBeGreaterThan(0);

      presetAnalysis.critical_clause_audit.forEach(clause => {
        const match = verifyCitation(content, clause.verbatim_quote);
        if (clause.verbatim_quote.includes('OMISSION DETECTED')) {
          expect(match.isOmission).toBe(true);
        } else {
          expect(match.isVerified).toBe(true);
          expect(match.confidence).toBeGreaterThanOrEqual(85);
          expect(match.lineNumber).toBeGreaterThan(0);
        }
      });
    });
  });

  it('contains comprehensive stress tests and lawyer dossiers matching problem statement', () => {
    SAMPLE_CONTRACTS.forEach(contract => {
      const { presetAnalysis } = contract;
      expect(presetAnalysis.what_if_stress_tests.length).toBeGreaterThanOrEqual(2);
      expect(
        presetAnalysis.lawyer_consultation_dossier.top_red_flags_for_discussion?.length ||
        (presetAnalysis.lawyer_consultation_dossier as any).key_red_flags?.length
      ).toBeGreaterThan(0);
      expect(
        presetAnalysis.lawyer_consultation_dossier.high_leverage_questions_for_counsel?.length ||
        (presetAnalysis.lawyer_consultation_dossier as any).questions_to_ask_lawyer?.length
      ).toBeGreaterThan(0);
      expect(presetAnalysis.statutory_disclaimer.toLowerCase()).toMatch(/educational|informational/);
    });
  });
});
