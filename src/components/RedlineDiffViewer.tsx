import React, { useState } from 'react';
import { Copy, Check, Split, GitCommit } from 'lucide-react';
import { generateWordDiff } from '../utils/citationMatcher';

interface RedlineDiffViewerProps {
  originalQuote: string;
  proposedRedline: string;
  clauseId: string;
}

export const RedlineDiffViewer: React.FC<RedlineDiffViewerProps> = ({
  originalQuote,
  proposedRedline,
  clauseId
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('side-by-side');
  const [copiedRedline, setCopiedRedline] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);

  const isOmission = originalQuote.includes('[OMISSION DETECTED]');

  const handleCopyRedline = () => {
    navigator.clipboard.writeText(proposedRedline);
    setCopiedRedline(true);
    setTimeout(() => setCopiedRedline(false), 2000);
  };

  const handleCopyOriginal = () => {
    navigator.clipboard.writeText(originalQuote);
    setCopiedOriginal(true);
    setTimeout(() => setCopiedOriginal(false), 2000);
  };

  const wordDiff = !isOmission ? generateWordDiff(originalQuote, proposedRedline) : [];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
      {/* Header Bar */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-amber-400 font-mono">
            {clauseId}
          </span>
          <span className="text-xs font-semibold text-slate-200">
            Precision Redline & Strike Analysis
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isOmission && (
            <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'side-by-side'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Split className="w-3 h-3" />
                <span>Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('inline')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1 ${
                  viewMode === 'inline'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitCommit className="w-3 h-3" />
                <span>Word Diff</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopyRedline}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-medium border border-emerald-500/40 transition cursor-pointer"
          >
            {copiedRedline ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-emerald-400" />
                <span>Copy Redline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'side-by-side' || isOmission ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original Predatory Clause */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-red-400 uppercase tracking-wider">
                <span>Original Verbatim Text</span>
                {!isOmission && (
                  <button
                    type="button"
                    onClick={handleCopyOriginal}
                    className="text-[10px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    {copiedOriginal ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
              <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-xs font-mono text-slate-300 leading-relaxed min-h-[100px]">
                {isOmission ? (
                  <span className="text-red-400 italic">
                    {originalQuote}
                  </span>
                ) : (
                  originalQuote
                )}
              </div>
            </div>

            {/* Right: Proposed Reciprocal Redline */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                <span>Proposed Fair Reciprocal Term</span>
                <span className="text-[10px] text-emerald-400/80 font-normal">Ready to Paste</span>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs font-mono text-emerald-200 leading-relaxed min-h-[100px]">
                {proposedRedline}
              </div>
            </div>
          </div>
        ) : (
          /* Inline Diff View */
          <div className="space-y-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-3">
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                Strikethrough / Red = Removed Predatory Wording
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                Green = Proposed Reciprocal Replacement
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono leading-relaxed space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  Original Clause Analysis:
                </span>
                <p className="text-slate-300">
                  {wordDiff.map((token, idx) => {
                    if (token.type === 'removed') {
                      return (
                        <span key={idx} className="bg-red-950 text-red-300 line-through decoration-red-500 px-0.5 rounded">
                          {token.text}
                        </span>
                      );
                    }
                    return <span key={idx}>{token.text}</span>;
                  })}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">
                  Proposed Balanced Replacement:
                </span>
                <p className="text-emerald-200 font-medium">
                  {proposedRedline}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
