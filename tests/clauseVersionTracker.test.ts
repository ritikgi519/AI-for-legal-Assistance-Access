/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createInitialVersionEntry,
  getOrCreateClauseState,
  recordReviewAction,
  recordModificationAction,
  recordBenchmarkAppliedAction,
  revertToVersionEntry,
  formatRelativeSessionTime,
  formatAbsoluteSessionTime,
  getClauseSessionActivityBadge,
  loadSessionVersionStore,
  saveSessionVersionStore,
  ClauseSessionState
} from '../src/utils/clauseVersionTracker';
import { CriticalClauseAudit } from '../src/types';

describe('Clause Session Version History Tracker', () => {
  const mockClause: CriticalClauseAudit = {
    clause_id: 'Section 11.2',
    clause_category: 'Liability',
    verbatim_quote: 'Vendor liability is capped at $50. Customer has unlimited liability.',
    plain_english_meaning: 'Severe asymmetry where vendor risk is practically zero.',
    risk_level: 'CRITICAL',
    party_favored: 'Vendor Unilateral',
    hidden_pitfalls: ['Uncapped customer liability', 'Nominal $50 cap'],
    proposed_redline: 'Total liability of each party shall be mutually capped at 12 months fees paid.'
  };

  const initialTime = 1700000000000;

  beforeEach(() => {
    // Clear mock sessionStorage if defined
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }
  });

  it('creates a proper baseline version history entry on initial audit load', () => {
    const entry = createInitialVersionEntry(mockClause, initialTime);
    expect(entry.id).toContain('v-init-Section_11_2');
    expect(entry.clauseId).toBe('Section 11.2');
    expect(entry.actionType).toBe('INITIAL_AUDIT');
    expect(entry.actor).toBe('Audit Engine');
    expect(entry.redlineText).toBe(mockClause.proposed_redline);
    expect(entry.reviewStatus).toBe('UNREVIEWED');
    expect(entry.timestamp).toBe(initialTime);
  });

  it('initializes clause session state correctly', () => {
    const store: Record<string, ClauseSessionState> = {};
    const state = getOrCreateClauseState(store, mockClause, initialTime);

    expect(state.clauseId).toBe('Section 11.2');
    expect(state.lastReviewedAt).toBeNull();
    expect(state.lastModifiedAt).toBeNull();
    expect(state.reviewStatus).toBe('UNREVIEWED');
    expect(state.currentRedline).toBe(mockClause.proposed_redline);
    expect(state.history.length).toBe(1);
    expect(state.history[0].actionType).toBe('INITIAL_AUDIT');
  });

  it('records an attorney review action with timestamps and reviewer notes', () => {
    const store: Record<string, ClauseSessionState> = {};
    const initialState = getOrCreateClauseState(store, mockClause, initialTime);

    const reviewTime = initialTime + 60000; // 1 minute later
    const updatedState = recordReviewAction(
      initialState, 
      'APPROVED', 
      'Approved after reviewing indemnification carveouts', 
      'Lead Counsel', 
      reviewTime
    );

    expect(updatedState.lastReviewedAt).toBe(reviewTime);
    expect(updatedState.reviewStatus).toBe('APPROVED');
    expect(updatedState.notes).toBe('Approved after reviewing indemnification carveouts');
    expect(updatedState.history.length).toBe(2);
    expect(updatedState.history[0].actionType).toBe('REVIEWED');
    expect(updatedState.history[0].actor).toBe('Lead Counsel');
    expect(updatedState.history[0].summary).toContain('Approved after reviewing indemnification carveouts');
  });

  it('records a proposed redline customization and tracks modification timestamp', () => {
    const store: Record<string, ClauseSessionState> = {};
    const initialState = getOrCreateClauseState(store, mockClause, initialTime);

    const modifyTime = initialTime + 120000;
    const customRedline = 'Mutual cap of 24 months fees with $1,000,000 super-cap for IP breaches.';
    const updatedState = recordModificationAction(
      initialState, 
      customRedline, 
      'Added 24-month duration and $1M super-cap', 
      'Lead Counsel', 
      modifyTime
    );

    expect(updatedState.lastModifiedAt).toBe(modifyTime);
    expect(updatedState.currentRedline).toBe(customRedline);
    expect(updatedState.history.length).toBe(2);
    expect(updatedState.history[0].actionType).toBe('MODIFIED_REDLINE');
    expect(updatedState.history[0].redlineText).toBe(customRedline);
  });

  it('records applying industry benchmark boilerplate as an approved modification', () => {
    const store: Record<string, ClauseSessionState> = {};
    const initialState = getOrCreateClauseState(store, mockClause, initialTime);

    const benchmarkTime = initialTime + 180000;
    const benchmarkBoilerplate = 'IN NO EVENT SHALL EITHER PARTY BE LIABLE FOR SPECIAL DAMAGES...';
    const updatedState = recordBenchmarkAppliedAction(
      initialState, 
      benchmarkBoilerplate, 
      'Balanced ABA Model', 
      'Lead Counsel', 
      benchmarkTime
    );

    expect(updatedState.lastModifiedAt).toBe(benchmarkTime);
    expect(updatedState.lastReviewedAt).toBe(benchmarkTime);
    expect(updatedState.reviewStatus).toBe('APPROVED');
    expect(updatedState.currentRedline).toBe(benchmarkBoilerplate);
    expect(updatedState.history[0].actionType).toBe('APPLIED_BENCHMARK');
    expect(updatedState.history[0].title).toContain('Balanced ABA Model');
  });

  it('reverts to a previous historical version and logs reversion in session history', () => {
    const store: Record<string, ClauseSessionState> = {};
    const initialState = getOrCreateClauseState(store, mockClause, initialTime);
    const initialEntryId = initialState.history[0].id;

    // Modify redline
    const stateV2 = recordModificationAction(
      initialState, 
      'Version 2 redline language', 
      'Changed wording', 
      'Lead Counsel', 
      initialTime + 60000
    );

    expect(stateV2.currentRedline).toBe('Version 2 redline language');
    expect(stateV2.history.length).toBe(2);

    // Revert to initial baseline
    const revertTime = initialTime + 120000;
    const revertedState = revertToVersionEntry(stateV2, initialEntryId, 'Lead Counsel', revertTime);

    expect(revertedState.currentRedline).toBe(mockClause.proposed_redline);
    expect(revertedState.history.length).toBe(3);
    expect(revertedState.history[0].actionType).toBe('STATUS_CHANGED');
    expect(revertedState.history[0].title).toContain('Reverted to Revision');
  });

  it('correctly calculates relative session times and activity badges', () => {
    const baseNow = 1700000500000;

    expect(formatRelativeSessionTime(baseNow - 5000, baseNow)).toBe('Just now');
    expect(formatRelativeSessionTime(baseNow - 35000, baseNow)).toBe('35s ago');
    expect(formatRelativeSessionTime(baseNow - 65000, baseNow)).toBe('1m ago');
    expect(formatRelativeSessionTime(baseNow - 600000, baseNow)).toBe('10m ago');
    expect(formatRelativeSessionTime(baseNow - 3600000, baseNow)).toBe('1h ago');
    expect(formatRelativeSessionTime(null, baseNow)).toBe('Never');

    // Test activity badge for initial unreviewed state
    const store: Record<string, ClauseSessionState> = {};
    const state = getOrCreateClauseState(store, mockClause, baseNow);
    const badgeInitial = getClauseSessionActivityBadge(state, baseNow);
    expect(badgeInitial.type).toBe('INITIAL');
    expect(badgeInitial.text).toContain('Initial Audit');

    // Test activity badge when reviewed
    const reviewedState = recordReviewAction(state, 'APPROVED', '', 'Counsel', baseNow + 10000);
    const badgeReviewed = getClauseSessionActivityBadge(reviewedState, baseNow + 70000);
    expect(badgeReviewed.type).toBe('REVIEWED');
    expect(badgeReviewed.text).toContain('Approved 1m ago');

    // Test activity badge when modified
    const modifiedState = recordModificationAction(reviewedState, 'New redline', '', 'Counsel', baseNow + 80000);
    const badgeModified = getClauseSessionActivityBadge(modifiedState, baseNow + 85000);
    expect(badgeModified.type).toBe('MODIFIED');
    expect(badgeModified.text).toContain('Modified Just now');
  });

  it('persists and retrieves session version stores from storage', () => {
    const store: Record<string, ClauseSessionState> = {};
    const state = getOrCreateClauseState(store, mockClause, initialTime);
    store['Section 11.2'] = recordReviewAction(state, 'APPROVED', 'Notes here', 'Counsel', initialTime + 5000);

    saveSessionVersionStore('test-contract-123', store);
    const loadedStore = loadSessionVersionStore('test-contract-123');

    expect(loadedStore['Section 11.2']).toBeDefined();
    expect(loadedStore['Section 11.2'].reviewStatus).toBe('APPROVED');
    expect(loadedStore['Section 11.2'].history.length).toBe(2);
  });
});
