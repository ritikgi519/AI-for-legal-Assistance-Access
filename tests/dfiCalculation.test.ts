import { describe, it, expect } from 'vitest';
import { computeDFIBreakdown } from '../src/utils/citationMatcher';
import { CriticalClauseAudit } from '../src/types';

describe('Document Fairness Index (DFI) Scoring Ledger', () => {
  const mockClauses: CriticalClauseAudit[] = [
    {
      clause_id: 'SEC-1',
      clause_category: 'Indemnification',
      verbatim_quote: 'Vendor indemnifies Client unconditionally without cap.',
      plain_english_meaning: 'Vendor pays for everything, Client pays nothing.',
      party_favored: 'Client',
      risk_level: 'CRITICAL',
      hidden_pitfalls: ['Uncapped liability exposure'],
      proposed_redline: 'Each party shall mutually indemnify...',
      renegotiation_priority: 1
    },
    {
      clause_id: 'SEC-2',
      clause_category: 'Termination',
      verbatim_quote: 'Client may terminate immediately; Vendor must give 180 days notice.',
      plain_english_meaning: 'Client can fire Vendor on the spot without reason.',
      party_favored: 'Client',
      risk_level: 'HIGH',
      hidden_pitfalls: ['Asymmetric termination notice'],
      proposed_redline: 'Either party may terminate upon 30 days notice...',
      renegotiation_priority: 2
    },
    {
      clause_id: 'SEC-3',
      clause_category: 'Warranties',
      verbatim_quote: '[OMISSION DETECTED: Missing mutual non-infringement warranty]',
      plain_english_meaning: 'There is no guarantee that provided assets do not infringe third-party IP.',
      party_favored: 'Neither',
      risk_level: 'HIGH',
      hidden_pitfalls: ['Third party infringement risk unprotected'],
      proposed_redline: 'Client represents and warrants that supplied materials...',
      renegotiation_priority: 3
    },
    {
      clause_id: 'SEC-4',
      clause_category: 'Governing Law',
      verbatim_quote: 'Governed by Delaware law with mutual dispute mediation.',
      plain_english_meaning: 'Standard neutral jurisdiction.',
      party_favored: 'Mutual',
      risk_level: 'LOW',
      hidden_pitfalls: [],
      proposed_redline: 'Maintain current language.',
      renegotiation_priority: 4
    }
  ];

  it('computes transparent mathematical deductions per clause severity', () => {
    const deductions = computeDFIBreakdown(mockClauses);

    expect(deductions).toHaveLength(4);

    // Critical clause should have -20 impact
    expect(deductions[0].impact).toBe(-20);
    expect(deductions[0].status).toBe('Heavily Unilateral');

    // High risk should have -12 impact
    expect(deductions[1].impact).toBe(-12);
    expect(deductions[1].status).toBe('Moderately Asymmetric');

    // Omission detected should have -15 impact
    expect(deductions[2].impact).toBe(-15);
    expect(deductions[2].status).toBe('Omission Detected');

    // Low risk balanced should have 0 impact
    expect(deductions[3].impact).toBe(0);
    expect(deductions[3].status).toBe('Balanced Reciprocal');
  });

  it('accurately identifies favored parties across covenants', () => {
    const deductions = computeDFIBreakdown(mockClauses);
    expect(deductions[0].party_favored).toBe('Client');
    expect(deductions[3].party_favored).toBe('Mutual');
  });
});
