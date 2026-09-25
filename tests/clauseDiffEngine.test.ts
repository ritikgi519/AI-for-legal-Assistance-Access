import { describe, it, expect } from 'vitest';
import { analyzeClauseDiff, detectKeyLegalModifications } from '../src/utils/clauseDiffEngine';

describe('clauseDiffEngine & Key Legal Modifications Detector', () => {
  it('correctly detects token additions, removals, and unchanged words in sequential order', () => {
    const source = 'Customer shall pay all fees within fifteen (15) days.';
    const target = 'Customer shall pay all fees within thirty (30) days.';

    const diff = analyzeClauseDiff(source, target, 'Source', 'Standard');

    expect(diff.sourceLabel).toBe('Source');
    expect(diff.targetLabel).toBe('Standard');
    expect(diff.removedWordsCount).toBeGreaterThan(0);
    expect(diff.addedWordsCount).toBeGreaterThan(0);

    // Removed tokens should include 'fifteen'
    const removedTokens = diff.sourceTokens.filter(t => t.type === 'removed');
    expect(removedTokens.some(t => t.text.includes('fifteen'))).toBe(true);

    // Added tokens should include 'thirty'
    const addedTokens = diff.targetTokens.filter(t => t.type === 'added');
    expect(addedTokens.some(t => t.text.includes('thirty'))).toBe(true);
  });

  it('detects substantive legal modifications including mutuality shifts and liability caps', () => {
    const oneSidedClause = 'Customer shall indemnify and defend Provider for all claims without limitation.';
    const modelClause = 'Each party shall mutually indemnify and defend the other party, subject to the aggregate liability cap of twelve (12) months fees paid.';

    const keyMods = detectKeyLegalModifications(oneSidedClause, modelClause, 'Indemnification');

    expect(keyMods.length).toBeGreaterThan(0);

    // Should detect mutuality shift
    const mutualityMod = keyMods.find(m => m.category.includes('Mutuality'));
    expect(mutualityMod).toBeDefined();
    expect(mutualityMod?.label).toContain('Reciprocal');

    // Should detect 12-month liability cap
    const capMod = keyMods.find(m => m.category.includes('Liability'));
    expect(capMod).toBeDefined();
    expect(capMod?.label).toContain('12-Month');
  });

  it('detects consequential damages waivers and carve-outs', () => {
    const rawClause = 'Provider shall not be liable for direct damages.';
    const modelClause = 'Neither party shall be liable for indirect, incidental, or consequential damages (including loss of profits), except for breaches involving gross negligence or willful misconduct.';

    const keyMods = detectKeyLegalModifications(rawClause, modelClause, 'Liability');

    const damagesMod = keyMods.find(m => m.category.includes('Damages'));
    expect(damagesMod).toBeDefined();
    expect(damagesMod?.label).toContain('Consequential');

    const carveoutMod = keyMods.find(m => m.category.includes('Carve-Outs'));
    expect(carveoutMod).toBeDefined();
  });

  it('gracefully handles OMISSION DETECTED strings as source', () => {
    const omissionSource = '[OMISSION DETECTED] No reciprocal indemnification covenant present in document.';
    const modelTarget = 'Each party agrees to indemnify the other from third-party claims.';

    const diff = analyzeClauseDiff(omissionSource, modelTarget, 'Source', 'Benchmark Model');
    expect(diff.addedWordsCount).toBeGreaterThan(0);
    expect(diff.keyModifications.some(m => m.id === 'omission-remedied')).toBe(true);
  });
});
