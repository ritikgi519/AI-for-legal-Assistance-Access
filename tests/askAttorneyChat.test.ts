import { describe, it, expect } from 'vitest';
import { PinnedDossierItem } from '../src/utils/pinnedDossierTracker';
import { CriticalClauseAudit } from '../src/types';

describe('Ask the Attorney AI Chatbot Context Integration', () => {
  const mockClause1: CriticalClauseAudit = {
    clause_id: 'SEC-3.2',
    clause_category: 'Limitation of Liability & Super-Caps',
    verbatim_quote: "Customer's aggregate recovery is strictly capped at $100. Provider disclaims all consequential damages.",
    plain_english_meaning: 'Asymmetric liability cap leaving customer with nominal recovery.',
    party_favored: 'Provider (Extreme One-Sided)',
    risk_level: 'CRITICAL',
    proposed_redline: "Each party's aggregate liability shall be mutually capped at total fees paid or payable in the prior 12 months.",
    hidden_pitfalls: ['Nominal $100 token cap', 'Uncapped customer exposure']
  };

  const mockPinnedItem: PinnedDossierItem = {
    clauseId: 'SEC-3.2',
    clause: mockClause1,
    pinnedAt: Date.now(),
    priority: 'HIGH_PRIORITY',
    customNote: 'Verify whether a 12-month cap is standard for enterprise SaaS in Delaware',
    workingRedline: mockClause1.proposed_redline
  };

  it('correctly extracts structured context payload from pinned dossier items', () => {
    const items: PinnedDossierItem[] = [mockPinnedItem];

    const contextPayload = items.map(i => ({
      clauseId: i.clauseId,
      category: i.clause?.clause_category || '',
      verbatimQuote: i.clause?.verbatim_quote || '',
      plainEnglish: i.clause?.plain_english_meaning || '',
      riskLevel: i.clause?.risk_level || 'MEDIUM',
      partyFavored: i.clause?.party_favored || '',
      proposedRedline: i.workingRedline || i.clause?.proposed_redline || '',
      clientNotes: i.customNote || '',
      priority: i.priority
    }));

    expect(contextPayload).toHaveLength(1);
    expect(contextPayload[0].clauseId).toBe('SEC-3.2');
    expect(contextPayload[0].category).toBe('Limitation of Liability & Super-Caps');
    expect(contextPayload[0].riskLevel).toBe('CRITICAL');
    expect(contextPayload[0].clientNotes).toContain('Delaware');
    expect(contextPayload[0].verbatimQuote).toContain('$100');
    expect(contextPayload[0].proposedRedline).toContain('12 months');
  });

  it('handles multi-item dossier prioritization correctly', () => {
    const mockClause2: CriticalClauseAudit = {
      clause_id: 'SEC-9.1',
      clause_category: 'Governing Law & Dispute Resolution',
      verbatim_quote: 'All disputes must be litigated exclusively in provider jurisdiction with prevailing party attorney fees.',
      plain_english_meaning: 'Venue requirement and unilateral fee shifting.',
      party_favored: 'Provider',
      risk_level: 'HIGH',
      proposed_redline: 'Mutual arbitration or neutral venue.',
      hidden_pitfalls: ['Venue bias']
    };

    const item2: PinnedDossierItem = {
      clauseId: 'SEC-9.1',
      clause: mockClause2,
      pinnedAt: Date.now() + 10,
      priority: 'WALKAWAY',
      customNote: 'Dealbreaker: We cannot litigate overseas.'
    };

    const items: PinnedDossierItem[] = [mockPinnedItem, item2];
    const walkaways = items.filter(i => i.priority === 'WALKAWAY');
    expect(walkaways).toHaveLength(1);
    expect(walkaways[0].clauseId).toBe('SEC-9.1');
    expect(walkaways[0].customNote).toBe('Dealbreaker: We cannot litigate overseas.');
  });
});
