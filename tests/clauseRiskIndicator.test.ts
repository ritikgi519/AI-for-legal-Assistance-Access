/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateClauseRiskScore, 
  getRiskTierFromScore, 
  getClauseRiskIndicator 
} from '../src/utils/clauseExport';
import { CriticalClauseAudit } from '../src/types';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';

describe('Clause Audit Card Risk Indicator Tag Suite', () => {
  const criticalClause: CriticalClauseAudit = {
    clause_id: 'Section 8.2',
    clause_category: 'Liability',
    verbatim_quote: 'Vendor aggregate liability shall not exceed $100.',
    plain_english_meaning: 'Illusion of remedy; customer bears virtually all financial risk.',
    risk_level: 'CRITICAL',
    party_favored: 'Vendor',
    hidden_pitfalls: [
      'Uncapped customer risk',
      'No carve-outs for data security',
      'Artificial nominal cap'
    ],
    proposed_redline: 'Mutual aggregate liability capped at twelve months fees.'
  };

  const highClause: CriticalClauseAudit = {
    clause_id: 'Section 6.1',
    clause_category: 'Termination',
    verbatim_quote: 'Customer must provide notice 120 days prior via certified mail.',
    plain_english_meaning: 'Automatic renewal trap with strict physical mail requirements.',
    risk_level: 'HIGH',
    party_favored: 'Vendor',
    hidden_pitfalls: [
      '120-day window easily missed',
      'Physical certified mail requirement'
    ],
    proposed_redline: '30-day notice via standard electronic email.'
  };

  const mediumClause: CriticalClauseAudit = {
    clause_id: 'Section 3.1',
    clause_category: 'Payment',
    verbatim_quote: 'Customer shall pay all fees within 15 days of invoice date.',
    plain_english_meaning: 'Short invoice payment turnaround period.',
    risk_level: 'MEDIUM',
    party_favored: 'Vendor',
    hidden_pitfalls: [
      '15-day window may clash with standard 30-day AP cycles'
    ],
    proposed_redline: 'Net 30 days payment terms.'
  };

  const lowClause: CriticalClauseAudit = {
    clause_id: 'Section 18.4',
    clause_category: 'Confidentiality',
    verbatim_quote: 'Each party shall hold proprietary information in strict confidence for 3 years.',
    plain_english_meaning: 'Standard mutual non-disclosure commitment.',
    risk_level: 'LOW',
    party_favored: 'Mutual',
    hidden_pitfalls: [],
    proposed_redline: 'Each party shall hold proprietary information in strict confidence for 3 years.'
  };

  describe('Internal Risk Assessment Score Calculation', () => {
    it('calculates a score >= 70 for critical unilateral clauses with pitfalls', () => {
      const score = calculateClauseRiskScore(criticalClause);
      expect(score).toBeGreaterThanOrEqual(70);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('calculates a score >= 65 for high risk clauses', () => {
      const score = calculateClauseRiskScore(highClause);
      expect(score).toBeGreaterThanOrEqual(65);
    });

    it('calculates a score between 40 and 64 for medium risk clauses', () => {
      const score = calculateClauseRiskScore(mediumClause);
      expect(score).toBeGreaterThanOrEqual(40);
      expect(score).toBeLessThan(65);
    });

    it('calculates a score < 40 for low risk mutual clauses', () => {
      const score = calculateClauseRiskScore(lowClause);
      expect(score).toBeLessThan(40);
      expect(score).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Risk Tier Derivation (Low, Medium, High)', () => {
    it('maps high score ranges to High tier', () => {
      expect(getRiskTierFromScore(98)).toBe('High');
      expect(getRiskTierFromScore(75)).toBe('High');
      expect(getRiskTierFromScore(65)).toBe('High');
    });

    it('maps intermediate score ranges to Medium tier', () => {
      expect(getRiskTierFromScore(64)).toBe('Medium');
      expect(getRiskTierFromScore(52)).toBe('Medium');
      expect(getRiskTierFromScore(40)).toBe('Medium');
    });

    it('maps low score ranges to Low tier', () => {
      expect(getRiskTierFromScore(39)).toBe('Low');
      expect(getRiskTierFromScore(22)).toBe('Low');
      expect(getRiskTierFromScore(10)).toBe('Low');
    });
  });

  describe('Color-Coded Risk Indicator Tag Configuration', () => {
    it('produces color-coded High risk tag with red/rose styling and dot', () => {
      const indicator = getClauseRiskIndicator(criticalClause);
      expect(indicator.tier).toBe('High');
      expect(indicator.badge).toContain('rose');
      expect(indicator.dot).toContain('rose');
      expect(indicator.tooltip).toContain('Internal Risk Assessment Score');
      expect(indicator.tooltip).toContain(`${indicator.score}/100`);
      expect(indicator.tooltip).toContain('High Risk');
    });

    it('produces color-coded Medium risk tag with amber/yellow styling and dot', () => {
      const indicator = getClauseRiskIndicator(mediumClause);
      expect(indicator.tier).toBe('Medium');
      expect(indicator.badge).toContain('amber');
      expect(indicator.dot).toContain('amber');
      expect(indicator.tooltip).toContain('Medium Risk');
    });

    it('produces color-coded Low risk tag with emerald/green styling and dot', () => {
      const indicator = getClauseRiskIndicator(lowClause);
      expect(indicator.tier).toBe('Low');
      expect(indicator.badge).toContain('emerald');
      expect(indicator.dot).toContain('emerald');
      expect(indicator.tooltip).toContain('Low Risk');
    });

    it('evaluates all sample contract preset clauses cleanly', () => {
      const clauses = SAMPLE_CONTRACTS[0].presetAnalysis?.critical_clause_audit || [];
      expect(clauses.length).toBeGreaterThan(0);

      clauses.forEach((clause) => {
        const indicator = getClauseRiskIndicator(clause);
        expect(['Low', 'Medium', 'High']).toContain(indicator.tier);
        expect(indicator.score).toBeGreaterThanOrEqual(5);
        expect(indicator.score).toBeLessThanOrEqual(100);
        expect(indicator.badge).toBeDefined();
        expect(indicator.dot).toBeDefined();
      });
    });
  });
});
