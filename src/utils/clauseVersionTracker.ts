/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CriticalClauseAudit } from '../types';

export type ClauseReviewStatus = 
  | 'UNREVIEWED' 
  | 'APPROVED' 
  | 'NEEDS_REVISION' 
  | 'FLAGGED' 
  | 'WAIVED';

export type ClauseActionType = 
  | 'INITIAL_AUDIT' 
  | 'REVIEWED' 
  | 'MODIFIED_REDLINE' 
  | 'APPLIED_BENCHMARK' 
  | 'STATUS_CHANGED';

export interface ClauseVersionHistoryEntry {
  id: string;
  clauseId: string;
  timestamp: number; // Date.now()
  actionType: ClauseActionType;
  title: string;
  summary: string;
  actor: string;
  redlineText: string;
  reviewStatus: ClauseReviewStatus;
  notes?: string;
}

export interface ClauseSessionState {
  clauseId: string;
  lastReviewedAt: number | null;
  lastModifiedAt: number | null;
  reviewStatus: ClauseReviewStatus;
  currentRedline: string;
  notes?: string;
  history: ClauseVersionHistoryEntry[];
}

const STORAGE_PREFIX = 'lexisense_session_version_history_';
const inMemoryCache: Record<string, Record<string, ClauseSessionState>> = {};

/**
 * Format timestamp into human-readable relative session time
 */
export function formatRelativeSessionTime(timestamp: number | null, now: number = Date.now()): string {
  if (!timestamp) return 'Never';
  const diffMs = Math.max(0, now - timestamp);
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 10) return 'Just now';
  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins === 1) return '1m ago';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours === 1) return '1h ago';
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format timestamp into readable absolute session time
 */
export function formatAbsoluteSessionTime(timestamp: number | null): string {
  if (!timestamp) return 'Not recorded';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
}

/**
 * Create initial baseline version entry for a clause
 */
export function createInitialVersionEntry(clause: CriticalClauseAudit, timestamp: number = Date.now()): ClauseVersionHistoryEntry {
  return {
    id: `v-init-${clause.clause_id.replace(/[^a-zA-Z0-9_-]/g, '_')}-${timestamp}`,
    clauseId: clause.clause_id,
    timestamp,
    actionType: 'INITIAL_AUDIT',
    title: 'Initial AI Baseline Audit',
    summary: `Extracted verbatim from source with ${clause.risk_level} risk assessment favoring ${clause.party_favored}.`,
    actor: 'Audit Engine',
    redlineText: clause.proposed_redline,
    reviewStatus: 'UNREVIEWED'
  };
}

/**
 * Load or initialize session state for all clauses
 */
export function loadSessionVersionStore(docKey: string = 'default'): Record<string, ClauseSessionState> {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}${docKey}`);
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (err) {
    console.warn('Failed to read session version store:', err);
  }
  return inMemoryCache[docKey] ? { ...inMemoryCache[docKey] } : {};
}

/**
 * Save session state to sessionStorage
 */
export function saveSessionVersionStore(docKey: string = 'default', store: Record<string, ClauseSessionState>): void {
  inMemoryCache[docKey] = { ...store };
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(`${STORAGE_PREFIX}${docKey}`, JSON.stringify(store));
    }
  } catch (err) {
    console.warn('Failed to save session version store:', err);
  }
}

/**
 * Get or initialize state for a specific clause
 */
export function getOrCreateClauseState(
  store: Record<string, ClauseSessionState>,
  clause: CriticalClauseAudit,
  sessionStartTime: number = Date.now()
): ClauseSessionState {
  if (store[clause.clause_id]) {
    return store[clause.clause_id];
  }

  const initialEntry = createInitialVersionEntry(clause, sessionStartTime);
  const newState: ClauseSessionState = {
    clauseId: clause.clause_id,
    lastReviewedAt: null,
    lastModifiedAt: null,
    reviewStatus: 'UNREVIEWED',
    currentRedline: clause.proposed_redline,
    notes: '',
    history: [initialEntry]
  };

  store[clause.clause_id] = newState;
  return newState;
}

/**
 * Record a review action in the current session
 */
export function recordReviewAction(
  currentState: ClauseSessionState,
  status: ClauseReviewStatus,
  notes: string = '',
  actor: string = 'Legal Counsel (Session)',
  timestamp: number = Date.now()
): ClauseSessionState {
  const statusLabels: Record<ClauseReviewStatus, string> = {
    APPROVED: 'Approved as Acceptable',
    NEEDS_REVISION: 'Flagged: Needs Renegotiation',
    FLAGGED: 'Critical Risk Flagged',
    WAIVED: 'Risk Waived with Caveats',
    UNREVIEWED: 'Reset to Unreviewed'
  };

  const newEntry: ClauseVersionHistoryEntry = {
    id: `v-rev-${currentState.clauseId.replace(/[^a-zA-Z0-9_-]/g, '_')}-${timestamp}`,
    clauseId: currentState.clauseId,
    timestamp,
    actionType: 'REVIEWED',
    title: `Clause Reviewed: ${statusLabels[status]}`,
    summary: notes ? `Marked as ${statusLabels[status]} — Note: "${notes}"` : `Marked as ${statusLabels[status]} during contract audit review.`,
    actor,
    redlineText: currentState.currentRedline,
    reviewStatus: status,
    notes
  };

  return {
    ...currentState,
    lastReviewedAt: timestamp,
    reviewStatus: status,
    notes: notes || currentState.notes,
    history: [newEntry, ...currentState.history]
  };
}

/**
 * Record a redline modification in the current session
 */
export function recordModificationAction(
  currentState: ClauseSessionState,
  newRedline: string,
  summaryNotes: string = '',
  actor: string = 'Legal Counsel (Session)',
  timestamp: number = Date.now()
): ClauseSessionState {
  const newEntry: ClauseVersionHistoryEntry = {
    id: `v-mod-${currentState.clauseId.replace(/[^a-zA-Z0-9_-]/g, '_')}-${timestamp}`,
    clauseId: currentState.clauseId,
    timestamp,
    actionType: 'MODIFIED_REDLINE',
    title: 'Proposed Redline Modified',
    summary: summaryNotes || 'Customized counter-proposal language in current session.',
    actor,
    redlineText: newRedline,
    reviewStatus: currentState.reviewStatus === 'UNREVIEWED' ? 'NEEDS_REVISION' : currentState.reviewStatus,
    notes: summaryNotes
  };

  return {
    ...currentState,
    lastModifiedAt: timestamp,
    currentRedline: newRedline,
    history: [newEntry, ...currentState.history]
  };
}

/**
 * Record applying an industry benchmark boilerplate in the current session
 */
export function recordBenchmarkAppliedAction(
  currentState: ClauseSessionState,
  benchmarkText: string,
  stanceLabel: string = 'Industry Standard',
  actor: string = 'Legal Counsel (Session)',
  timestamp: number = Date.now()
): ClauseSessionState {
  const newEntry: ClauseVersionHistoryEntry = {
    id: `v-bench-${currentState.clauseId.replace(/[^a-zA-Z0-9_-]/g, '_')}-${timestamp}`,
    clauseId: currentState.clauseId,
    timestamp,
    actionType: 'APPLIED_BENCHMARK',
    title: `Benchmark Boilerplate Applied (${stanceLabel})`,
    summary: `Replaced proposed redline with ${stanceLabel} market boilerplate.`,
    actor,
    redlineText: benchmarkText,
    reviewStatus: 'APPROVED',
    notes: `Adopted ${stanceLabel} market boilerplate.`
  };

  return {
    ...currentState,
    lastModifiedAt: timestamp,
    lastReviewedAt: timestamp,
    reviewStatus: 'APPROVED',
    currentRedline: benchmarkText,
    history: [newEntry, ...currentState.history]
  };
}

/**
 * Revert to a specific historical version in the session
 */
export function revertToVersionEntry(
  currentState: ClauseSessionState,
  targetVersionId: string,
  actor: string = 'Legal Counsel (Session)',
  timestamp: number = Date.now()
): ClauseSessionState {
  const targetEntry = currentState.history.find(h => h.id === targetVersionId);
  if (!targetEntry) return currentState;

  const revertEntry: ClauseVersionHistoryEntry = {
    id: `v-revt-${currentState.clauseId.replace(/[^a-zA-Z0-9_-]/g, '_')}-${timestamp}`,
    clauseId: currentState.clauseId,
    timestamp,
    actionType: 'STATUS_CHANGED',
    title: `Reverted to Revision (${formatAbsoluteSessionTime(targetEntry.timestamp)})`,
    summary: `Restored redline text from previous session entry: "${targetEntry.title}".`,
    actor,
    redlineText: targetEntry.redlineText,
    reviewStatus: targetEntry.reviewStatus,
    notes: `Reverted to ${targetVersionId}`
  };

  return {
    ...currentState,
    lastModifiedAt: timestamp,
    currentRedline: targetEntry.redlineText,
    reviewStatus: targetEntry.reviewStatus,
    history: [revertEntry, ...currentState.history]
  };
}

/**
 * Formats a concise summary string for the card header badge
 */
export function getClauseSessionActivityBadge(state: ClauseSessionState, now: number = Date.now()): {
  text: string;
  relative: string;
  type: 'MODIFIED' | 'REVIEWED' | 'INITIAL';
  statusColor: string;
  reviewStatus: ClauseReviewStatus;
} {
  // If modified in session
  if (state.lastModifiedAt && (!state.lastReviewedAt || state.lastModifiedAt >= state.lastReviewedAt)) {
    return {
      text: `Modified ${formatRelativeSessionTime(state.lastModifiedAt, now)}`,
      relative: formatRelativeSessionTime(state.lastModifiedAt, now),
      type: 'MODIFIED',
      statusColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40',
      reviewStatus: state.reviewStatus
    };
  }

  // If reviewed in session
  if (state.lastReviewedAt) {
    const statusMap: Record<ClauseReviewStatus, string> = {
      APPROVED: 'Approved',
      NEEDS_REVISION: 'Needs Revision',
      FLAGGED: 'Flagged',
      WAIVED: 'Waived',
      UNREVIEWED: 'Reviewed'
    };

    const colorMap: Record<ClauseReviewStatus, string> = {
      APPROVED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      NEEDS_REVISION: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      FLAGGED: 'bg-red-500/15 text-red-300 border-red-500/40',
      WAIVED: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
      UNREVIEWED: 'bg-slate-800 text-slate-300 border-slate-700'
    };

    return {
      text: `${statusMap[state.reviewStatus]} ${formatRelativeSessionTime(state.lastReviewedAt, now)}`,
      relative: formatRelativeSessionTime(state.lastReviewedAt, now),
      type: 'REVIEWED',
      statusColor: colorMap[state.reviewStatus],
      reviewStatus: state.reviewStatus
    };
  }

  // Baseline initial state
  const initialTime = state.history[state.history.length - 1]?.timestamp || now;
  return {
    text: `Initial Audit (${formatAbsoluteSessionTime(initialTime)})`,
    relative: formatRelativeSessionTime(initialTime, now),
    type: 'INITIAL',
    statusColor: 'bg-slate-800/80 text-slate-400 border-slate-700/60',
    reviewStatus: 'UNREVIEWED'
  };
}
