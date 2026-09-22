import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CriticalClauseAudit, GlossaryTerm } from '../types';
import { verifyCitation } from '../utils/citationMatcher';
import { parseDocumentGlossary } from '../utils/legalGlossaryParser';
import { RedlineDiffViewer } from './RedlineDiffViewer';
import { DocumentComparisonView } from './DocumentComparisonView';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Crosshair, 
  Scale, 
  HelpCircle, 
  ChevronRight, 
  ArrowUpRight,
  Sparkles,
  FileSearch,
  CheckCircle2,
  AlertCircle,
  GitCompare,
  BookOpen,
  X,
  Info
} from 'lucide-react';

interface SplitViewAuditorProps {
  documentText: string;
  clauses: CriticalClauseAudit[];
  onSelectClause?: (clauseId: string) => void;
  documentTitle?: string;
}

export const SplitViewAuditor: React.FC<SplitViewAuditorProps> = ({
  documentText,
  clauses,
  documentTitle = 'Current Loaded Instrument'
}) => {
  const [inspectorMode, setInspectorMode] = useState<'citation' | 'compare'>('citation');
  const [diffMode, setDiffMode] = useState<boolean>(true);
  const [selectedClauseId, setSelectedClauseId] = useState<string>(
    clauses.length > 0 ? clauses[0].clause_id : ''
  );
  const [showGlossaryHighlights, setShowGlossaryHighlights] = useState<boolean>(true);
  const [popoverTerm, setPopoverTerm] = useState<GlossaryTerm | null>(null);
  const docContainerRef = useRef<HTMLDivElement>(null);

  // Parse lines with matching metadata
  const lines = documentText.split('\n');

  // Parse legal jargon glossary
  const glossaryData = useMemo(() => {
    return parseDocumentGlossary(documentText);
  }, [documentText]);

  // Verify all clauses
  const verifiedClauses = clauses.map(c => {
    const match = verifyCitation(documentText, c.verbatim_quote);
    return {
      ...c,
      match
    };
  });

  const activeClause = verifiedClauses.find(c => c.clause_id === selectedClauseId) || verifiedClauses[0];

  // Auto scroll to active clause in the source text panel
  const scrollToClause = (clause: typeof activeClause) => {
    if (!clause || !clause.match.isVerified || clause.match.lineNumber <= 0) return;
    const targetElement = document.getElementById(`doc-line-${clause.match.lineNumber}`);
    if (targetElement && docContainerRef.current) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Helper to render source lines with clickable jargon highlights
  const renderSourceLineWithGlossary = (line: string) => {
    if (!line) return <span className="opacity-0">.</span>;
    if (!showGlossaryHighlights || glossaryData.terms.length === 0) {
      return <span>{line}</span>;
    }

    const parts = line.split(/(\b[A-Za-z0-9'-]+\b)/g);
    return (
      <>
        {parts.map((part, pIdx) => {
          const lower = part.toLowerCase();
          const matched = glossaryData.terms.find(t => 
            t.canonicalTerm.toLowerCase() === lower || 
            t.canonicalTerm.toLowerCase().split(' ').includes(lower)
          );
          if (matched) {
            return (
              <span
                key={pIdx}
                onClick={(e) => {
                  e.stopPropagation();
                  setPopoverTerm(matched);
                }}
                className="underline decoration-amber-400/70 text-amber-300 font-semibold hover:bg-amber-400 hover:text-slate-950 px-0.5 rounded cursor-pointer transition"
                title={`Click to define legal jargon: ${matched.canonicalTerm}`}
              >
                {part}
              </span>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </>
    );
  };

  useEffect(() => {
    if (activeClause && inspectorMode === 'citation') {
      scrollToClause(activeClause);
    }
  }, [selectedClauseId, inspectorMode]);

  return (
    <div className="space-y-4">
      {/* Sub-view Navigation Bar inside Dual-Pane Citation Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setInspectorMode('citation')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              inspectorMode === 'citation'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Ground-Truth Citation View</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              inspectorMode === 'citation' ? 'bg-slate-950/20 text-slate-900' : 'bg-slate-800 text-slate-400'
            }`}>
              Source vs Audit
            </span>
          </button>

          <button
            type="button"
            onClick={() => setInspectorMode('compare')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              inspectorMode === 'compare'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Side-by-Side Document Comparator</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              inspectorMode === 'compare' ? 'bg-slate-950/20 text-slate-900' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
            }`}>
              Compare 2nd Doc
            </span>
          </button>

          {/* Toggle Diff Mode Button */}
          <button
            id="toggle-diff-btn"
            type="button"
            onClick={() => {
              if (inspectorMode !== 'compare') {
                setInspectorMode('compare');
                setDiffMode(true);
              } else {
                setDiffMode(!diffMode);
              }
            }}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
              diffMode && inspectorMode === 'compare'
                ? 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-emerald-950/80 text-white border-emerald-500/50 shadow-md ring-1 ring-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-700/60'
            }`}
            title="Toggle visual highlight system (red/green) to indicate differences when two documents are loaded side-by-side"
          >
            <GitCompare className="w-3.5 h-3.5 text-amber-400" />
            <span>Toggle Diff</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold flex items-center gap-1 ${
              diffMode && inspectorMode === 'compare'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${diffMode && inspectorMode === 'compare' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {diffMode && inspectorMode === 'compare' ? 'Red/Green ON' : 'OFF'}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 pr-2">
          {inspectorMode === 'citation' ? (
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verbatim Line Bounds Active
            </span>
          ) : (
            <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
              <GitCompare className="w-3.5 h-3.5" />
              Visual Red/Green Diff System Active
            </span>
          )}
        </div>
      </div>

      {/* Conditionally Render: Comparator View vs Ground-Truth Citation Inspector */}
      {inspectorMode === 'compare' ? (
        <DocumentComparisonView
          documentTextA={documentText}
          documentTitleA={documentTitle}
          diffMode={diffMode}
          onToggleDiff={() => setDiffMode(!diffMode)}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Top Banner */}
          <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileSearch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-['Cinzel',serif] flex items-center gap-2">
                  Interactive Ground-Truth Citation Inspector
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-sans font-medium">
                    Dual-Pane Precision View
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Correlates every audited legal conclusion directly to its exact line coordinates in the source instrument.
                </p>
              </div>
            </div>

            {/* Quick Clause Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {verifiedClauses.map((clause, idx) => {
                const isSelected = clause.clause_id === activeClause?.clause_id;
                const isCritical = clause.risk_level === 'CRITICAL';
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedClauseId(clause.clause_id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer shrink-0 border ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-xs'
                        : isCritical
                        ? 'bg-red-950/40 text-red-300 border-red-800/60 hover:bg-red-900/40'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    {clause.clause_id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
            {/* Left Pane: Original Source Contract with Line Numbers & Highlights (5 cols) */}
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col bg-slate-950/80">
              <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                  Source Text (Verbatim Ground Truth)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowGlossaryHighlights(!showGlossaryHighlights)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${
                      showGlossaryHighlights
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-300'
                    }`}
                    title="Toggle clickable legal jargon highlights"
                  >
                    <BookOpen className="w-3 h-3 text-amber-400" />
                    <span>Jargon Highlights ({glossaryData.terms.length})</span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {lines.length} Lines
                  </span>
                </div>
              </div>

              <div 
                ref={docContainerRef}
                className="p-4 overflow-y-auto max-h-[600px] font-mono text-xs leading-relaxed space-y-0.5 select-text relative"
              >
                {lines.map((line, lIdx) => {
                  const lineNo = lIdx + 1;
                  const matchingClause = verifiedClauses.find(
                    c => c.match.isVerified && lineNo >= c.match.lineNumber && lineNo <= c.match.lineNumber + (c.verbatim_quote.split('\n').length - 1)
                  );
                  const isActive = matchingClause?.clause_id === activeClause?.clause_id;

                  return (
                    <div
                      key={lIdx}
                      id={`doc-line-${lineNo}`}
                      onClick={() => {
                        if (matchingClause) {
                          setSelectedClauseId(matchingClause.clause_id);
                        }
                      }}
                      className={`flex items-start gap-3 py-0.5 px-2 rounded-sm transition cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-200 font-semibold ring-1 ring-amber-500/60'
                          : matchingClause
                          ? 'bg-red-950/25 text-slate-200 hover:bg-slate-800/60'
                          : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] text-slate-600 font-mono select-none w-6 text-right shrink-0 pt-0.5">
                        {lineNo}
                      </span>
                      <span className="flex-1 whitespace-pre-wrap font-sans text-xs">
                        {renderSourceLineWithGlossary(line)}
                      </span>
                      {matchingClause && lineNo === matchingClause.match.lineNumber && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 select-none">
                          {matchingClause.clause_id}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Inline Popover Definition Drawer for clicked legal jargon term */}
              {popoverTerm && (
                <div className="p-3.5 bg-slate-900 border-t border-amber-500/30 shadow-2xl relative text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400 font-['Cinzel',serif] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        {popoverTerm.term}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                        popoverTerm.riskSeverity === 'HIGH' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                        popoverTerm.riskSeverity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                        'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {popoverTerm.riskSeverity} RISK
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPopoverTerm(null)}
                      className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                      aria-label="Close term definition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-slate-200 leading-relaxed font-sans bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <strong className="text-emerald-400 block text-[11px] mb-0.5 font-mono">Plain English:</strong>
                    {popoverTerm.plainEnglishDefinition}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>Category: {popoverTerm.category}</span>
                    <span className="text-amber-400 font-semibold">{popoverTerm.occurrenceCount} occurrences in document</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Pane: Selected Clause Deep Deconstruction & Precision Redline (7 cols) */}
            <div className="lg:col-span-7 flex flex-col p-6 space-y-5 overflow-y-auto max-h-[660px] bg-slate-900">
              {activeClause ? (
                <>
                  {/* Active Clause Header & Ground-Truth Match Verification */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-bold font-mono px-2.5 py-1 rounded-md bg-slate-800 text-amber-300 border border-slate-700">
                        {activeClause.clause_id}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                        {activeClause.clause_category}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-slate-500" />
                        Favors: <strong className="text-slate-200">{activeClause.party_favored}</strong>
                      </span>
                    </div>

                    {/* Verification Confidence Indicator */}
                    <div>
                      {activeClause.match.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          100% Verbatim Substring Verified (Line {activeClause.match.lineNumber})
                        </span>
                      ) : activeClause.match.isOmission ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/40 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                          OMISSION DETECTED (Protective Covenant Missing)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          Normalized Match Found
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Exact Verbatim Extract Quote Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 relative">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2">
                      <span>Strict Verbatim Extract from Document</span>
                      {activeClause.match.isVerified && (
                        <button
                          onClick={() => scrollToClause(activeClause)}
                          className="text-[10px] text-amber-300/80 hover:text-amber-200 flex items-center gap-1 underline transition cursor-pointer"
                        >
                          <Crosshair className="w-3 h-3" />
                          Center in Source Pane (Line {activeClause.match.lineNumber})
                        </button>
                      )}
                    </div>
                    <blockquote className="text-xs sm:text-sm font-serif italic text-slate-200 border-l-2 border-amber-500 pl-3.5 py-1 leading-relaxed whitespace-pre-wrap">
                      "{activeClause.verbatim_quote}"
                    </blockquote>
                  </div>

                  {/* Plain-English 4-Question Translation Matrix */}
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                        Plain-English Practical Breakdown (8th-Grade Reading Level)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ANTI-LEGALESE TRANSLATION
                      </span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-sans">
                      {activeClause.plain_english_meaning}
                    </p>
                  </div>

                  {/* Hidden Pitfalls Checklist */}
                  {activeClause.hidden_pitfalls && activeClause.hidden_pitfalls.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        Latent Traps & Asymmetric Liability Vectors
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeClause.hidden_pitfalls.map((pitfall, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{pitfall}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Precision Redline Diff Component */}
                  <div>
                    <RedlineDiffViewer
                      clauseId={activeClause.clause_id}
                      originalQuote={activeClause.verbatim_quote}
                      proposedRedline={activeClause.proposed_redline}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center p-8">
                  <Crosshair className="w-10 h-10 text-slate-600 mb-2" />
                  <p className="text-sm">Select a clause to inspect its verbatim verification and redline.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
