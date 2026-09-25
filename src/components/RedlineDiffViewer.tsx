/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  Split, 
  GitCommit, 
  Scale, 
  History, 
  Sparkles, 
  Check, 
  Copy, 
  RotateCcw, 
  FileEdit, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  BookOpen, 
  Info,
  Clock,
  Eye,
  EyeOff,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { getBenchmarkForCategory, BenchmarkStanceOption } from '../utils/benchmarkClauses';
import { analyzeClauseDiff, DetailedDiffToken, KeyLegalModification } from '../utils/clauseDiffEngine';
import { ClauseVersionHistoryEntry, formatRelativeSessionTime } from '../utils/clauseVersionTracker';

export type DiffTargetType = 'legal-standard' | 'previous-version' | 'proposed-redline';
export type DiffSourceType = 'verbatim' | 'working-redline';

export interface RedlineDiffViewerProps {
  originalQuote: string;
  proposedRedline: string;
  clauseId: string;
  clauseCategory?: string;
  partyFavored?: string;
  versionHistory?: ClauseVersionHistoryEntry[];
  currentWorkingRedline?: string;
  onEditRedline?: () => void;
  onAdoptRedline?: (newText: string, reason: string) => void;
  onRevertToVersion?: (versionId: string) => void;
  isCustomized?: boolean;
  isDiffActive?: boolean;
  onToggleDiff?: (active: boolean) => void;
  initialDiffTarget?: DiffTargetType;
}

export const RedlineDiffViewer: React.FC<RedlineDiffViewerProps> = ({
  originalQuote,
  proposedRedline,
  clauseId,
  clauseCategory = 'General',
  partyFavored = 'Neutral',
  versionHistory = [],
  currentWorkingRedline,
  onEditRedline,
  onAdoptRedline,
  onRevertToVersion,
  isCustomized = false,
  isDiffActive: controlledDiffActive,
  onToggleDiff,
  initialDiffTarget = 'legal-standard'
}) => {
  // Local or controlled Diff toggle state
  const [internalDiffActive, setInternalDiffActive] = useState<boolean>(true);
  const isDiffActive = controlledDiffActive !== undefined ? controlledDiffActive : internalDiffActive;

  const handleToggleDiff = () => {
    const nextState = !isDiffActive;
    if (onToggleDiff) {
      onToggleDiff(nextState);
    } else {
      setInternalDiffActive(nextState);
    }
  };

  // Comparison target selector
  const [diffTarget, setDiffTarget] = useState<DiffTargetType>(initialDiffTarget);

  // Source text toggle: compare from original verbatim contract quote or current active redline
  const [sourceType, setSourceType] = useState<DiffSourceType>('verbatim');

  // Benchmark stance selector when comparing against legal standard
  const [benchmarkStance, setBenchmarkStance] = useState<'BALANCED' | 'PRO_CUSTOMER' | 'PRO_VENDOR'>('BALANCED');

  // Selected previous version ID when comparing against previous revisions
  const previousVersions = useMemo(() => {
    return versionHistory.slice();
  }, [versionHistory]);

  const [selectedVersionId, setSelectedVersionId] = useState<string>(() => {
    if (previousVersions.length > 1) {
      // Pick the previous revision (entry at index 1 or last)
      return previousVersions[previousVersions.length - 2]?.id || previousVersions[0]?.id || '';
    }
    return previousVersions[0]?.id || '';
  });

  // Display mode: Side-by-Side vs Inline Word Diff
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side');

  // Highlight key legal terms toggle
  const [highlightLegalTerms, setHighlightLegalTerms] = useState<boolean>(true);

  // Copy states
  const [copiedTarget, setCopiedTarget] = useState<boolean>(false);
  const [copiedSource, setCopiedSource] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Adopted feedback state
  const [adoptedNotice, setAdoptedNotice] = useState<string | null>(null);

  // Active working redline fallback
  const activeRedline = currentWorkingRedline || proposedRedline;

  // Retrieve category benchmark
  const benchmark = useMemo(() => {
    return getBenchmarkForCategory(clauseCategory);
  }, [clauseCategory]);

  const activeStanceObj: BenchmarkStanceOption = useMemo(() => {
    return (
      benchmark.stances.find(s => s.stance === benchmarkStance) ||
      benchmark.stances[0] || {
        stance: 'BALANCED',
        label: 'Balanced Market Standard',
        badge: 'Balanced',
        boilerplateText: benchmark.defaultBoilerplate,
        summary: benchmark.attorneyRationale
      }
    );
  }, [benchmark, benchmarkStance]);

  // Determine target text and label based on selected target
  const { targetText, targetLabel, targetSublabel, targetBadge } = useMemo(() => {
    if (diffTarget === 'legal-standard') {
      return {
        targetText: activeStanceObj.boilerplateText,
        targetLabel: `Legal Standard: ${activeStanceObj.label}`,
        targetSublabel: benchmark.governingStandard,
        targetBadge: activeStanceObj.badge
      };
    }

    if (diffTarget === 'previous-version') {
      const foundEntry = previousVersions.find(v => v.id === selectedVersionId) || previousVersions[0];
      if (foundEntry) {
        return {
          targetText: foundEntry.redlineText,
          targetLabel: `Previous Version: ${foundEntry.title}`,
          targetSublabel: `${foundEntry.actor} • ${formatRelativeSessionTime(foundEntry.timestamp)}`,
          targetBadge: `v${previousVersions.indexOf(foundEntry) + 1}`
        };
      }
    }

    // Default: proposed redline
    return {
      targetText: proposedRedline,
      targetLabel: 'Proposed Reciprocal Redline',
      targetSublabel: 'Balanced Commercial Risk Allocation',
      targetBadge: 'AI Reciprocal Counter'
    };
  }, [diffTarget, activeStanceObj, benchmark, previousVersions, selectedVersionId, proposedRedline]);

  // Determine source text based on source type
  const { currentSourceText, currentSourceLabel } = useMemo(() => {
    if (sourceType === 'working-redline') {
      return {
        currentSourceText: activeRedline,
        currentSourceLabel: 'Active Working Redline'
      };
    }
    return {
      currentSourceText: originalQuote,
      currentSourceLabel: 'Verbatim Contract Text'
    };
  }, [sourceType, activeRedline, originalQuote]);

  // Run comprehensive diff analysis
  const diffAnalysis = useMemo(() => {
    return analyzeClauseDiff(
      currentSourceText,
      targetText,
      currentSourceLabel,
      targetLabel,
      clauseCategory
    );
  }, [currentSourceText, targetText, currentSourceLabel, targetLabel, clauseCategory]);

  const isOmission = originalQuote.includes('[OMISSION DETECTED]');

  // Copy helpers
  const handleCopyTarget = async () => {
    try {
      await navigator.clipboard.writeText(targetText);
      setCopiedTarget(true);
      setTimeout(() => setCopiedTarget(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopySource = async () => {
    try {
      await navigator.clipboard.writeText(currentSourceText);
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyDiffSummary = async () => {
    const summary = [
      `CLAUSE DIFF COMPARISON: ${clauseId} (${clauseCategory})`,
      `Source: ${currentSourceLabel}`,
      `Comparison: ${targetLabel} (${targetBadge})`,
      `Words: +${diffAnalysis.addedWordsCount} added, -${diffAnalysis.removedWordsCount} removed (${diffAnalysis.similarityPercentage}% match)`,
      '',
      'KEY MODIFICATIONS:',
      ...diffAnalysis.keyModifications.map(m => `- [${m.category}] ${m.label}: ${m.detail}`),
      '',
      '--- TARGET LANGUAGE ---',
      targetText
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Adopt standard or version
  const handleAdoptTarget = () => {
    if (onAdoptRedline) {
      const reason = diffTarget === 'legal-standard'
        ? `Adopted ${activeStanceObj.label} (${benchmark.governingStandard})`
        : diffTarget === 'previous-version'
        ? `Restored from previous version (${targetBadge})`
        : 'Adopted proposed reciprocal redline';
      
      onAdoptRedline(targetText, reason);
      setAdoptedNotice(`Applied ${targetBadge} as active redline!`);
      setTimeout(() => setAdoptedNotice(null), 3000);
    } else if (onRevertToVersion && diffTarget === 'previous-version' && selectedVersionId) {
      onRevertToVersion(selectedVersionId);
      setAdoptedNotice('Reverted to selected version!');
      setTimeout(() => setAdoptedNotice(null), 3000);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm transition">
      {/* Top Header Bar & Primary 'Diff' Toggle Strip */}
      <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold text-amber-400 font-mono px-2 py-0.5 rounded bg-slate-800/90 border border-slate-700">
            {clauseId}
          </span>

          <div className="flex items-center gap-1.5">
            <GitCompare className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-100">
              Clause Diff Engine
            </span>
          </div>

          {/* Primary Diff View Toggle Button */}
          <button
            type="button"
            onClick={handleToggleDiff}
            id={`btn-diff-mode-toggle-${clauseId}`}
            aria-label={`Toggle Diff view mode for ${clauseId}`}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isDiffActive
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border-slate-700'
            }`}
          >
            {isDiffActive ? (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Diff Active</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Diff Inactive (Show Redline Only)</span>
              </>
            )}
          </button>

          {isCustomized && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Customized in Session
            </span>
          )}
        </div>

        {/* Header Right Action Group */}
        <div className="flex flex-wrap items-center gap-2">
          {onEditRedline && (
            <button
              type="button"
              onClick={onEditRedline}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 text-xs font-medium border border-slate-700 hover:border-amber-500/40 transition cursor-pointer"
            >
              <FileEdit className="w-3 h-3 text-amber-400" />
              <span>Edit Redline</span>
            </button>
          )}

          {isDiffActive && (
            <>
              {/* Side-by-side vs Inline Diff View Mode */}
              <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('side-by-side')}
                  title="Side-by-Side Comparison"
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1 ${
                    viewMode === 'side-by-side'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Split className="w-3 h-3" />
                  <span className="hidden sm:inline">Side-by-Side</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('inline')}
                  title="Inline Word Diff"
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1 ${
                    viewMode === 'inline'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GitCommit className="w-3 h-3" />
                  <span className="hidden sm:inline">Word Diff</span>
                </button>
              </div>

              {/* Copy Diff Summary Button */}
              <button
                type="button"
                onClick={handleCopyDiffSummary}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer"
                title="Copy structured diff comparison summary to clipboard"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Summary Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span className="hidden md:inline">Copy Diff</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* When Diff is Active: Interactive Controls Bar */}
      {isDiffActive && (
        <div className="bg-slate-900/60 px-4 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Target Model / Version Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              Compare Against:
            </span>

            {/* Tab 1: Legal Standard Model */}
            <button
              type="button"
              id={`tab-diff-legal-standard-${clauseId}`}
              onClick={() => setDiffTarget('legal-standard')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                diffTarget === 'legal-standard'
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 shadow-xs'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Scale className="w-3 h-3 text-amber-400" />
              <span>Legal Standard Model</span>
            </button>

            {/* Tab 2: Previous Versions */}
            <button
              type="button"
              id={`tab-diff-previous-versions-${clauseId}`}
              onClick={() => setDiffTarget('previous-version')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                diffTarget === 'previous-version'
                  ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/50 shadow-xs'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
            >
              <History className="w-3 h-3 text-indigo-400" />
              <span>Previous Versions ({previousVersions.length})</span>
            </button>

            {/* Tab 3: Proposed Redline */}
            <button
              type="button"
              id={`tab-diff-proposed-redline-${clauseId}`}
              onClick={() => setDiffTarget('proposed-redline')}
              className={`px-2.5 py-1 rounded-md font-medium text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                diffTarget === 'proposed-redline'
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-xs'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Proposed Redline</span>
            </button>
          </div>

          {/* Sub-controls: Stance / Version dropdown & Source selector */}
          <div className="flex flex-wrap items-center gap-2">
            {/* If Legal Standard: Stance Sub-selector */}
            {diffTarget === 'legal-standard' && (
              <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setBenchmarkStance('BALANCED')}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    benchmarkStance === 'BALANCED'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                  title="Balanced Market Reciprocal Standard (ABA / NVCA)"
                >
                  Balanced
                </button>
                <button
                  type="button"
                  onClick={() => setBenchmarkStance('PRO_CUSTOMER')}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    benchmarkStance === 'PRO_CUSTOMER'
                      ? 'bg-indigo-500/20 text-indigo-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                  title="Pro-Customer Standard with Data Supercap"
                >
                  Pro-Customer
                </button>
                <button
                  type="button"
                  onClick={() => setBenchmarkStance('PRO_VENDOR')}
                  className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                    benchmarkStance === 'PRO_VENDOR'
                      ? 'bg-slate-800 text-slate-200 font-semibold'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                  title="Pro-Vendor Standard"
                >
                  Pro-Vendor
                </button>
              </div>
            )}

            {/* If Previous Version: Version selector dropdown */}
            {diffTarget === 'previous-version' && previousVersions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Select Version:</span>
                <select
                  aria-label="Select previous version to diff against"
                  value={selectedVersionId}
                  onChange={(e) => setSelectedVersionId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {previousVersions.map((entry, vIdx) => (
                    <option key={entry.id} value={entry.id}>
                      v{vIdx + 1}: {entry.title} ({formatRelativeSessionTime(entry.timestamp)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Source clause selector: Verbatim vs Active Redline */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
              <span className="px-1 text-[10px] text-slate-500 font-semibold uppercase">Diff From:</span>
              <button
                type="button"
                onClick={() => setSourceType('verbatim')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  sourceType === 'verbatim'
                    ? 'bg-slate-800 text-slate-200 font-semibold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Compare against the verbatim raw text extracted from the document"
              >
                Verbatim
              </button>
              <button
                type="button"
                onClick={() => setSourceType('working-redline')}
                className={`px-2 py-0.5 rounded font-medium transition cursor-pointer ${
                  sourceType === 'working-redline'
                    ? 'bg-slate-800 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Compare against the current active redline draft"
              >
                Working Redline
              </button>
            </div>

            {/* Legal Term Highlight Toggle */}
            <button
              type="button"
              onClick={() => setHighlightLegalTerms(!highlightLegalTerms)}
              className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1 transition cursor-pointer ${
                highlightLegalTerms
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
              title="Highlight critical commercial legal terms (caps, damages, indemnities)"
            >
              <span>Key Terms</span>
              <span className={`w-1.5 h-1.5 rounded-full ${highlightLegalTerms ? 'bg-amber-400' : 'bg-slate-600'}`} />
            </button>
          </div>
        </div>
      )}

      {/* Key Modifications Alert Banner & Quantitative Stats */}
      {isDiffActive && (
        <div className="p-3.5 bg-slate-950/90 border-b border-slate-800/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Key Legal Modifications Highlighted:
              </span>

              {/* Quant badges */}
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
                +{diffAnalysis.addedWordsCount} words added
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 font-semibold">
                -{diffAnalysis.removedWordsCount} words removed
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {diffAnalysis.similarityPercentage}% alignment
              </span>
            </div>

            {/* Adopt / Revert Action Button */}
            {(onAdoptRedline || onRevertToVersion) && (
              <div className="flex items-center gap-2">
                {adoptedNotice && (
                  <span className="text-xs font-semibold text-emerald-400 animate-pulse flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {adoptedNotice}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleAdoptTarget}
                  className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-semibold rounded-lg border border-emerald-500/40 hover:border-emerald-500/70 transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-400" />
                  <span>
                    {diffTarget === 'previous-version' 
                      ? `Revert to ${targetBadge}` 
                      : diffTarget === 'legal-standard'
                      ? `Adopt ${benchmarkStance === 'BALANCED' ? 'Market Standard' : benchmarkStance === 'PRO_CUSTOMER' ? 'Pro-Customer' : 'Pro-Vendor'}`
                      : 'Apply Proposed Redline'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Substantive modification tags list */}
          {diffAnalysis.keyModifications.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {diffAnalysis.keyModifications.map((mod) => (
                <div
                  key={mod.id}
                  className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${
                    mod.severity === 'critical'
                      ? 'bg-red-950/40 border-red-500/40 text-red-200'
                      : mod.severity === 'favorable'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                  title={mod.detail}
                >
                  <span className="font-semibold text-amber-300">[{mod.category}]</span>
                  <span>{mod.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal hidden lg:inline">
                    — {mod.detail}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Diff Content Container */}
      <div className="p-4">
        {!isDiffActive ? (
          /* When Diff is toggled off: Display classic simple redline preview */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">
                Active Session Redline Counter-Proposal:
              </span>
              <button
                type="button"
                onClick={handleCopyTarget}
                className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                {copiedTarget ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedTarget ? 'Copied' : 'Copy Redline'}</span>
              </button>
            </div>
            <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-200 leading-relaxed min-h-[90px] whitespace-pre-wrap">
              {activeRedline}
            </div>
          </div>
        ) : viewMode === 'side-by-side' || isOmission ? (
          /* Side-by-Side Diff View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column: Source (Verbatim or Working Redline) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span>{currentSourceLabel}</span>
                  {sourceType === 'verbatim' && (
                    <span className="text-[10px] text-slate-500 font-mono font-normal">
                      (Instrument Baseline)
                    </span>
                  )}
                </div>

                {!isOmission && (
                  <button
                    type="button"
                    onClick={handleCopySource}
                    className="text-[10px] text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1"
                  >
                    {copiedSource ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSource ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-red-950/20 border border-red-500/30 text-xs font-mono text-slate-300 leading-relaxed min-h-[140px] max-h-[350px] overflow-y-auto whitespace-pre-wrap">
                {isOmission ? (
                  <div className="space-y-2">
                    <span className="text-red-400 italic block font-bold">
                      {originalQuote}
                    </span>
                    <p className="text-xs text-slate-400">
                      This covenant is entirely absent from the baseline contract. Adopting the legal standard on the right will inject reciprocal protection.
                    </p>
                  </div>
                ) : (
                  diffAnalysis.sourceTokens.map((token, idx) => {
                    if (token.type === 'removed') {
                      return (
                        <span
                          key={idx}
                          className={`bg-red-950/90 text-red-200 line-through decoration-red-400 px-0.5 rounded font-semibold ${
                            highlightLegalTerms && token.isKeyLegalTerm ? 'ring-1 ring-red-400' : ''
                          }`}
                        >
                          {token.text}
                        </span>
                      );
                    }

                    if (highlightLegalTerms && token.isKeyLegalTerm) {
                      return (
                        <span key={idx} className="bg-amber-500/20 text-amber-200 px-0.5 rounded border-b border-amber-400/60 font-semibold">
                          {token.text}
                        </span>
                      );
                    }

                    return <span key={idx}>{token.text}</span>;
                  })
                )}
              </div>
            </div>

            {/* Right Column: Compared Target (Standard Model / Previous Version / Redline) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="truncate max-w-[200px] sm:max-w-xs">{targetLabel}</span>
                  <span className="text-[10px] text-emerald-400/80 font-mono font-normal">
                    [{targetBadge}]
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTarget}
                    className="text-[10px] text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1"
                  >
                    {copiedTarget ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTarget ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-200 leading-relaxed min-h-[140px] max-h-[350px] overflow-y-auto whitespace-pre-wrap">
                {diffAnalysis.targetTokens.map((token, idx) => {
                  if (token.type === 'added') {
                    return (
                      <span
                        key={idx}
                        className={`bg-emerald-900/60 text-emerald-100 font-semibold px-0.5 rounded ${
                          highlightLegalTerms && token.isKeyLegalTerm ? 'ring-1 ring-emerald-400/80 underline decoration-emerald-400' : ''
                        }`}
                      >
                        {token.text}
                      </span>
                    );
                  }

                  if (highlightLegalTerms && token.isKeyLegalTerm) {
                    return (
                      <span key={idx} className="bg-amber-500/20 text-amber-200 px-0.5 rounded border-b border-amber-400/60 font-semibold">
                        {token.text}
                      </span>
                    );
                  }

                  return <span key={idx}>{token.text}</span>;
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Inline Unified Word Diff View */
          <div className="space-y-3">
            <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Strikethrough / Red = Removed from {currentSourceLabel}
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Green Highlight = Added in {targetLabel}
                </span>
                {highlightLegalTerms && (
                  <span className="flex items-center gap-1 text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    Amber = Critical Commercial Legal Terms
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyTarget}
                className="text-[10px] text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1"
              >
                {copiedTarget ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Target Text</span>
              </button>
            </div>

            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono leading-relaxed space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
                  Unified Modification Stream ({currentSourceLabel} → {targetBadge}):
                </span>

                <p className="text-slate-300 whitespace-pre-wrap leading-loose">
                  {diffAnalysis.inlineTokens.map((token, idx) => {
                    if (token.type === 'removed') {
                      return (
                        <span
                          key={idx}
                          className="bg-red-950 text-red-300 line-through decoration-red-500 px-0.5 rounded font-semibold mx-0.5 inline-block"
                        >
                          {token.text}
                        </span>
                      );
                    }

                    if (token.type === 'added') {
                      return (
                        <span
                          key={idx}
                          className={`bg-emerald-950 text-emerald-300 font-semibold px-0.5 rounded mx-0.5 inline-block ${
                            highlightLegalTerms && token.isKeyLegalTerm ? 'ring-1 ring-emerald-400 underline decoration-emerald-400' : ''
                          }`}
                        >
                          {token.text}
                        </span>
                      );
                    }

                    if (highlightLegalTerms && token.isKeyLegalTerm) {
                      return (
                        <span key={idx} className="bg-amber-500/20 text-amber-200 px-0.5 rounded border-b border-amber-400/60 font-semibold">
                          {token.text}
                        </span>
                      );
                    }

                    return <span key={idx}>{token.text}</span>;
                  })}
                </p>
              </div>

              {/* Benchmark Reference Citation Footer */}
              <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Governing Standard: <strong className="text-slate-200">{targetSublabel}</strong></span>
                </div>
                <span className="font-mono text-emerald-400">{diffAnalysis.similarityPercentage}% Match Index</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
