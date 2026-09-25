import { describe, it, expect, beforeEach } from 'vitest';
import { 
  togglePinClause, 
  updatePinnedItemNote, 
  updatePinnedItemPriority, 
  removePinnedItem, 
  exportCuratedDossierMarkdown,
  loadPinnedDossier,
  savePinnedDossier,
  PinnedDossierItem
} from '../src/utils/pinnedDossierTracker';
import { CriticalClauseAudit } from '../src/types';

describe('Pinned Dossier & Curated Consultation Tracker', () => {
  const mockClause1: CriticalClauseAudit = {
    clause_id: 'SEC-4.1',
    clause_category: 'Indemnification & Defense',
    verbatim_quote: 'Customer shall unconditionally defend, indemnify, and hold harmless Provider.',
    plain_english_meaning: 'One-sided indemnity forcing customer to absorb all liabilities.',
    party_favored: 'Provider (Unilateral)',
    risk_level: 'CRITICAL',
    proposed_redline: 'Each party shall mutually defend and indemnify the other against third-party claims.',
    hidden_pitfalls: ['No reciprocal defense covenant', 'Uncapped exposure']
  };

  const mockClause2: CriticalClauseAudit = {
    clause_id: 'SEC-8.3',
    clause_category: 'Termination & Default',
    verbatim_quote: 'Provider may terminate immediately upon 3 days electronic notice.',
    plain_english_meaning: 'Unreasonably truncated cure period for customer.',
    party_favored: 'Provider',
    risk_level: 'HIGH',
    proposed_redline: 'Either party may terminate upon 30 days written notice with opportunity to cure.',
    hidden_pitfalls: ['No cure period provided']
  };

  beforeEach(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  it('pins a clause to the dossier and initializes default properties', () => {
    let collection: Record<string, PinnedDossierItem> = {};
    const { updated, wasPinned } = togglePinClause(collection, mockClause1);

    expect(wasPinned).toBe(true);
    expect(updated[mockClause1.clause_id]).toBeDefined();
    expect(updated[mockClause1.clause_id].clauseId).toBe('SEC-4.1');
    expect(updated[mockClause1.clause_id].priority).toBe('HIGH_PRIORITY'); // critical clauses default to HIGH_PRIORITY
    expect(updated[mockClause1.clause_id].workingRedline).toBe(mockClause1.proposed_redline);
  });

  it('unpins an already pinned clause on subsequent toggle', () => {
    let collection: Record<string, PinnedDossierItem> = {};
    const { updated: step1 } = togglePinClause(collection, mockClause1);
    expect(step1[mockClause1.clause_id]).toBeDefined();

    const { updated: step2, wasPinned } = togglePinClause(step1, mockClause1);
    expect(wasPinned).toBe(false);
    expect(step2[mockClause1.clause_id]).toBeUndefined();
  });

  it('updates custom client consultation notes and consultation priority', () => {
    let collection: Record<string, PinnedDossierItem> = {};
    const { updated: withItem } = togglePinClause(collection, mockClause2);

    // Update client note
    const withNote = updatePinnedItemNote(
      withItem, 
      mockClause2.clause_id, 
      'Ask attorney if 30 days cure is standard under NY law'
    );
    expect(withNote[mockClause2.clause_id].customNote).toBe('Ask attorney if 30 days cure is standard under NY law');

    // Update priority to WALKAWAY
    const withPriority = updatePinnedItemPriority(
      withNote, 
      mockClause2.clause_id, 
      'WALKAWAY'
    );
    expect(withPriority[mockClause2.clause_id].priority).toBe('WALKAWAY');
  });

  it('removes an item directly by clause ID', () => {
    let collection: Record<string, PinnedDossierItem> = {};
    const { updated: step1 } = togglePinClause(collection, mockClause1);
    const { updated: step2 } = togglePinClause(step1, mockClause2);
    expect(Object.keys(step2).length).toBe(2);

    const step3 = removePinnedItem(step2, mockClause1.clause_id);
    expect(step3[mockClause1.clause_id]).toBeUndefined();
    expect(step3[mockClause2.clause_id]).toBeDefined();
  });

  it('exports a structured Markdown consultation dossier with curated points and objectives', () => {
    let collection: Record<string, PinnedDossierItem> = {};
    const { updated: step1 } = togglePinClause(collection, mockClause1);
    const step2 = updatePinnedItemNote(
      step1, 
      mockClause1.clause_id, 
      'Confirm whether mutual carve-outs include gross negligence'
    );

    const items = Object.values(step2);
    const markdown = exportCuratedDossierMarkdown(items, 'Master Cloud SaaS Agreement', 42);

    expect(markdown).toContain('# CURATED ATTORNEY CONSULTATION DOSSIER');
    expect(markdown).toContain('Master Cloud SaaS Agreement');
    expect(markdown).toContain('SEC-4.1');
    expect(markdown).toContain('Indemnification & Defense');
    expect(markdown).toContain('Confirm whether mutual carve-outs include gross negligence');
    expect(markdown).toContain('Customer shall unconditionally defend');
  });

  it('persists and reloads pinned dossier from session storage', () => {
    let collection: Record<string, PinnedDossierItem> = {};
    const { updated } = togglePinClause(collection, mockClause1);
    
    savePinnedDossier('TestDoc_MSA', updated);

    const reloaded = loadPinnedDossier('TestDoc_MSA');
    expect(reloaded[mockClause1.clause_id]).toBeDefined();
    expect(reloaded[mockClause1.clause_id].clauseId).toBe('SEC-4.1');
  });
});
