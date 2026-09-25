/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  buildRiskRadarData, 
  determineQuadrant, 
  getQuadrantMeta 
} from '../src/utils/riskRadarCalculator';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';
import { CriticalClauseAudit } from '../src/types';

describe('D3 Risk Radar & Risk-Reward Matrix Calculation Suite', () => {
  it('correctly maps clauses into 4 quadrants based on risk and reward coordinates', () => {
    expect(determineQuadrant(85, 20)).toBe('TOXIC_PITFALL');
    expect(determineQuadrant(75, 75)).toBe('STRATEGIC_BET');
    expect(determineQuadrant(25, 80)).toBe('GOLDEN_COVENANT');
    expect(determineQuadrant(20, 30)).toBe('STANDARD_BOILERPLATE');
  });

  it('boundary values at 50% are mapped consistently', () => {
    expect(determineQuadrant(50, 49)).toBe('TOXIC_PITFALL');
    expect(determineQuadrant(50, 50)).toBe('STRATEGIC_BET');
    expect(determineQuadrant(49, 50)).toBe('GOLDEN_COVENANT');
    expect(determineQuadrant(49, 49)).toBe('STANDARD_BOILERPLATE');
  });

  it('getQuadrantMeta provides correct colors and actionable guidance', () => {
    const toxic = getQuadrantMeta('TOXIC_PITFALL');
    expect(toxic.label).toBe('Toxic Pitfalls');
    expect(toxic.color).toBe('#f43f5e');
    expect(toxic.action).toContain('Redline');

    const golden = getQuadrantMeta('GOLDEN_COVENANT');
    expect(golden.label).toBe('Golden Covenants');
    expect(golden.color).toBe('#10b981');
    expect(golden.action).toContain('Preserve');
  });

  it('buildRiskRadarData processes sample contracts and calculates blast radius', () => {
    const sample = SAMPLE_CONTRACTS[0];
    const clauses = sample.presetAnalysis?.critical_clause_audit || [];

    const result = buildRiskRadarData(clauses, sample.title);

    expect(result.nodes.length).toBe(clauses.length);
    expect(result.categoryAggregates.length).toBeGreaterThan(0);

    // Verify all nodes have valid scores and blast radius
    result.nodes.forEach(node => {
      expect(node.riskScore).toBeGreaterThanOrEqual(0);
      expect(node.riskScore).toBeLessThanOrEqual(100);
      expect(node.rewardScore).toBeGreaterThanOrEqual(0);
      expect(node.rewardScore).toBeLessThanOrEqual(100);
      expect(node.blastRadius).toBeGreaterThanOrEqual(8);
      expect(node.blastRadius).toBeLessThanOrEqual(30);
      expect(['TOXIC_PITFALL', 'STRATEGIC_BET', 'GOLDEN_COVENANT', 'STANDARD_BOILERPLATE']).toContain(node.quadrant);
    });

    // Check sum of quadrant counts matches total nodes
    const totalCount = Object.values(result.quadrantCounts).reduce((a, b) => a + b, 0);
    expect(totalCount).toBe(result.nodes.length);
  });

  it('elevates risk score for CRITICAL risk level clauses with unilateral bias', () => {
    const mockClauses: CriticalClauseAudit[] = [
      {
        clause_id: 'Test Section 1',
        clause_category: 'Liability',
        verbatim_quote: 'Customer shall be solely responsible without limitation.',
        plain_english_meaning: 'Customer takes all blame.',
        risk_level: 'CRITICAL',
        party_favored: 'Vendor Unilateral',
        hidden_pitfalls: ['No cap', 'Direct liability'],
        proposed_redline: 'Mutual cap.'
      },
      {
        clause_id: 'Test Section 2',
        clause_category: 'Liability',
        verbatim_quote: 'Parties agree to mutual reciprocal liability caps.',
        plain_english_meaning: 'Both parties are protected equally.',
        risk_level: 'LOW',
        party_favored: 'Mutual',
        hidden_pitfalls: [],
        proposed_redline: 'Standard'
      }
    ];

    const { nodes } = buildRiskRadarData(mockClauses, 'Mock Doc');
    const criticalNode = nodes.find(n => n.clauseId === 'Test Section 1')!;
    const lowNode = nodes.find(n => n.clauseId === 'Test Section 2')!;

    expect(criticalNode.riskScore).toBeGreaterThan(70);
    expect(lowNode.riskScore).toBeLessThan(40);
    expect(criticalNode.riskScore).toBeGreaterThan(lowNode.riskScore);
  });

  it('handles empty clause arrays without error', () => {
    const emptyResult = buildRiskRadarData([], 'Empty');
    expect(emptyResult.nodes).toEqual([]);
    expect(emptyResult.categoryAggregates).toEqual([]);
    expect(emptyResult.quadrantCounts.TOXIC_PITFALL).toBe(0);
  });
});
