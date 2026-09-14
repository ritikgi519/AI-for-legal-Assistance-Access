import React from 'react';
import { ShieldCheck, Scale, FileText, Download, Copy, Sparkles, AlertTriangle } from 'lucide-react';
import { LexisenseAnalysisResult } from '../types';

interface HeaderProps {
  onOpenNewAnalysis: () => void;
  onOpenExportModal: () => void;
  onCopyDossier: () => void;
  copiedDossier: boolean;
  hasAnalysis: boolean;
  analysis: LexisenseAnalysisResult | null;
  activeDocTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewAnalysis,
  onOpenExportModal,
  onCopyDossier,
  copiedDossier,
  hasAnalysis,
  activeDocTitle
}) => {
  return (
    <header role="banner" className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Engine Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm shrink-0" aria-hidden="true">
            <Scale className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-white font-['Cinzel',serif]">
                LEXISENSE
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                <ShieldCheck className="w-3 h-3 text-amber-400" aria-hidden="true" />
                Citation-Lock Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {activeDocTitle ? (
                <span className="text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                  <span className="truncate">{activeDocTitle}</span>
                </span>
              ) : (
                'Legal Intelligence & Document Deconstruction'
              )}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-new-analysis"
            onClick={onOpenNewAnalysis}
            aria-label="Analyze new document"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="hidden md:inline">Analyze</span> Document
          </button>

          {hasAnalysis && (
            <>
              <button
                id="btn-copy-dossier"
                onClick={onCopyDossier}
                aria-label="Copy Attorney Briefing Dossier"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                title="Copy Attorney Briefing Dossier"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span className="hidden sm:inline">{copiedDossier ? 'Copied Brief' : 'Attorney Dossier'}</span>
              </button>

              <button
                id="btn-export-json"
                onClick={onOpenExportModal}
                aria-label="Export Analysis JSON and Markdown"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Export JSON</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mandatory Statutory Banner */}
      <div className="bg-slate-950/80 border-t border-slate-850 px-4 py-1.5 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5 border-b border-slate-800/60">
        <AlertTriangle className="w-3 h-3 text-amber-400/80 shrink-0" />
        <span>
          <strong className="text-slate-300">Mandatory Advisory Notice:</strong> For informational and educational purposes only. Does not constitute legal advice or representation. Consult certified local counsel before execution.
        </span>
      </div>
    </header>
  );
};
