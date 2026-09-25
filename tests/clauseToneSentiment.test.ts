/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  analyzeClauseLegaleseTone, 
  getClauseToneSentiment 
} from '../src/utils/clauseToneAnalyzer';
import { CriticalClauseAudit } from '../src/types';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';

describe('Clause Legalese Tone & Sentiment Analysis Suite', () => {
  const assertiveIndemnityClause: CriticalClauseAudit = {
    clause_id: 'Section 11.1',
    clause_category: 'Indemnity',
    verbatim_quote: 'Customer shall defend, indemnify, and hold harmless Vendor from and against any and all claims including uncapped attorneys fees.',
    plain_english_meaning: 'Customer bears open-ended liability and must pay all legal fees if vendor is sued.',
    risk_level: 'CRITICAL',
    party_favored: 'Vendor',
    hidden_pitfalls: [
      'Uncapped legal fee exposure',
      'Unilateral customer-only obligation'
    ],
    proposed_redline: 'Mutual indemnity with reasonable attorney fee recovery.'
  };

  const assertiveDiscretionClause: CriticalClauseAudit = {
    clause_id: 'Section 9.1',
    clause_category: 'Termination',
    verbatim_quote: 'Company may terminate this Agreement immediately without cause at its sole and absolute discretion upon written notice.',
    plain_english_meaning: 'Company can cancel contract on the spot without penalty or explanation.',
    risk_level: 'HIGH',
    party_favored: 'Company',
    hidden_pitfalls: [
      'Immediate unilateral termination',
      'No cure period provided'
    ],
    proposed_redline: 'Either party may terminate upon 30 days prior written notice.'
  };

  const protectiveCureClause: CriticalClauseAudit = {
    clause_id: 'Section 12.3',
    clause_category: 'Termination',
    verbatim_quote: 'Neither party may terminate for breach without providing written notice and a thirty (30) day opportunity to cure.',
    plain_english_meaning: 'Protects both parties by requiring written notice and 30 days to resolve any problem before canceling.',
    risk_level: 'LOW',
    party_favored: 'Mutual',
    hidden_pitfalls: [],
    proposed_redline: 'Neither party may terminate without written notice and a 30-day cure opportunity.'
  };

  const protectiveLiabilityCapClause: CriticalClauseAudit = {
    clause_id: 'Section 8.2',
    clause_category: 'Liability',
    verbatim_quote: 'Provided, however, each party aggregate liability shall not exceed the total fees paid in the preceding twelve (12) months, excluding damages arising from gross negligence.',
    plain_english_meaning: 'Protects each party by capping monetary risk to annual contract value with standard safe-harbor carve-outs.',
    risk_level: 'LOW',
    party_favored: 'Client',
    hidden_pitfalls: [],
    proposed_redline: 'Mutual liability ceiling capped at 12 months fees.'
  };

  const neutralGoverningLawClause: CriticalClauseAudit = {
    clause_id: 'Section 19.1',
    clause_category: 'Dispute',
    verbatim_quote: 'This Agreement shall be governed by the laws of the State of Delaware. Any dispute shall be resolved in courts located in New Castle County.',
    plain_english_meaning: 'Standard governing law and venue selection clause.',
    risk_level: 'LOW',
    party_favored: 'Mutual',
    hidden_pitfalls: [],
    proposed_redline: 'Governed by Delaware law.'
  };

  const neutralSeverabilityClause: CriticalClauseAudit = {
    clause_id: 'Section 20.4',
    clause_category: 'Dispute',
    verbatim_quote: 'If any provision is held invalid, the remainder of this Agreement shall remain in full force and effect. Headings are for convenience only.',
    plain_english_meaning: 'Standard administrative severability and interpretation terms.',
    risk_level: 'LOW',
    party_favored: 'Mutual',
    hidden_pitfalls: [],
    proposed_redline: 'Standard severability.'
  };

  describe('Assertive Tone Sentiment Classification', () => {
    it('classifies uncapped unilateral indemnity as Assertive with purple badge', () => {
      const result = analyzeClauseLegaleseTone(assertiveIndemnityClause);
      expect(result.sentiment).toBe('Assertive');
      expect(result.label).toBe('Assertive');
      expect(result.badge).toContain('text-purple-300');
      expect(result.dot).toContain('bg-purple-400');
      expect(result.icon).toBe('Flame');
      expect(result.partyIntentSummary).toMatch(/unilateral|aggressive|strict/i);
      expect(result.score).toBeGreaterThanOrEqual(68);
    });

    it('classifies sole discretion termination as Assertive and extracts key markers', () => {
      const result = analyzeClauseLegaleseTone(assertiveDiscretionClause);
      expect(result.sentiment).toBe('Assertive');
      expect(result.keyMarkers).toEqual(expect.arrayContaining(['sole discretion']));
      expect(result.tooltip).toContain('Assertive');
      expect(result.tooltip).toMatch(/sole discretion/i);
    });
  });

  describe('Protective Tone Sentiment Classification', () => {
    it('classifies notice-and-cure provisions as Protective with sky blue badge', () => {
      const result = analyzeClauseLegaleseTone(protectiveCureClause);
      expect(result.sentiment).toBe('Protective');
      expect(result.label).toBe('Protective');
      expect(result.badge).toContain('text-sky-300');
      expect(result.dot).toContain('bg-sky-400');
      expect(result.icon).toBe('Shield');
      expect(result.partyIntentSummary).toMatch(/safeguards|shield|mitigate/i);
    });

    it('classifies liability ceiling and carve-out safe harbors as Protective', () => {
      const result = analyzeClauseLegaleseTone(protectiveLiabilityCapClause);
      expect(result.sentiment).toBe('Protective');
      expect(result.keyMarkers).toEqual(expect.arrayContaining(['liability ceiling']));
      expect(result.partyIntentSummary).toMatch(/liability caps|defensive/i);
    });
  });

  describe('Neutral Tone Sentiment Classification', () => {
    it('classifies standard governing law clauses as Neutral with slate badge', () => {
      const result = analyzeClauseLegaleseTone(neutralGoverningLawClause);
      expect(result.sentiment).toBe('Neutral');
      expect(result.label).toBe('Neutral');
      expect(result.badge).toContain('text-slate-300');
      expect(result.dot).toContain('bg-slate-400');
      expect(result.icon).toBe('Scale');
      expect(result.partyIntentSummary).toMatch(/balanced|standard|procedural/i);
    });

    it('classifies severability and administrative boilerplate as Neutral', () => {
      const result = analyzeClauseLegaleseTone(neutralSeverabilityClause);
      expect(result.sentiment).toBe('Neutral');
      expect(result.keyMarkers).toEqual(expect.arrayContaining(['standard boilerplate']));
    });
  });

  describe('Preset Intent / Override Handling', () => {
    it('respects pre-existing legalese_tone property when provided', () => {
      const customClause: CriticalClauseAudit = {
        ...assertiveIndemnityClause,
        legalese_tone: 'Protective'
      };
      const result = analyzeClauseLegaleseTone(customClause);
      expect(result.sentiment).toBe('Protective');
      expect(result.label).toBe('Protective');
      expect(result.badge).toContain('text-sky-300');
    });

    it('works identically via getClauseToneSentiment alias', () => {
      const res1 = analyzeClauseLegaleseTone(assertiveIndemnityClause);
      const res2 = getClauseToneSentiment(assertiveIndemnityClause);
      expect(res1.sentiment).toBe(res2.sentiment);
      expect(res1.score).toBe(res2.score);
    });
  });

  describe('Sample Contracts Comprehensive Audit', () => {
    it('analyzes all sample contract clauses without error and assigns valid sentiments', () => {
      const allSampleClauses = SAMPLE_CONTRACTS.flatMap(
        c => c.presetAnalysis?.critical_clause_audit || []
      );
      expect(allSampleClauses.length).toBeGreaterThan(0);

      allSampleClauses.forEach(clause => {
        const tone = getClauseToneSentiment(clause);
        expect(['Assertive', 'Neutral', 'Protective']).toContain(tone.sentiment);
        expect(tone.score).toBeGreaterThanOrEqual(50);
        expect(tone.score).toBeLessThanOrEqual(100);
        expect(tone.partyIntentSummary.length).toBeGreaterThan(10);
        expect(tone.tooltip.length).toBeGreaterThan(20);
        expect(tone.badge).toBeDefined();
        expect(tone.dot).toBeDefined();
        expect(['Flame', 'Shield', 'Scale']).toContain(tone.icon);
      });
    });
  });
});
