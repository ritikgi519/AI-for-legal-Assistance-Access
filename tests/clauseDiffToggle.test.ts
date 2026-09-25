import { describe, it, expect } from 'vitest';
import { analyzeClauseDiff, detectKeyLegalModifications } from '../src/utils/clauseDiffEngine';
import { getBenchmarkForCategory } from '../src/utils/benchmarkClauses';
import { 
  createInitialVersionEntry, 
  recordModificationAction, 
  recordBenchmarkAppliedAction, 
  revertToVersionEntry,
  ClauseSessionState
} from '../src/utils/clauseVersionTracker';
import { CriticalClauseAudit } from '../src/types';

describe("Clause Audit Card 'Diff' Toggle & Model Comparison Engine", () => {
  const sampleClause: CriticalClauseAudit = {
    clause_id: 'SEC-11.2',
    clause_category: 'Liability & Damages',
    verbatim_quote: 'Customer shall be liable without limitation for all direct, indirect, and consequential losses. Provider liability is capped at $100.',
    plain_english_meaning: 'Creates an extreme unilateral imbalance where customer has unlimited liability while vendor caps exposure to $100.',
    party_favored: 'Vendor (Aggressive)',
    risk_level: 'CRITICAL',
    proposed_redline: 'Each party shall mutually cap total aggregate liability to the fees paid in the twelve (12) months preceding the claim, excluding consequential damages.',
    hidden_pitfalls: [
      'Unilateral nominal cap leaving customer exposed',
      'Uncapped customer consequential damages exposure'
    ]
  };

  it('compares current clause text against a legal standard model (Balanced ABA/NVCA)', () => {
    const benchmark = getBenchmarkForCategory(sampleClause.clause_category);
    expect(benchmark).toBeDefined();
    expect(benchmark.categoryKey).toBe('liability');

    const balancedStandard = benchmark.stances.find(s => s.stance === 'BALANCED')?.boilerplateText || benchmark.defaultBoilerplate;
    expect(balancedStandard.length).toBeGreaterThan(20);

    // Run diff against Legal Standard Model
    const diff = analyzeClauseDiff(
      sampleClause.verbatim_quote,
      balancedStandard,
      'Verbatim Clause',
      'Balanced Market Standard',
      sampleClause.clause_category
    );

    // Verify key modifications are highlighted
    expect(diff.keyModifications.length).toBeGreaterThan(0);
    
    // Consequential damages waiver and liability cap detected
    const hasCapOrDamagesMod = diff.keyModifications.some(
      m => m.category.includes('Liability') || m.category.includes('Damages') || m.category.includes('Mutuality')
    );
    expect(hasCapOrDamagesMod).toBe(true);

    // Verify added and removed words are quantified
    expect(diff.addedWordsCount).toBeGreaterThan(0);
    expect(diff.removedWordsCount).toBeGreaterThan(0);
  });

  it('compares current clause text against Pro-Customer and Pro-Vendor legal standards', () => {
    const benchmark = getBenchmarkForCategory(sampleClause.clause_category);
    const proCustomerStandard = benchmark.stances.find(s => s.stance === 'PRO_CUSTOMER')!.boilerplateText;
    const proVendorStandard = benchmark.stances.find(s => s.stance === 'PRO_VENDOR')!.boilerplateText;

    const diffProCustomer = analyzeClauseDiff(
      sampleClause.verbatim_quote,
      proCustomerStandard,
      'Verbatim Clause',
      'Pro-Customer Standard',
      sampleClause.clause_category
    );

    expect(diffProCustomer.keyModifications.some(m => m.id === 'supercap-protection' || m.category.includes('Liability'))).toBe(true);

    const diffProVendor = analyzeClauseDiff(
      sampleClause.verbatim_quote,
      proVendorStandard,
      'Verbatim Clause',
      'Pro-Vendor Standard',
      sampleClause.clause_category
    );
    expect(diffProVendor.targetTokens.length).toBeGreaterThan(0);
  });

  it('compares current working redline against previous session versions', () => {
    const timestamp = Date.now();
    const initialEntry = createInitialVersionEntry(sampleClause, timestamp - 60000);

    let sessionState: ClauseSessionState = {
      clauseId: sampleClause.clause_id,
      lastReviewedAt: null,
      lastModifiedAt: null,
      reviewStatus: 'UNREVIEWED',
      currentRedline: sampleClause.proposed_redline,
      history: [initialEntry]
    };

    // User edits redline (v2)
    sessionState = recordModificationAction(
      sessionState,
      'Each party mutually agrees to limit liability to six (6) months of fees paid, with mutual consequential waiver.',
      'Negotiated 6-month compromise'
    );

    expect(sessionState.history.length).toBe(2);
    const v1Baseline = sessionState.history[0].redlineText;
    const v2Current = sessionState.currentRedline;

    // Diff between v2 (current) and v1 (previous version)
    const diff = analyzeClauseDiff(
      v2Current,
      v1Baseline,
      'Active Working Redline (v2)',
      'Previous Version (v1)',
      sampleClause.clause_category
    );

    expect(diff.sourceLabel).toBe('Active Working Redline (v2)');
    expect(diff.targetLabel).toBe('Previous Version (v1)');
    expect(diff.targetTokens.length).toBeGreaterThan(0);
    expect(diff.sourceTokens.length).toBeGreaterThan(0);
  });

  it('supports adopting legal standard model as active redline and reverting versions', () => {
    const benchmark = getBenchmarkForCategory(sampleClause.clause_category);
    const standardText = benchmark.defaultBoilerplate;

    const initialEntry = createInitialVersionEntry(sampleClause);
    let state: ClauseSessionState = {
      clauseId: sampleClause.clause_id,
      lastReviewedAt: null,
      lastModifiedAt: null,
      reviewStatus: 'UNREVIEWED',
      currentRedline: sampleClause.proposed_redline,
      history: [initialEntry]
    };

    // Adopt standard
    state = recordBenchmarkAppliedAction(state, standardText, 'Balanced ABA Standard');
    expect(state.currentRedline).toBe(standardText);
    expect(state.history.length).toBe(2);
    expect(state.history[0].actionType).toBe('APPLIED_BENCHMARK');

    // Revert to v1
    state = revertToVersionEntry(state, initialEntry.id);
    expect(state.currentRedline).toBe(sampleClause.proposed_redline);
    expect(state.history.length).toBe(3);
  });
});
