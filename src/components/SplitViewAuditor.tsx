import React, { useState, useRef, useEffect } from 'react';
import { CriticalClauseAudit } from '../types';
import { verifyCitation } from '../utils/citationMatcher';
import { RedlineDiffViewer } from './RedlineDiffViewer';
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
  AlertCircle
} from 'lucide-react';

interface SplitViewAuditorProps {
  documentText: string;
  clauses: CriticalClauseAudit[];
  onSelectClause?: (clauseId: string) => void;
}

export const SplitViewAuditor: React.FC<SplitViewAuditorProps> = ({
  documentText,
  clauses
}) => {
  const [selectedClauseId, setSelectedClauseId] = useState<string>(
    clauses.length > 0 ? clauses[0].clause_id : ''
  );
  const docContainerRef = useRef<HTMLDivElement>(null);

  // Parse lines with matching metadata
  const lines = documentText.split('\n');

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

  useEffect(() => {
    if (activeClause) {
      scrollToClause(activeClause);
    }
  }, [selectedClauseId]);

  return (
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
            <span className="text-[11px] text-slate-400 font-mono">
              {lines.length} Lines • Click to focus
            </span>
          </div>

          <div 
            ref={docContainerRef}
            className="p-4 overflow-y-auto max-h-[600px] font-mono text-xs leading-relaxed space-y-0.5 select-text"
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
                    {line || <span className="opacity-0">.</span>}
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
  );
};
