/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  getBenchmarkForCategory, 
  analyzeClauseBenchmarkGap,
  INDUSTRY_BENCHMARKS
} from '../src/utils/benchmarkClauses';
import { CriticalClauseAudit } from '../src/types';

describe('Industry Benchmark Comparison Suite', () => {
  it('correctly maps various clause categories to their corresponding benchmark standard', () => {
    const categoriesToTest = [
      { input: 'Liability', expectedKey: 'liability', containsText: 'CONSEQUENTIAL' },
      { input: 'Limitation of Liability', expectedKey: 'liability', containsText: 'AGGREGATE' },
      { input: 'Indemnity', expectedKey: 'indemnity', containsText: 'INDEMNIFY' },
      { input: 'Termination', expectedKey: 'termination', containsText: 'CURE' },
      { input: 'Payment', expectedKey: 'payment', containsText: 'NET 30' },
      { input: 'IP', expectedKey: 'ip', containsText: 'WORKS MADE FOR HIRE' },
      { input: 'Non-Compete', expectedKey: 'noncompete', containsText: 'SOLICIT' },
      { input: 'Dispute', expectedKey: 'dispute', containsText: 'DELAWARE' },
      { input: 'Confidentiality', expectedKey: 'confidentiality', containsText: 'CONFIDENTIAL' },
      { input: 'Warranty', expectedKey: 'warranty', containsText: 'WARRANT' },
      { input: 'Force Majeure', expectedKey: 'force_majeure', containsText: 'FORCE MAJEURE' },
      { input: 'Audit', expectedKey: 'audit', containsText: 'AUDIT' }
    ];

    for (const testCase of categoriesToTest) {
      const benchmark = getBenchmarkForCategory(testCase.input);
      expect(benchmark).toBeDefined();
      expect(benchmark.categoryKey).toBe(testCase.expectedKey);
      expect(benchmark.defaultBoilerplate.toUpperCase()).toContain(testCase.containsText);
      expect(benchmark.governingStandard).toBeDefined();
      expect(benchmark.stances.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('provides safe fallback benchmark for undefined or unrecognized categories', () => {
    const fallback1 = getBenchmarkForCategory('');
    expect(fallback1).toBeDefined();
    expect(fallback1.categoryKey).toBe('liability');

    const fallback2 = getBenchmarkForCategory('RandomMiscellaneousCategoryXYZ');
    expect(fallback2).toBeDefined();
    expect(fallback2.categoryKey).toBe('liability');
  });

  it('analyzes gap metrics and identifies mutuality discrepancy for unilateral clauses', () => {
    const unilateralClause: CriticalClauseAudit = {
      clause_id: 'Section 9.1',
      clause_category: 'Liability',
      verbatim_quote: 'Vendor total liability is limited to $100. Customer liability is uncapped for consequential damages.',
      plain_english_meaning: 'Vendor pays at most $100 while Customer is exposed to unlimited damages.',
      risk_level: 'CRITICAL',
      party_favored: 'Vendor Unilateral',
      hidden_pitfalls: [
        'Gross asymmetry leaving customer uncapped',
        'Uncommercial $100 nominal liability cap'
      ],
      proposed_redline: 'Each party liability shall be mutually capped to fees paid over 12 months.'
    };

    const benchmark = getBenchmarkForCategory(unilateralClause.clause_category);
    const gapAnalysis = analyzeClauseBenchmarkGap(unilateralClause, benchmark);

    expect(gapAnalysis.benchmarkTitle).toContain('Mutual Consequential Damages');
    expect(gapAnalysis.mutualityStatus.isAligned).toBe(false);
    expect(gapAnalysis.mutualityStatus.current).toBe('Vendor Unilateral');
    expect(gapAnalysis.mutualityStatus.benchmark).toBe('Mutual / Reciprocal');
    expect(gapAnalysis.riskRating).toBe('CRITICAL');
    expect(gapAnalysis.keyGaps.length).toBeGreaterThan(0);
    expect(gapAnalysis.alignmentScore).toBeLessThan(50);
    expect(gapAnalysis.strategicTakeaway).toContain('Reject this one-sided clause');
  });

  it('scores balanced mutual clauses higher on market alignment', () => {
    const balancedClause: CriticalClauseAudit = {
      clause_id: 'Section 14.3',
      clause_category: 'Indemnity',
      verbatim_quote: 'Each party shall defend and indemnify the other against third party intellectual property claims.',
      plain_english_meaning: 'Both parties mutually defend each other against IP infringement.',
      risk_level: 'LOW',
      party_favored: 'Mutual / Reciprocal',
      hidden_pitfalls: [],
      proposed_redline: 'Each party shall defend and indemnify the other against third party IP claims.'
    };

    const benchmark = getBenchmarkForCategory(balancedClause.clause_category);
    const gapAnalysis = analyzeClauseBenchmarkGap(balancedClause, benchmark);

    expect(gapAnalysis.mutualityStatus.isAligned).toBe(true);
    expect(gapAnalysis.alignmentScore).toBeGreaterThanOrEqual(70);
    expect(gapAnalysis.strategicTakeaway).toContain('closely adheres to industry standards');
  });

  it('detects contract omissions and flags baseline covenants as missing', () => {
    const omissionClause: CriticalClauseAudit = {
      clause_id: 'Section 18.0',
      clause_category: 'Termination',
      verbatim_quote: '[OMISSION DETECTED] No cure period provided prior to immediate termination.',
      plain_english_meaning: 'Agreement can be cancelled with zero cure notice.',
      risk_level: 'CRITICAL',
      party_favored: 'Vendor',
      hidden_pitfalls: ['No 30-day notice and cure period'],
      proposed_redline: 'Either party may terminate upon 30 days written notice with opportunity to cure.'
    };

    const benchmark = getBenchmarkForCategory(omissionClause.clause_category);
    const gapAnalysis = analyzeClauseBenchmarkGap(omissionClause, benchmark);

    expect(gapAnalysis.keyGaps.some(g => g.includes('Omission'))).toBe(true);
    expect(gapAnalysis.alignmentScore).toBeLessThanOrEqual(30);
  });

  it('provides multiple stance variations (Balanced, Pro-Customer, Pro-Vendor) for each category', () => {
    const categories = Object.keys(INDUSTRY_BENCHMARKS);
    for (const catKey of categories) {
      const benchmark = INDUSTRY_BENCHMARKS[catKey];
      const balanced = benchmark.stances.find(s => s.stance === 'BALANCED');
      const proCustomer = benchmark.stances.find(s => s.stance === 'PRO_CUSTOMER');
      const proVendor = benchmark.stances.find(s => s.stance === 'PRO_VENDOR');

      expect(balanced).toBeDefined();
      expect(proCustomer).toBeDefined();
      expect(proVendor).toBeDefined();
      expect(balanced?.boilerplateText.length).toBeGreaterThan(20);
      expect(proCustomer?.boilerplateText.length).toBeGreaterThan(20);
      expect(proVendor?.boilerplateText.length).toBeGreaterThan(20);
    }
  });
});
