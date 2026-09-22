import { describe, it, expect } from 'vitest';
import { compareDocuments } from '../src/utils/documentComparator';
import { generateWordDiff } from '../src/utils/citationMatcher';
import { COMPARISON_PRESETS } from '../src/data/comparisonPresets';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';

describe('Diff Highlighting System & Discrepancy Matching', () => {
  it('correctly categorizes modifications, additions, and removals for red/green visual highlighting', () => {
    const docA = SAMPLE_CONTRACTS[0].content;
    const preset = COMPARISON_PRESETS[0];
    const comparison = compareDocuments(docA, preset.docBText, 'Baseline', preset.docBTitle);

    expect(comparison.totalDiscrepancies).toBeGreaterThan(0);

    // Baseline (Doc A) differences should include variations and potential removals (red highlights)
    const modifiedClauses = comparison.discrepancies.filter(d => d.type === 'MODIFIED');
    expect(modifiedClauses.length).toBeGreaterThan(0);

    modifiedClauses.forEach(disc => {
      // Must have valid line coordinates in both doc A and doc B
      expect(disc.docALineStart).toBeGreaterThan(0);
      expect(disc.docALineEnd).toBeGreaterThanOrEqual(disc.docALineStart);
      expect(disc.docBLineStart).toBeGreaterThan(0);
      expect(disc.docBLineEnd).toBeGreaterThanOrEqual(disc.docBLineStart);

      // Doc A text and Doc B text must be substantive
      expect(disc.docAText.length).toBeGreaterThan(5);
      expect(disc.docBText.length).toBeGreaterThan(5);
    });
  });

  it('generates word-level diff tokens to pinpoint specific deleted (red) vs added (green) legal terms', () => {
    const originalClause = 'Customer shall pay all subscription fees within fifteen (15) days of invoice date.';
    const revisedClause = 'Customer shall pay all subscription fees within thirty (30) days of invoice date (Net 30).';

    const tokens = generateWordDiff(originalClause, revisedClause);

    // Check that unchanged terms exist
    const unchangedTokens = tokens.filter(t => t.type === 'unchanged');
    expect(unchangedTokens.some(t => t.text.includes('subscription'))).toBe(true);

    // Check that removed term 'fifteen' from original is identified as removed (red)
    const removedTokens = tokens.filter(t => t.type === 'removed');
    expect(removedTokens.some(t => t.text.includes('fifteen'))).toBe(true);
  });

  it('detects unreciprocal vs balanced terms between two loaded documents', () => {
    const aggressiveDoc = COMPARISON_PRESETS[1].docBText;
    const balancedDoc = COMPARISON_PRESETS[0].docBText;
    const comparison = compareDocuments(aggressiveDoc, balancedDoc, 'Aggressive Version', 'Balanced Counter-Draft');

    expect(comparison.similarityScore).toBeLessThan(90);
    expect(comparison.summary.modifications).toBeGreaterThan(0);
  });
});
