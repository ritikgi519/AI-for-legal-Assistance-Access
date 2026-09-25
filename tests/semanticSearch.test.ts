import { describe, it, expect } from 'vitest';
import { performSemanticSearch } from '../src/utils/semanticSearch';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';

describe('Global Semantic Search Engine', () => {
  const sample = SAMPLE_CONTRACTS[0];
  const analysis = sample.presetAnalysis!;
  const docText = sample.content;

  it('returns empty array when query is less than 2 characters or whitespace', () => {
    expect(performSemanticSearch('', analysis, docText)).toEqual([]);
    expect(performSemanticSearch('a', analysis, docText)).toEqual([]);
    expect(performSemanticSearch('   ', analysis, docText)).toEqual([]);
  });

  it('finds liability clauses when searching for "liability" or synonyms like "cap" or "damages"', () => {
    const results = performSemanticSearch('liability', analysis, docText);
    expect(results.length).toBeGreaterThan(0);

    const hasLiabilityClause = results.some(r => r.type === 'CLAUSE' && (r.category === 'Liability' || r.title.toLowerCase().includes('liability')));
    expect(hasLiabilityClause).toBe(true);

    // Synonym test
    const capResults = performSemanticSearch('cap', analysis, docText);
    expect(capResults.length).toBeGreaterThan(0);
  });

  it('finds indemnity covenants when searching for "indemnity" or "defend"', () => {
    const results = performSemanticSearch('indemnity', analysis, docText);
    expect(results.length).toBeGreaterThan(0);

    const hasIndemnity = results.some(r => r.category === 'Indemnity' || r.title.toLowerCase().includes('indemn'));
    expect(hasIndemnity).toBe(true);
  });

  it('finds termination notice traps when searching for "termination" or "renewal"', () => {
    const results = performSemanticSearch('renewal', analysis, docText);
    expect(results.length).toBeGreaterThan(0);

    // Should find timeline trap milestone or clause
    const hasRenewalHit = results.some(r => r.title.toLowerCase().includes('renew') || r.category === 'Termination' || r.category === 'RENEWAL');
    expect(hasRenewalHit).toBe(true);
  });

  it('matches stress test scenarios when querying risk concepts like "breach" or "outage"', () => {
    const results = performSemanticSearch('outage', analysis, docText);
    expect(results.length).toBeGreaterThan(0);
  });

  it('ranks higher-scoring direct matches first', () => {
    const results = performSemanticSearch('Section 8', analysis, docText);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('Section 8');
  });

  it('queries specific legal concepts and returns results with clauseId for direct navigation', () => {
    const legalConceptQueries = ['intellectual property', 'payment', 'confidentiality', 'audit'];
    
    for (const query of legalConceptQueries) {
      const results = performSemanticSearch(query, analysis, docText);
      expect(results.length).toBeGreaterThan(0);

      // Verify at least one result has a clauseId or targetTab for clickable jump
      const jumpableResult = results.find(r => r.clauseId || r.targetTab);
      expect(jumpableResult).toBeDefined();
      expect(jumpableResult?.targetTab).toBeDefined();
    }
  });

  it('clause search results provide clauseId and excerpt for direct jumping', () => {
    const results = performSemanticSearch('liability', analysis, docText);
    const clauseResult = results.find(r => r.type === 'CLAUSE');
    
    expect(clauseResult).toBeDefined();
    expect(clauseResult?.clauseId).toBeDefined();
    expect(clauseResult?.clauseId?.length).toBeGreaterThan(0);
    expect(clauseResult?.excerpt).toBeDefined();
  });
});
