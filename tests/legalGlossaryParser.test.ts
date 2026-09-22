import { describe, it, expect } from 'vitest';
import { parseDocumentGlossary, CANONICAL_GLOSSARY_DEFINITIONS } from '../src/utils/legalGlossaryParser';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';

describe('Legal Glossary Parser & Plain-English Definitions', () => {
  it('has canonical glossary definitions with complete fields and plain-English translations', () => {
    expect(CANONICAL_GLOSSARY_DEFINITIONS.length).toBeGreaterThan(10);
    CANONICAL_GLOSSARY_DEFINITIONS.forEach(def => {
      expect(def.id).toBeTruthy();
      expect(def.term).toBeTruthy();
      expect(def.canonicalTerm).toBeTruthy();
      expect(def.plainEnglishDefinition.length).toBeGreaterThan(20);
      expect(def.whyPartiesUseIt.length).toBeGreaterThan(15);
      expect(def.hiddenPitfallOrRisk.length).toBeGreaterThan(15);
      expect(def.proTipsForNegotiation.length).toBeGreaterThan(15);
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(def.riskSeverity);
    });
  });

  it('correctly returns empty terms when given empty text', () => {
    const result = parseDocumentGlossary('');
    expect(result.terms).toEqual([]);
    expect(result.totalOccurrences).toBe(0);
    expect(result.highlightRegex).toBeNull();
  });

  it('detects indemnification, liability caps, and termination traps in benchmark SaaS agreement', () => {
    const saasContract = SAMPLE_CONTRACTS[0];
    const result = parseDocumentGlossary(saasContract.content);

    expect(result.terms.length).toBeGreaterThan(3);
    expect(result.totalOccurrences).toBeGreaterThan(4);

    // Verify presence of Indemnification
    const indemnity = result.terms.find(t => t.canonicalTerm === 'Indemnify' || t.id === 'indemnify');
    expect(indemnity).toBeDefined();
    expect(indemnity?.occurrences.length).toBeGreaterThan(0);
    expect(indemnity?.occurrences[0].lineNumber).toBeGreaterThan(0);

    // Verify presence of Consequential Damages
    const consequential = result.terms.find(t => t.canonicalTerm === 'Consequential Damages');
    expect(consequential).toBeDefined();

    // Verify presence of Limitation of Liability
    const liabilityCap = result.terms.find(t => t.canonicalTerm === 'Limitation of Liability');
    expect(liabilityCap).toBeDefined();
  });

  it('captures line numbers and line snippets accurately', () => {
    const vendorAgreement = SAMPLE_CONTRACTS[1];
    const result = parseDocumentGlossary(vendorAgreement.content);

    result.terms.forEach(term => {
      expect(term.occurrenceCount).toBe(term.occurrences.length);
      term.occurrences.forEach(occ => {
        expect(occ.lineNumber).toBeGreaterThan(0);
        expect(occ.snippet.length).toBeGreaterThan(0);
      });
    });
  });

  it('sorts high risk terms prominently', () => {
    const sample = SAMPLE_CONTRACTS[0];
    const result = parseDocumentGlossary(sample.content);
    if (result.terms.length > 1) {
      const first = result.terms[0];
      expect(['HIGH', 'MEDIUM']).toContain(first.riskSeverity);
    }
  });
});
