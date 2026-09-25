/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CriticalClauseAudit } from '../types';
import { generateClauseMarkdown, calculateClauseRiskScore } from '../utils/clauseExport';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  ShieldAlert, 
  Scale, 
  CheckCircle2, 
  Sliders, 
  FileDown 
} from 'lucide-react';

interface ClauseExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clause: CriticalClauseAudit | null;
  documentTitle?: string;
  verifiedLine?: number;
}

export const ClauseExportModal: React.FC<ClauseExportModalProps> = ({
  isOpen,
  onClose,
  clause,
  documentTitle = '',
  verifiedLine
}) => {
  const [copied, setCopied] = useState(false);
  const [includeAuditNotes, setIncludeAuditNotes] = useState(true);
  const [includeVerbatim, setIncludeVerbatim] = useState(true);
  const [includeRedline, setIncludeRedline] = useState(true);
  const [customNotes, setCustomNotes] = useState('');

  // Reset copied status when clause changes
  useEffect(() => {
    setCopied(false);
  }, [clause]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !clause) return null;

  const riskScore = calculateClauseRiskScore(clause);

  // Generate markdown snippet based on user configuration
  const markdownSnippet = generateClauseMarkdown(clause, {
    documentTitle,
    verifiedLine,
    auditNotes: includeAuditNotes ? (customNotes || undefined) : undefined
  });

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(markdownSnippet);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = markdownSnippet;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownload = () => {
    const filename = `${clause.clause_id.replace(/[^a-zA-Z0-9_-]/g, '_')}_audit_dossier.md`;
    const blob = new Blob([markdownSnippet], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="clause-export-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="clause-export-title" className="text-base font-bold text-white font-mono">
                  Export Clause: {clause.clause_id}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                  Markdown Dossier
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Formatted markdown snippet containing risk score, citation extract, plain English meaning, and attorney audit notes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close export modal"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clause Quick Summary Banner */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-mono">
              Risk Score: <strong className={riskScore >= 70 ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>{riskScore}/100</strong> ({clause.risk_level})
            </span>
            <span className="text-slate-400">
              Favors: <strong className="text-slate-200">{clause.party_favored}</strong>
            </span>
            {verifiedLine && (
              <span className="text-emerald-400 font-mono text-[11px]">
                Ground Truth Line {verifiedLine}
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {clause.clause_category}
          </span>
        </div>

        {/* Modal Body: Markdown Preview */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-mono">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Markdown Code Preview (.md)
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Ready for GitHub, Slack, Notion, or Counsel Briefing
            </span>
          </div>

          {/* Formatted Textarea / Preview */}
          <div className="relative">
            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto max-h-[380px] whitespace-pre-wrap select-all selection:bg-amber-500/30">
              {markdownSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono">
            {copied ? (
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <Check className="w-4 h-4" />
                Copied Markdown to Clipboard!
              </span>
            ) : (
              <span>Click to copy or download as standalone .md file</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Download .md</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-450 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-950" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
