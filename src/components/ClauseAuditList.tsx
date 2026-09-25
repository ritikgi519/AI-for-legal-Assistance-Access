/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CriticalClauseAudit, RiskLevel } from '../types';
import { verifyCitation } from '../utils/citationMatcher';
import { RedlineDiffViewer } from './RedlineDiffViewer';
import { ClauseExportModal } from './ClauseExportModal';
import { ClauseBenchmarkModal } from './ClauseBenchmarkModal';
import { ClauseVersionHistoryModal } from './ClauseVersionHistoryModal';
import { 
  loadSessionVersionStore, 
  saveSessionVersionStore, 
  getOrCreateClauseState, 
  recordReviewAction, 
  recordModificationAction, 
  recordBenchmarkAppliedAction, 
  revertToVersionEntry, 
  getClauseSessionActivityBadge,
  formatRelativeSessionTime,
  formatAbsoluteSessionTime,
  ClauseSessionState,
  ClauseReviewStatus
} from '../utils/clauseVersionTracker';
import { 
  ShieldAlert, 
  Quote, 
  Copy, 
  Check, 
  AlertTriangle, 
  Scale, 
  HelpCircle, 
  FileEdit, 
  Filter, 
  Search, 
  CheckCircle2, 
  Crosshair, 
  ShieldCheck, 
  Sparkles, 
  FileDown, 
  Layers,
  History,
  Clock,
  RotateCcw,
  CheckCircle,
  GitCompare,
  Pin,
  Flame,
  Shield
} from 'lucide-react';
import { PinnedDossierItem } from '../utils/pinnedDossierTracker';
import { getClauseRiskIndicator } from '../utils/clauseExport';
import { getClauseToneSentiment } from '../utils/clauseToneAnalyzer';

interface ClauseAuditListProps {
  clauses: CriticalClauseAudit[];
  documentText?: string;
  documentTitle?: string;
  focusedClauseId?: string | null;
  onLocateInSource?: (clauseId: string) => void;
  pinnedItems?: Record<string, PinnedDossierItem>;
  onTogglePin?: (clause: CriticalClauseAudit) => void;
  onOpenCuratedSidebar?: () => void;
}

export const ClauseAuditList: React.FC<ClauseAuditListProps> = ({ 
  clauses, 
  documentText = '',
  documentTitle = '',
  focusedClauseId,
  onLocateInSource,
  pinnedItems = {},
  onTogglePin,
  onOpenCuratedSidebar
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedTone, setSelectedTone] = useState<string>('ALL');
  const [selectedSessionStatus, setSelectedSessionStatus] = useState<'ALL' | 'REVIEWED' | 'UNREVIEWED' | 'MODIFIED'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClauseId, setSelectedClauseId] = useState<string>(clauses[0]?.clause_id || '');
  const [exportModalClause, setExportModalClause] = useState<CriticalClauseAudit | null>(null);
  const [benchmarkModalClause, setBenchmarkModalClause] = useState<CriticalClauseAudit | null>(null);
  const [historyModalClause, setHistoryModalClause] = useState<CriticalClauseAudit | null>(null);

  // Session version tracker state
  const [sessionStartTime] = useState<number>(() => Date.now());
  const [sessionStore, setSessionStore] = useState<Record<string, ClauseSessionState>>(() => 
    loadSessionVersionStore(documentTitle)
  );

  // Diff comparison toggle state across cards
  const [allDiffsActive, setAllDiffsActive] = useState<boolean>(true);
  const [activeDiffClauseIds, setActiveDiffClauseIds] = useState<Record<string, boolean>>({});

  const toggleClauseDiff = (clauseId: string) => {
    setActiveDiffClauseIds(prev => {
      const currentVal = prev[clauseId] !== undefined ? prev[clauseId] : allDiffsActive;
      return {
        ...prev,
        [clauseId]: !currentVal
      };
    });
  };

  const handleToggleAllDiffs = () => {
    const nextVal = !allDiffsActive;
    setAllDiffsActive(nextVal);
    const updated: Record<string, boolean> = {};
    clauses.forEach(c => {
      updated[c.clause_id] = nextVal;
    });
    setActiveDiffClauseIds(updated);
  };

  // Refresh relative timestamps every 30 seconds
  const [, setClockTicker] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => setClockTicker(c => c + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Ensure every clause has an initialized session state entry
  useEffect(() => {
    let hasNewEntries = false;
    const updatedStore = { ...sessionStore };

    for (const clause of clauses) {
      if (!updatedStore[clause.clause_id]) {
        getOrCreateClauseState(updatedStore, clause, sessionStartTime);
        hasNewEntries = true;
      }
    }

    if (hasNewEntries) {
      setSessionStore(updatedStore);
      saveSessionVersionStore(documentTitle, updatedStore);
    }
  }, [clauses, documentTitle, sessionStartTime]);

  // Jump to focused clause when user selects a search result
  useEffect(() => {
    if (focusedClauseId) {
      setSelectedClauseId(focusedClauseId);
      setSelectedCategory('ALL');
      setSelectedRisk('ALL');
      setSelectedSessionStatus('ALL');
      setSearchQuery('');

      const timer = setTimeout(() => {
        const targetIdx = clauses.findIndex(
          c => c.clause_id.toLowerCase() === focusedClauseId.toLowerCase()
        );
        if (targetIdx !== -1) {
          const cardElem = document.getElementById(`clause-card-${targetIdx}`);
          if (cardElem) {
            cardElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cardElem.classList.add('ring-2', 'ring-amber-400', 'bg-amber-500/10');
            setTimeout(() => {
              cardElem.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-500/10');
            }, 2500);
          }
        }
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [focusedClauseId, clauses]);

  // Handler: Review action
  const handleUpdateReviewStatus = (clauseId: string, status: ClauseReviewStatus, notes?: string) => {
    const currentState = sessionStore[clauseId] || getOrCreateClauseState(sessionStore, clauses.find(c => c.clause_id === clauseId)!);
    const updated = recordReviewAction(currentState, status, notes);
    const newStore = { ...sessionStore, [clauseId]: updated };
    setSessionStore(newStore);
    saveSessionVersionStore(documentTitle, newStore);
  };

  // Handler: Modify redline counter-proposal
  const handleSaveNewRedline = (clauseId: string, newRedline: string, notes?: string) => {
    const currentState = sessionStore[clauseId] || getOrCreateClauseState(sessionStore, clauses.find(c => c.clause_id === clauseId)!);
    const updated = recordModificationAction(currentState, newRedline, notes);
    const newStore = { ...sessionStore, [clauseId]: updated };
    setSessionStore(newStore);
    saveSessionVersionStore(documentTitle, newStore);
  };

  // Handler: Adopt industry benchmark boilerplate
  const handleAdoptBenchmark = (clauseId: string, benchmarkText: string, stanceLabel: string) => {
    const currentState = sessionStore[clauseId] || getOrCreateClauseState(sessionStore, clauses.find(c => c.clause_id === clauseId)!);
    const updated = recordBenchmarkAppliedAction(currentState, benchmarkText, stanceLabel);
    const newStore = { ...sessionStore, [clauseId]: updated };
    setSessionStore(newStore);
    saveSessionVersionStore(documentTitle, newStore);
  };

  // Handler: Revert to previous session version
  const handleRevertVersion = (clauseId: string, versionId: string) => {
    const currentState = sessionStore[clauseId] || getOrCreateClauseState(sessionStore, clauses.find(c => c.clause_id === clauseId)!);
    const updated = revertToVersionEntry(currentState, versionId);
    const newStore = { ...sessionStore, [clauseId]: updated };
    setSessionStore(newStore);
    saveSessionVersionStore(documentTitle, newStore);
  };

  // Handler: Quick 1-click review toggle
  const handleQuickToggleReview = (clauseId: string) => {
    const state = sessionStore[clauseId] || getOrCreateClauseState(sessionStore, clauses.find(c => c.clause_id === clauseId)!);
    if (state.reviewStatus === 'APPROVED') {
      handleUpdateReviewStatus(clauseId, 'NEEDS_REVISION', 'Flagged as needing revision during quick audit');
    } else {
      handleUpdateReviewStatus(clauseId, 'APPROVED', 'Quick approved in session review');
    }
  };

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(clauses.map(c => c.clause_category)))];

  // Filtering
  const filteredClauses = clauses.filter(clause => {
    const matchesCategory = selectedCategory === 'ALL' || clause.clause_category.toLowerCase() === selectedCategory.toLowerCase();
    const riskIndicator = getClauseRiskIndicator(clause);
    const matchesRisk = selectedRisk === 'ALL' || 
      clause.risk_level === selectedRisk || 
      riskIndicator.tier.toUpperCase() === selectedRisk;
    
    const toneConfig = getClauseToneSentiment(clause);
    const matchesTone = selectedTone === 'ALL' || toneConfig.sentiment.toUpperCase() === selectedTone.toUpperCase();

    // Session status filter
    const state = sessionStore[clause.clause_id];
    let matchesSessionStatus = true;
    if (selectedSessionStatus === 'REVIEWED') {
      matchesSessionStatus = !!state?.lastReviewedAt;
    } else if (selectedSessionStatus === 'UNREVIEWED') {
      matchesSessionStatus = !state?.lastReviewedAt;
    } else if (selectedSessionStatus === 'MODIFIED') {
      matchesSessionStatus = !!state?.lastModifiedAt;
    }

    const matchesSearch = 
      clause.clause_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.clause_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.plain_english_meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.verbatim_quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toneConfig.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toneConfig.partyIntentSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (state?.currentRedline || clause.proposed_redline).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesRisk && matchesTone && matchesSessionStatus && matchesSearch;
  });

  const getRiskBadge = (level: RiskLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          badge: 'bg-red-500/15 border-red-500/40 text-red-400',
          dot: 'bg-red-400',
          label: 'CRITICAL RISK'
        };
      case 'HIGH':
        return {
          badge: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          dot: 'bg-amber-400',
          label: 'HIGH RISK'
        };
      case 'MEDIUM':
        return {
          badge: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
          dot: 'bg-yellow-400',
          label: 'MEDIUM RISK'
        };
      default:
        return {
          badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400',
          label: 'LOW RISK'
        };
    }
  };

  const currentSelectedClause = clauses.find(c => c.clause_id === selectedClauseId) || clauses[0] || null;

  // Compute session review metrics
  const totalReviewedCount = Object.values(sessionStore).filter(s => !!s.lastReviewedAt).length;
  const totalModifiedCount = Object.values(sessionStore).filter(s => !!s.lastModifiedAt).length;

  return (
    <div className="space-y-6">
      {/* Session Progress Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Session Audit Tracker
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">
            Reviewed: <strong className="text-emerald-400 font-mono">{totalReviewedCount}</strong>/{clauses.length}
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">
            Modified Redlines: <strong className="text-indigo-400 font-mono">{totalModifiedCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Session Started: <strong className="text-slate-300">{formatAbsoluteSessionTime(sessionStartTime)}</strong></span>
        </div>
      </div>

      {/* Controls Bar: Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="clause-search-input"
            type="text"
            placeholder="Search clauses, citations, redlines, keywords..."
            aria-label="Search clauses, citations, redlines, keywords"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <select
              id="clause-category-select"
              aria-label="Filter by clause category"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/60 cursor-pointer"
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <select
            id="clause-risk-select"
            aria-label="Filter by risk tier"
            value={selectedRisk}
            onChange={e => setSelectedRisk(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/60 cursor-pointer"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">Critical Risk Only</option>
            <option value="HIGH">High Risk Only</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          {/* Legalese Tone Sentiment Filter */}
          <select
            id="clause-tone-select"
            aria-label="Filter by legalese tone sentiment"
            value={selectedTone}
            onChange={e => setSelectedTone(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/60 cursor-pointer"
          >
            <option value="ALL">All Tones</option>
            <option value="ASSERTIVE">Assertive Tone</option>
            <option value="PROTECTIVE">Protective Tone</option>
            <option value="NEUTRAL">Neutral Tone</option>
          </select>

          {/* Session Status Filter */}
          <select
            id="clause-session-status-select"
            aria-label="Filter by session review status"
            value={selectedSessionStatus}
            onChange={e => setSelectedSessionStatus(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/60 cursor-pointer"
          >
            <option value="ALL">All Session Activity</option>
            <option value="REVIEWED">Reviewed Only ({totalReviewedCount})</option>
            <option value="MODIFIED">Modified in Session ({totalModifiedCount})</option>
            <option value="UNREVIEWED">Unreviewed Only ({clauses.length - totalReviewedCount})</option>
          </select>

          {/* Compare & Export Selected Clause CTAs */}
          {currentSelectedClause && (
            <div className="flex items-center gap-2">
              <button
                id="btn-benchmark-selected-clause"
                type="button"
                onClick={() => setBenchmarkModalClause(currentSelectedClause)}
                aria-label={`Compare selected clause ${currentSelectedClause.clause_id} against industry standard benchmark`}
                className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
              >
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>Compare against Benchmark</span>
              </button>

              <button
                id="btn-export-selected-clause"
                type="button"
                onClick={() => setExportModalClause(currentSelectedClause)}
                aria-label={`Export selected clause ${currentSelectedClause.clause_id} as formatted markdown`}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-sm"
              >
                <FileDown className="w-3.5 h-3.5 text-slate-400" />
                <span>Export (MD)</span>
                <span className="font-mono text-[10px] text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                  {currentSelectedClause.clause_id}
                </span>
              </button>
            </div>
          )}

          {/* Global Diff Comparison Toggle */}
          <button
            id="btn-toggle-all-diffs"
            type="button"
            onClick={handleToggleAllDiffs}
            aria-label="Toggle Diff comparisons for all clause audit cards"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
              allDiffsActive
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
            }`}
            title="Toggle comparative Diff view on all clauses"
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
            <span>{allDiffsActive ? 'All Diffs Active' : 'Show All Diffs'}</span>
          </button>

          {/* Curated Dossier Tray Button */}
          {onOpenCuratedSidebar && (
            <button
              id="btn-open-curated-tray"
              type="button"
              onClick={onOpenCuratedSidebar}
              aria-label={`Open curated consultation dossier tray (${Object.keys(pinnedItems).length} pinned)`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
                Object.keys(pinnedItems).length > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
              title="View your curated consultation clauses"
            >
              <Pin className="w-3.5 h-3.5 text-amber-400" />
              <span>Curated Dossier ({Object.keys(pinnedItems).length})</span>
            </button>
          )}

          <span className="text-xs text-slate-400 pl-2">
            Showing <strong className="text-slate-200">{filteredClauses.length}</strong> of {clauses.length} clauses
          </span>
        </div>
      </div>

      {/* Clause Cards */}
      <div className="space-y-5">
        {filteredClauses.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm">No clauses found matching your filter criteria.</p>
          </div>
        ) : (
          filteredClauses.map((clause, idx) => {
            const riskConfig = getRiskBadge(clause.risk_level);
            const riskIndicator = getClauseRiskIndicator(clause);
            const toneConfig = getClauseToneSentiment(clause);
            const isOmission = clause.verbatim_quote.includes('OMISSION DETECTED') || clause.plain_english_meaning.includes('OMISSION DETECTED');
            const matchInfo = documentText ? verifyCitation(documentText, clause.verbatim_quote) : null;
            const isSelected = selectedClauseId === clause.clause_id;
            
            // Session Version Tracker data for this card
            const clauseState = sessionStore[clause.clause_id] || getOrCreateClauseState(sessionStore, clause, sessionStartTime);
            const activityBadge = getClauseSessionActivityBadge(clauseState);
            const isCustomizedRedline = clauseState.currentRedline !== clause.proposed_redline;
            const isDiffActive = activeDiffClauseIds[clause.clause_id] !== undefined 
              ? activeDiffClauseIds[clause.clause_id] 
              : allDiffsActive;
            const isPinned = !!pinnedItems[clause.clause_id];

            return (
              <div
                key={idx}
                id={`clause-card-${idx}`}
                onClick={() => setSelectedClauseId(clause.clause_id)}
                className={`bg-slate-900 border rounded-xl overflow-hidden transition shadow-sm cursor-pointer ${
                  isSelected 
                    ? 'border-amber-500/60 ring-1 ring-amber-500/40 bg-slate-900/95' 
                    : 'border-slate-800 hover:border-slate-700/80'
                }`}
              >
                {/* Header Strip */}
                <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      {clause.clause_id}
                    </span>
                    <span className="text-xs font-medium text-slate-300 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
                      {clause.clause_category}
                    </span>

                    {/* Small Color-Coded Risk Indicator Tag (Low, Medium, High) based on internal risk assessment score */}
                    <span
                      id={`clause-risk-tag-${idx}`}
                      data-testid="clause-risk-tag"
                      data-risk-tier={riskIndicator.tier}
                      data-risk-score={riskIndicator.score}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs ${riskIndicator.badge}`}
                      title={riskIndicator.tooltip}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${riskIndicator.dot}`} />
                      <span data-testid="clause-risk-tier-label">{riskIndicator.tier}</span>
                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-300 font-medium">
                        {riskIndicator.score}/100
                      </span>
                    </span>

                    {/* Legalese Tone Sentiment Badge (Assertive, Neutral, Protective) to gauge party intent */}
                    <span
                      id={`clause-sentiment-badge-${idx}`}
                      data-testid="clause-sentiment-badge"
                      data-sentiment={toneConfig.sentiment}
                      data-sentiment-score={toneConfig.score}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs transition cursor-help ${toneConfig.badge}`}
                      title={toneConfig.tooltip}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${toneConfig.dot}`} />
                      {toneConfig.sentiment === 'Assertive' && <Flame className="w-3 h-3 text-purple-400 shrink-0" aria-hidden="true" />}
                      {toneConfig.sentiment === 'Protective' && <Shield className="w-3 h-3 text-sky-400 shrink-0" aria-hidden="true" />}
                      {toneConfig.sentiment === 'Neutral' && <Scale className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />}
                      <span data-testid="clause-sentiment-label">{toneConfig.label}</span>
                    </span>

                    {/* Version History Pill: shows when last modified or reviewed */}
                    <button
                      type="button"
                      id={`btn-version-pill-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClauseId(clause.clause_id);
                        setHistoryModalClause(clause);
                      }}
                      aria-label={`View session version history for ${clause.clause_id}: ${activityBadge.text}`}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border flex items-center gap-1.5 transition cursor-pointer hover:brightness-110 shadow-2xs ${activityBadge.statusColor}`}
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{activityBadge.text}</span>
                      <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-200">
                        v{clauseState.history.length}
                      </span>
                    </button>

                    {isOmission ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-800/60 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        OMISSION DETECTED
                      </span>
                    ) : matchInfo?.isVerified ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        Line {matchInfo.lineNumber} Ground Truth
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                      <Scale className="w-3 h-3 text-slate-500" />
                      Favors: <strong className="text-slate-200">{clause.party_favored}</strong>
                    </span>

                    {/* Pin to Dossier Button */}
                    <button
                      type="button"
                      id={`btn-pin-dossier-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClauseId(clause.clause_id);
                        if (onTogglePin) {
                          onTogglePin(clause);
                        }
                      }}
                      aria-label={`${isPinned ? 'Unpin' : 'Pin'} clause ${clause.clause_id} to consultation dossier`}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                        isPinned
                          ? 'bg-amber-500/25 text-amber-200 border-amber-500/60 ring-1 ring-amber-500/40 hover:bg-amber-500/35'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700'
                      }`}
                      title={isPinned ? 'Clause is pinned to your consultation dossier (click to unpin)' : 'Pin clause to your curated consultation dossier'}
                    >
                      <Pin className={`w-3.5 h-3.5 ${isPinned ? 'text-amber-400 fill-amber-400/40' : 'text-slate-400'}`} />
                      <span>{isPinned ? 'Pinned to Dossier' : 'Pin to Dossier'}</span>
                      {isPinned && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      )}
                    </button>

                    {/* Quick Review Action Button */}
                    <button
                      type="button"
                      id={`btn-quick-review-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClauseId(clause.clause_id);
                        handleQuickToggleReview(clause.clause_id);
                      }}
                      aria-label={`Toggle review status for ${clause.clause_id}`}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 transition cursor-pointer ${
                        clauseState.reviewStatus === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                          : clauseState.reviewStatus === 'NEEDS_REVISION'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{clauseState.reviewStatus === 'APPROVED' ? 'Approved' : clauseState.reviewStatus === 'NEEDS_REVISION' ? 'Needs Revision' : 'Mark Reviewed'}</span>
                    </button>

                    {/* Diff Toggle Button on Card Header */}
                    <button
                      type="button"
                      id={`btn-diff-toggle-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClauseId(clause.clause_id);
                        toggleClauseDiff(clause.clause_id);
                      }}
                      aria-label={`Toggle Diff comparison view for clause ${clause.clause_id}`}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                        isDiffActive
                          ? 'bg-indigo-500/25 text-indigo-200 border-indigo-500/60 ring-1 ring-indigo-500/40 hover:bg-indigo-500/35'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border-slate-700'
                      }`}
                      title={isDiffActive ? 'Diff view active (comparing against legal model / previous versions)' : 'Click to enable Diff comparison'}
                    >
                      <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Diff {isDiffActive ? 'ON' : 'OFF'}</span>
                      {isDiffActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </button>

                    {/* Version History Modal Trigger Button */}
                    <button
                      type="button"
                      id={`btn-version-history-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClauseId(clause.clause_id);
                        setHistoryModalClause(clause);
                      }}
                      aria-label={`Open Version History Tracker for clause ${clause.clause_id}`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-[11px] font-medium border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <History className="w-3.5 h-3.5 text-amber-400" />
                      <span>History ({clauseState.history.length})</span>
                    </button>

                    {/* Compare against Benchmark Button */}
                    <button
                      type="button"
                      id={`btn-compare-benchmark-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClauseId(clause.clause_id);
                        setBenchmarkModalClause(clause);
                      }}
                      aria-label={`Compare clause ${clause.clause_id} against Benchmark`}
                      className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 rounded-lg text-[11px] font-semibold border border-amber-500/35 flex items-center gap-1.5 transition cursor-pointer shadow-xs hover:border-amber-500/60"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>Compare against Benchmark</span>
                    </button>

                    {/* Export Clause Button */}
                    <button
                      type="button"
                      id={`btn-export-clause-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClauseId(clause.clause_id);
                        setExportModalClause(clause);
                      }}
                      aria-label={`Export clause ${clause.clause_id} as markdown`}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-[11px] font-medium border border-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-sm hover:border-amber-500/40"
                    >
                      <FileDown className="w-3 h-3 text-amber-400" />
                      <span>Export (MD)</span>
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4">
                  {/* Dedicated Version History Tracker Bar on Card */}
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-slate-400">Last Modified:</span>
                        <strong className="text-slate-200 font-mono text-[11px]">
                          {clauseState.lastModifiedAt 
                            ? `${formatRelativeSessionTime(clauseState.lastModifiedAt)} (${formatAbsoluteSessionTime(clauseState.lastModifiedAt)})`
                            : 'Unmodified in this session'}
                        </strong>
                      </div>
                      
                      <span className="text-slate-700 hidden sm:inline">•</span>

                      <div className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-slate-400">Last Reviewed:</span>
                        <strong className="text-slate-200 font-mono text-[11px]">
                          {clauseState.lastReviewedAt 
                            ? `${formatRelativeSessionTime(clauseState.lastReviewedAt)} (${formatAbsoluteSessionTime(clauseState.lastReviewedAt)})`
                            : 'Pending session review'}
                        </strong>
                      </div>

                      {clauseState.notes && (
                        <>
                          <span className="text-slate-700 hidden sm:inline">•</span>
                          <span className="text-slate-400 italic text-[11px] truncate max-w-xs">
                            "{clauseState.notes}"
                          </span>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClauseId(clause.clause_id);
                        setHistoryModalClause(clause);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px] transition cursor-pointer hover:underline"
                    >
                      <History className="w-3 h-3" />
                      <span>Session Log ({clauseState.history.length} {clauseState.history.length === 1 ? 'revision' : 'revisions'}) →</span>
                    </button>
                  </div>

                  {/* 1. Strict Citation Lock Verbatim Segment */}
                  <div className="rounded-lg bg-slate-950/90 border border-amber-500/20 p-4 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1.5">
                        <Quote className="w-3.5 h-3.5 text-amber-400" />
                        Strict Citation Lock (Verbatim Source Extract)
                      </span>
                      <div className="flex items-center gap-2">
                        {onLocateInSource && !isOmission && (
                          <button
                            type="button"
                            onClick={() => onLocateInSource(clause.clause_id)}
                            className="text-[10px] text-amber-300/80 hover:text-amber-200 flex items-center gap-1 underline transition cursor-pointer"
                          >
                            <Crosshair className="w-3 h-3" />
                            Locate in Source
                          </button>
                        )}
                        <span className="text-[10px] text-amber-400/80 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {isOmission ? 'OMISSION FLAGGED' : '100% VERBATIM LOCK'}
                        </span>
                      </div>
                    </div>

                    <blockquote className="text-xs sm:text-sm text-slate-300 font-serif italic border-l-2 border-amber-500/60 pl-3 py-1 leading-relaxed bg-amber-500/[0.02] whitespace-pre-wrap">
                      "{clause.verbatim_quote}"
                    </blockquote>
                  </div>

                  {/* 2. Plain-English Deconstruction (8th-Grade Reading Level) */}
                  <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800">
                    <div className="flex items-center gap-1.5 mb-2">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                        Plain-English Translation (Operational Impact)
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      {clause.plain_english_meaning}
                    </p>
                  </div>

                  {/* 3. Subtle Hazards & Hidden Pitfalls */}
                  {clause.hidden_pitfalls && clause.hidden_pitfalls.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Hidden Pitfalls & Latent Operational Hazards
                      </span>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {clause.hidden_pitfalls.map((pitfall, pIdx) => (
                          <li
                            key={pIdx}
                            className="text-xs text-slate-300 bg-slate-950/40 border border-slate-800/80 rounded-md p-2 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                            <span>{pitfall}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 4. Precision Redline & Diff Engine (Compares against Legal Standard / Previous Versions) */}
                  <div>
                    <RedlineDiffViewer
                      clauseId={clause.clause_id}
                      clauseCategory={clause.clause_category}
                      partyFavored={clause.party_favored}
                      originalQuote={clause.verbatim_quote}
                      proposedRedline={clause.proposed_redline}
                      currentWorkingRedline={clauseState.currentRedline}
                      versionHistory={clauseState.history}
                      isCustomized={isCustomizedRedline}
                      isDiffActive={isDiffActive}
                      onToggleDiff={(active) => {
                        setActiveDiffClauseIds(prev => ({ ...prev, [clause.clause_id]: active }));
                      }}
                      onAdoptRedline={(newText, reason) => {
                        handleAdoptBenchmark(clause.clause_id, newText, reason);
                      }}
                      onRevertToVersion={(versionId) => {
                        handleRevertVersion(clause.clause_id, versionId);
                      }}
                      onEditRedline={() => {
                        setSelectedClauseId(clause.clause_id);
                        setHistoryModalClause(clause);
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clause Export Modal */}
      {exportModalClause && (
        <ClauseExportModal
          isOpen={!!exportModalClause}
          onClose={() => setExportModalClause(null)}
          clause={exportModalClause}
          documentTitle={documentTitle}
          verifiedLine={
            documentText
              ? verifyCitation(documentText, exportModalClause.verbatim_quote)?.lineNumber
              : undefined
          }
        />
      )}

      {/* Clause Benchmark Comparison Modal */}
      {benchmarkModalClause && (
        <ClauseBenchmarkModal
          isOpen={!!benchmarkModalClause}
          onClose={() => setBenchmarkModalClause(null)}
          clause={benchmarkModalClause}
          documentTitle={documentTitle}
          onAdoptBenchmarkAsRedline={(benchmarkText, stanceLabel) => {
            handleAdoptBenchmark(benchmarkModalClause.clause_id, benchmarkText, stanceLabel);
          }}
        />
      )}

      {/* Clause Session Version History Modal */}
      {historyModalClause && (
        <ClauseVersionHistoryModal
          isOpen={!!historyModalClause}
          onClose={() => setHistoryModalClause(null)}
          clause={historyModalClause}
          sessionState={sessionStore[historyModalClause.clause_id] || getOrCreateClauseState(sessionStore, historyModalClause, sessionStartTime)}
          onUpdateReviewStatus={(status, notes) => handleUpdateReviewStatus(historyModalClause.clause_id, status, notes)}
          onSaveNewRedline={(newRedline, notes) => handleSaveNewRedline(historyModalClause.clause_id, newRedline, notes)}
          onRevertToVersion={(versionId) => handleRevertVersion(historyModalClause.clause_id, versionId)}
        />
      )}
    </div>
  );
};
