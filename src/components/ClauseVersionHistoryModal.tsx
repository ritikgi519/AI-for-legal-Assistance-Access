/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  Clock, 
  CheckCircle2, 
  FileEdit, 
  RotateCcw, 
  Scale, 
  AlertTriangle, 
  User, 
  ShieldCheck, 
  Copy, 
  Check, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { CriticalClauseAudit } from '../types';
import { 
  ClauseSessionState, 
  ClauseVersionHistoryEntry, 
  ClauseReviewStatus,
  formatRelativeSessionTime,
  formatAbsoluteSessionTime
} from '../utils/clauseVersionTracker';

interface ClauseVersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  clause: CriticalClauseAudit;
  sessionState: ClauseSessionState;
  onUpdateReviewStatus: (status: ClauseReviewStatus, notes?: string) => void;
  onSaveNewRedline: (newRedline: string, notes?: string) => void;
  onRevertToVersion: (versionId: string) => void;
}

export const ClauseVersionHistoryModal: React.FC<ClauseVersionHistoryModalProps> = ({
  isOpen,
  onClose,
  clause,
  sessionState,
  onUpdateReviewStatus,
  onSaveNewRedline,
  onRevertToVersion
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'edit'>('timeline');
  const [customRedline, setCustomRedline] = useState<string>(sessionState.currentRedline);
  const [editNotes, setEditNotes] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(sessionState.history[0]?.id || null);

  useEffect(() => {
    setCustomRedline(sessionState.currentRedline);
  }, [sessionState.currentRedline]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRedline.trim()) return;
    onSaveNewRedline(customRedline.trim(), editNotes.trim() || undefined);
    setEditNotes('');
    setActiveTab('timeline');
  };

  const handleApplyReview = (status: ClauseReviewStatus) => {
    onUpdateReviewStatus(status, reviewNotes.trim() || undefined);
    setReviewNotes('');
  };

  const getActionBadge = (actionType: ClauseVersionHistoryEntry['actionType']) => {
    switch (actionType) {
      case 'REVIEWED':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          label: 'Review Action'
        };
      case 'MODIFIED_REDLINE':
        return {
          icon: FileEdit,
          color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
          label: 'Redline Modified'
        };
      case 'APPLIED_BENCHMARK':
        return {
          icon: Scale,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          label: 'Benchmark Applied'
        };
      case 'STATUS_CHANGED':
        return {
          icon: RotateCcw,
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
          label: 'Version Reverted'
        };
      default:
        return {
          icon: History,
          color: 'text-slate-400 bg-slate-800 border-slate-700',
          label: 'Initial Audit'
        };
    }
  };

  const getReviewStatusBadge = (status: ClauseReviewStatus) => {
    switch (status) {
      case 'APPROVED':
        return {
          badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          label: 'Approved'
        };
      case 'NEEDS_REVISION':
        return {
          badge: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          label: 'Needs Revision'
        };
      case 'FLAGGED':
        return {
          badge: 'bg-red-500/15 border-red-500/40 text-red-300',
          dot: 'bg-red-400',
          label: 'Flagged / High Risk'
        };
      case 'WAIVED':
        return {
          badge: 'bg-purple-500/15 border-purple-500/40 text-purple-300',
          dot: 'bg-purple-400',
          label: 'Waived with Caveats'
        };
      default:
        return {
          badge: 'bg-slate-800 border-slate-700 text-slate-400',
          dot: 'bg-slate-500',
          label: 'Unreviewed'
        };
    }
  };

  const currentStatusBadge = getReviewStatusBadge(sessionState.reviewStatus);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-history-modal-title"
    >
      <div 
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="version-history-modal-title" className="text-base font-bold text-slate-100">
                  Clause Version History Tracker
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-semibold">
                  {clause.clause_id}
                </span>
                <span className="text-xs text-slate-400">
                  {clause.clause_category}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditing session activity, attorney reviews, and counter-proposal redline revisions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close version history tracker"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Session Summary Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Last Modified */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Last Modified
              </span>
              <span className="font-semibold text-slate-200">
                {sessionState.lastModifiedAt 
                  ? `${formatRelativeSessionTime(sessionState.lastModifiedAt)} (${formatAbsoluteSessionTime(sessionState.lastModifiedAt)})`
                  : 'Not modified yet'}
              </span>
            </div>
          </div>

          {/* Last Reviewed */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Last Reviewed
              </span>
              <span className="font-semibold text-slate-200">
                {sessionState.lastReviewedAt 
                  ? `${formatRelativeSessionTime(sessionState.lastReviewedAt)} (${formatAbsoluteSessionTime(sessionState.lastReviewedAt)})`
                  : 'Pending session review'}
              </span>
            </div>
          </div>

          {/* Review Status & Revision Count */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Current Status
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border mt-0.5 ${currentStatusBadge.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatusBadge.dot}`} />
                {currentStatusBadge.label}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Session Logs
              </span>
              <span className="font-mono font-bold text-amber-300">
                {sessionState.history.length} {sessionState.history.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'timeline'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Session Timeline ({sessionState.history.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'edit'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Modify Proposed Redline</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Active Redline Length: <strong className="text-slate-200">{sessionState.currentRedline.length}</strong> chars
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'timeline' ? (
            <div className="space-y-6">
              {/* Quick Action: Mark Review Status */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Record Attorney Review Status in Current Session
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Updates clause badge & timestamp immediately
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyReview('APPROVED')}
                    className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approve as Acceptable</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyReview('NEEDS_REVISION')}
                    className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Flag: Needs Renegotiation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyReview('FLAGGED')}
                    className="px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Critical Risk Flag</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyReview('WAIVED')}
                    className="px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Waive with Caveats</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyReview('UNREVIEWED')}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Optional reviewer note / rationale for this session action..."
                    aria-label="Optional reviewer note"
                    value={reviewNotes}
                    onChange={e => setReviewNotes(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>

              {/* Version History List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Recorded Session Activity ({sessionState.history.length})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Latest session events appear at the top
                  </span>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {sessionState.history.map((entry, idx) => {
                    const actionConfig = getActionBadge(entry.actionType);
                    const ActionIcon = actionConfig.icon;
                    const isExpanded = expandedEntryId === entry.id;
                    const isCurrentActive = idx === 0;

                    return (
                      <div 
                        key={entry.id}
                        className={`relative bg-slate-950/70 border rounded-xl p-4 transition ${
                          isCurrentActive 
                            ? 'border-amber-500/40 bg-slate-950/95 ring-1 ring-amber-500/20' 
                            : 'border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Timeline Node Icon */}
                        <div 
                          className={`absolute -left-[27px] top-4 w-5 h-5 rounded-full border flex items-center justify-center ${
                            isCurrentActive 
                              ? 'bg-amber-500 border-amber-300 text-slate-950 shadow-sm' 
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          <ActionIcon className="w-3 h-3" />
                        </div>

                        {/* Entry Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${actionConfig.color}`}>
                              {actionConfig.label}
                            </span>

                            {isCurrentActive && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                Current Active
                              </span>
                            )}

                            <span className="text-xs font-semibold text-slate-200">
                              {entry.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="font-mono text-[11px] text-slate-300">
                              {formatAbsoluteSessionTime(entry.timestamp)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({formatRelativeSessionTime(entry.timestamp)})
                            </span>
                          </div>
                        </div>

                        {/* Actor & Details */}
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3 h-3 text-slate-500" />
                            <span>Logged by: <strong className="text-slate-300">{entry.actor}</strong></span>
                          </div>
                          {entry.reviewStatus !== 'UNREVIEWED' && (
                            <span className="text-[11px] text-slate-400">
                              Status: <strong className="text-slate-200">{entry.reviewStatus}</strong>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                          {entry.summary}
                        </p>

                        {/* Collapsible Redline Preview */}
                        <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/60">
                          <button
                            type="button"
                            onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between bg-slate-900/90 transition cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <FileEdit className="w-3 h-3 text-amber-400" />
                              <span>Redline Text at this Version</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({entry.redlineText.length} chars)
                              </span>
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>

                          {isExpanded && (
                            <div className="p-3 border-t border-slate-800 space-y-2.5">
                              <div className="font-mono text-xs text-emerald-300/90 bg-slate-950 p-2.5 rounded border border-emerald-500/20 whitespace-pre-wrap leading-relaxed">
                                {entry.redlineText}
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(entry.redlineText, entry.id)}
                                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                                >
                                  {copiedId === entry.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-300">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-slate-400" />
                                      <span>Copy Redline</span>
                                    </>
                                  )}
                                </button>

                                {!isCurrentActive && (
                                  <button
                                    type="button"
                                    onClick={() => onRevertToVersion(entry.id)}
                                    className="px-2.5 py-1 text-xs rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1 transition cursor-pointer font-semibold"
                                  >
                                    <RotateCcw className="w-3 h-3 text-amber-400" />
                                    <span>Restore this Version</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Edit Redline Tab */
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                    Modify Clause Redline Counter-Proposal
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Saves a new timestamped version in the current session
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tailor the proposed contract redline for this clause. Submitting will record a new revision in the session tracker with exact clock time.
                </p>
              </div>

              <div>
                <label htmlFor="custom-redline-textarea" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Proposed Redline Language (Plain Text / Markdown):
                </label>
                <textarea
                  id="custom-redline-textarea"
                  rows={6}
                  value={customRedline}
                  onChange={e => setCustomRedline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm font-mono text-emerald-300 focus:outline-none focus:border-amber-500/60 leading-relaxed"
                  placeholder="Enter custom counter-proposal redline text..."
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-notes-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Revision Notes / Rationale (Optional):
                </label>
                <input
                  id="edit-notes-input"
                  type="text"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="E.g. Adjusted aggregate cap to 12 months fees paid; removed uncapped indemnity"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomRedline(sessionState.currentRedline);
                    setActiveTab('timeline');
                  }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!customRedline.trim() || customRedline.trim() === sessionState.currentRedline}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save as New Revision</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Session Tracking Active • In-Memory & Local Session Storage</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
