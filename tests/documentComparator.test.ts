import { describe, it, expect } from 'vitest';
import { compareDocuments, segmentDocument } from '../src/utils/documentComparator';
import { COMPARISON_PRESETS } from '../src/data/comparisonPresets';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';

describe('Document Comparator Utility', () => {
  it('correctly segments document text into structured sections and lines', () => {
    const sampleText = SAMPLE_CONTRACTS[0].content;
    const { lines, blocks } = segmentDocument(sampleText);

    expect(lines.length).toBeGreaterThan(20);
    expect(blocks.length).toBeGreaterThan(4);
    
    // Check that sections have line numbers and categories
    const liabilityBlock = blocks.find(b => b.category === 'Liability');
    expect(liabilityBlock).toBeDefined();
    expect(liabilityBlock?.lineStart).toBeGreaterThan(0);
    expect(liabilityBlock?.lineEnd).toBeGreaterThanOrEqual(liabilityBlock!.lineStart);
  });

  it('detects identical documents with 100% parity score and 0 discrepancies', () => {
    const sampleText = SAMPLE_CONTRACTS[0].content;
    const result = compareDocuments(sampleText, sampleText, 'Version A', 'Version A Copy');

    expect(result.similarityScore).toBe(100);
    expect(result.totalDiscrepancies).toBe(0);
    expect(result.summary.modifications).toBe(0);
    expect(result.summary.additions).toBe(0);
    expect(result.summary.removals).toBe(0);
  });

  it('detects substantive clause variations, additions, and removals in counter-proposals', () => {
    const docA = SAMPLE_CONTRACTS[0].content;
    const docBPreset = COMPARISON_PRESETS.find(p => p.id === 'saas-counter-proposal')!;
    const result = compareDocuments(docA, docBPreset.docBText, 'Original MSA', docBPreset.docBTitle);

    expect(result.totalDiscrepancies).toBeGreaterThan(0);
    expect(result.summary.modifications).toBeGreaterThan(0);
    
    // Verify that key shifts were captured (Liability cap shift, Indemnity, Payment, etc.)
    const liabilityVariation = result.discrepancies.find(d => d.category === 'Liability' && d.type === 'MODIFIED');
    expect(liabilityVariation).toBeDefined();
    expect(liabilityVariation?.substantiveImpact).toBe('FAVORABLE_TO_USER');

    const paymentVariation = result.discrepancies.find(d => d.category === 'Payment' && d.type === 'MODIFIED');
    expect(paymentVariation).toBeDefined();
  });

  it('identifies newly added clauses in Document B', () => {
    const docA = `SECTION 1. DEFINITIONS\nTerm 1 means alpha.`;
    const docB = `SECTION 1. DEFINITIONS\nTerm 1 means alpha.\n\nSECTION 2. SERVICE LEVEL AGREEMENT\nVendor guarantees 99.9% uptime.`;

    const result = compareDocuments(docA, docB, 'Doc A', 'Doc B');
    expect(result.summary.additions).toBe(1);
    const addedClause = result.discrepancies.find(d => d.type === 'ADDED');
    expect(addedClause).toBeDefined();
    expect(addedClause?.title).toContain('SECTION 2');
  });

  it('identifies removed clauses in Document B', () => {
    const docA = `SECTION 1. DEFINITIONS\nTerm 1 means alpha.\n\nSECTION 2. PENALTY\nCustomer shall forfeit all assets.`;
    const docB = `SECTION 1. DEFINITIONS\nTerm 1 means alpha.`;

    const result = compareDocuments(docA, docB, 'Doc A', 'Doc B');
    expect(result.summary.removals).toBe(1);
    const removedClause = result.discrepancies.find(d => d.type === 'REMOVED');
    expect(removedClause).toBeDefined();
    expect(removedClause?.title).toContain('SECTION 2');
  });
});
