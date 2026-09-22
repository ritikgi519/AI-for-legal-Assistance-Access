import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  GitCompare, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Filter, 
  Maximize2, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Scale, 
  Eye, 
  Layers
} from 'lucide-react';
import { ComparisonDiscrepancy, DiscrepancyType } from '../types';
import { compareDocuments } from '../utils/documentComparator';
import { generateWordDiff } from '../utils/citationMatcher';
import { COMPARISON_PRESETS, ComparisonPreset } from '../data/comparisonPresets';

interface DocumentComparisonViewProps {
  documentTextA: string;
  documentTitleA?: string;
  onSelectClauseId?: (clauseId: string) => void;
  diffMode?: boolean;
  onToggleDiff?: () => void;
}

export const DocumentComparisonView: React.FC<DocumentComparisonViewProps> = ({
  documentTextA,
  documentTitleA = 'Current Loaded Instrument',
  diffMode,
  onToggleDiff
}) => {
  // State for Document B (initialize with benchmark counter-proposal preset so two documents are loaded side-by-side)
  const defaultPreset = COMPARISON_PRESETS[0];
  const [docBText, setDocBText] = useState<string>(defaultPreset?.docBText || '');
  const [docBTitle, setDocBTitle] = useState<string>(defaultPreset?.docBTitle || 'Counter-Proposal Redline B');
  const [internalDiffMode, setInternalDiffMode] = useState<boolean>(true);
  const [pastedText, setPastedText] = useState<string>('');
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MODIFIED' | 'ADDED' | 'REMOVED' | 'IDENTICAL'>('ALL');
  const [syncScroll, setSyncScroll] = useState<boolean>(true);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [viewStyle, setViewStyle] = useState<'split' | 'word-diff'>('split');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Active diff mode state (uses controlled prop if provided, else internal state)
  const isDiffActive = diffMode !== undefined ? diffMode : internalDiffMode;
  const handleToggleDiff = () => {
    if (onToggleDiff) {
      onToggleDiff();
    } else {
      setInternalDiffMode(!internalDiffMode);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const paneARef = useRef<HTMLDivElement>(null);
  const paneBRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef<boolean>(false);

  // Run the document comparator
  const comparisonResult = useMemo(() => {
    if (!docBText.trim()) return null;
    return compareDocuments(documentTextA, docBText, documentTitleA, docBTitle || 'Comparison Document (Version B)');
  }, [documentTextA, docBText, documentTitleA, docBTitle]);

  // Filtered discrepancies
  const filteredDiscrepancies = useMemo(() => {
    if (!comparisonResult) return [];
    if (activeFilter === 'ALL') {
      return comparisonResult.discrepancies.filter(d => d.type !== 'IDENTICAL');
    }
    return comparisonResult.discrepancies.filter(d => d.type === activeFilter);
  }, [comparisonResult, activeFilter]);

  // Set initial selected discrepancy when comparison completes
  useEffect(() => {
    if (filteredDiscrepancies.length > 0 && !selectedDiscrepancyId) {
      setSelectedDiscrepancyId(filteredDiscrepancies[0].id);
    } else if (filteredDiscrepancies.length > 0 && !filteredDiscrepancies.find(d => d.id === selectedDiscrepancyId)) {
      setSelectedDiscrepancyId(filteredDiscrepancies[0].id);
    }
  }, [filteredDiscrepancies, selectedDiscrepancyId]);

  const activeDiscrepancy = useMemo(() => {
    if (!comparisonResult) return null;
    return comparisonResult.discrepancies.find(d => d.id === selectedDiscrepancyId) || filteredDiscrepancies[0] || null;
  }, [comparisonResult, selectedDiscrepancyId, filteredDiscrepancies]);

  // Handle synchronized scroll
  const handleScrollA = () => {
    if (!syncScroll || isSyncingScroll.current || !paneARef.current || !paneBRef.current) return;
    isSyncingScroll.current = true;
    const percentage = paneARef.current.scrollTop / (paneARef.current.scrollHeight - paneARef.current.clientHeight || 1);
    paneBRef.current.scrollTop = percentage * (paneBRef.current.scrollHeight - paneBRef.current.clientHeight);
    setTimeout(() => { isSyncingScroll.current = false; }, 50);
  };

  const handleScrollB = () => {
    if (!syncScroll || isSyncingScroll.current || !paneARef.current || !paneBRef.current) return;
    isSyncingScroll.current = true;
    const percentage = paneBRef.current.scrollTop / (paneBRef.current.scrollHeight - paneBRef.current.clientHeight || 1);
    paneARef.current.scrollTop = percentage * (paneARef.current.scrollHeight - paneARef.current.clientHeight);
    setTimeout(() => { isSyncingScroll.current = false; }, 50);
  };

  // Scroll to active discrepancy in both panes
  const scrollToDiscrepancy = (disc: ComparisonDiscrepancy) => {
    if (disc.docALineStart > 0) {
      const elA = document.getElementById(`docA-line-${disc.docALineStart}`);
      if (elA && paneARef.current) {
        elA.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    if (disc.docBLineStart > 0) {
      const elB = document.getElementById(`docB-line-${disc.docBLineStart}`);
      if (elB && paneBRef.current) {
        elB.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  useEffect(() => {
    if (activeDiscrepancy) {
      scrollToDiscrepancy(activeDiscrepancy);
    }
  }, [selectedDiscrepancyId]);

  // Load a comparison preset
  const handleLoadPreset = (preset: ComparisonPreset) => {
    setDocBText(preset.docBText);
    setDocBTitle(preset.docBTitle);
    setSelectedDiscrepancyId('');
  };

  // File upload handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setDocBText(content);
        setDocBTitle(file.name.replace(/\.[^/.]+$/, ''));
        setSelectedDiscrepancyId('');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setDocBText(content);
          setDocBTitle(file.name.replace(/\.[^/.]+$/, ''));
          setSelectedDiscrepancyId('');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleApplyPastedText = () => {
    if (pastedText.trim().length > 10) {
      setDocBText(pastedText);
      setDocBTitle('Pasted Instrument (Version B)');
      setPastedText('');
      setSelectedDiscrepancyId('');
    }
  };

  const handleCopyReport = () => {
    if (!comparisonResult) return;
    const lines = [
      `# LEXISENSE DOCUMENT COMPARISON & DISCREPANCY REPORT`,
      `Document A (Baseline): ${comparisonResult.docAName}`,
      `Document B (Comparison): ${comparisonResult.docBName}`,
      `Overall Content Parity Score: ${comparisonResult.similarityScore}%`,
      `Total Discrepancies Detected: ${comparisonResult.totalDiscrepancies}`,
      `Modifications: ${comparisonResult.summary.modifications} | Additions: ${comparisonResult.summary.additions} | Removals: ${comparisonResult.summary.removals}`,
      ``,
      `--- DETAILED DISCREPANCIES ---`,
      ...comparisonResult.discrepancies.map((d, i) => (
        `[${i + 1}] ${d.title} (${d.type} - Impact: ${d.substantiveImpact})\n` +
        `Explanation: ${d.explanation}\n` +
        `Doc A (Lines ${d.docALineStart}-${d.docALineEnd}):\n${d.docAText}\n` +
        `Doc B (Lines ${d.docBLineStart}-${d.docBLineEnd}):\n${d.docBText}\n`
      ))
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Discrepancy navigation
  const currentIndex = filteredDiscrepancies.findIndex(d => d.id === activeDiscrepancy?.id);
  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedDiscrepancyId(filteredDiscrepancies[currentIndex - 1].id);
    }
  };
  const handleNext = () => {
    if (currentIndex < filteredDiscrepancies.length - 1) {
      setSelectedDiscrepancyId(filteredDiscrepancies[currentIndex + 1].id);
    }
  };

  // Helper for impact badge
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'FAVORABLE_TO_USER':
        return { label: 'Favorable to Counterparty / User', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' };
      case 'CRITICAL_SHIFT':
        return { label: 'Critical Substantive Shift', bg: 'bg-red-500/15 text-red-300 border-red-500/40' };
      case 'UNFAVORABLE_TO_USER':
        return { label: 'Aggressive / Unfavorable Shift', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40' };
      default:
        return { label: 'Neutral Linguistic Alignment', bg: 'bg-slate-700/40 text-slate-300 border-slate-600/40' };
    }
  };

  const getDiscrepancyBadge = (type: DiscrepancyType) => {
    switch (type) {
      case 'MODIFIED':
        return { label: 'VARIATION', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'ADDED':
        return { label: 'ADDED IN B', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'REMOVED':
        return { label: 'REMOVED IN B', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      default:
        return { label: 'IDENTICAL', bg: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  // Helper to render word-level and line-level diff tokens with red/green visual highlights
  const renderDiffLine = (
    line: string,
    matchingDiscrepancy: ComparisonDiscrepancy | undefined,
    pane: 'docA' | 'docB'
  ) => {
    if (!line) return <span className="opacity-0">.</span>;
    if (!isDiffActive || !matchingDiscrepancy || matchingDiscrepancy.type === 'IDENTICAL') {
      return <span>{line}</span>;
    }

    if (pane === 'docA') {
      if (matchingDiscrepancy.type === 'REMOVED') {
        return (
          <span className="line-through decoration-rose-400 text-rose-200 bg-rose-950/70 px-1 py-0.5 rounded font-mono">
            {line}
          </span>
        );
      }
      if (matchingDiscrepancy.type === 'MODIFIED') {
        const wordsInB = new Set(
          matchingDiscrepancy.docBText
            .toLowerCase()
            .replace(/[^\w\s$%-]/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
        );

        const parts = line.split(/(\s+)/);
        return (
          <span>
            {parts.map((part, pIdx) => {
              const clean = part.trim().toLowerCase().replace(/[^\w$%-]/g, '');
              if (!clean) return <span key={pIdx}>{part}</span>;
              const isRemovedWord = !wordsInB.has(clean);
              if (isRemovedWord) {
                return (
                  <span
                    key={pIdx}
                    className="bg-rose-500/35 text-rose-100 font-semibold line-through decoration-rose-400 px-1 py-0.5 rounded mx-0.5 border border-rose-500/50 shadow-sm"
                    title="Term removed or altered in Version B"
                  >
                    {part}
                  </span>
                );
              }
              return <span key={pIdx} className="text-slate-200">{part}</span>;
            })}
          </span>
        );
      }
    }

    if (pane === 'docB') {
      if (matchingDiscrepancy.type === 'ADDED') {
        return (
          <span className="underline decoration-emerald-400 text-emerald-200 bg-emerald-950/70 px-1 py-0.5 rounded font-mono font-medium">
            {line}
          </span>
        );
      }
      if (matchingDiscrepancy.type === 'MODIFIED') {
        const wordsInA = new Set(
          matchingDiscrepancy.docAText
            .toLowerCase()
            .replace(/[^\w\s$%-]/g, ' ')
            .split(/\s+/)
            .filter(Boolean)
        );

        const parts = line.split(/(\s+)/);
        return (
          <span>
            {parts.map((part, pIdx) => {
              const clean = part.trim().toLowerCase().replace(/[^\w$%-]/g, '');
              if (!clean) return <span key={pIdx}>{part}</span>;
              const isAddedWord = !wordsInA.has(clean);
              if (isAddedWord) {
                return (
                  <span
                    key={pIdx}
                    className="bg-emerald-500/35 text-emerald-100 font-semibold underline decoration-emerald-400 px-1 py-0.5 rounded mx-0.5 border border-emerald-500/50 shadow-sm"
                    title="Newly added or revised term in Version B"
                  >
                    {part}
                  </span>
                );
              }
              return <span key={pIdx} className="text-slate-200">{part}</span>;
            })}
          </span>
        );
      }
    }

    return <span>{line}</span>;
  };

  const linesA = documentTextA.split('\n');
  const linesB = docBText.split('\n');

  // If no Document B is loaded yet, show the onboarding & upload hub
  if (!docBText.trim()) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-8">
        {/* Hub Header */}
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider mb-2">
            <GitCompare className="w-4 h-4" />
            <span>Dual-Instrument Cross-Examination</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white font-['Cinzel',serif] tracking-tight">
            Side-by-Side Document Comparator
          </h3>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed font-sans">
            Compare <strong className="text-amber-300">{documentTitleA}</strong> against a second uploaded counter-proposal, revised redline, or historical version to instantly expose unannounced covenant shifts, deleted protections, and clause variations.
          </p>
        </div>

        {/* Upload & Drop Zone */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                isDragging
                  ? 'border-amber-500 bg-amber-500/10'
                  : 'border-slate-700 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Click to browse or drop Document B here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports plain text (.txt, .md, .doc, .json)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text,.json"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload second document file"
              />
            </div>

            {/* Direct Paste Alternative */}
            <div className="space-y-2">
              <label htmlFor="paste-doc-b-textarea" className="text-xs font-semibold text-slate-400 block">
                Or paste Document B text directly:
              </label>
              <textarea
                id="paste-doc-b-textarea"
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste contract text, counter-draft, or amended agreement here..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60 leading-relaxed"
              />
              <button
                type="button"
                onClick={handleApplyPastedText}
                disabled={pastedText.trim().length < 10}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare Pasted Text</span>
              </button>
            </div>
          </div>

          {/* Quick-Load Benchmark Presets */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Or Select a Benchmark Preset</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Test the side-by-side discrepancy engine instantly using prepared negotiation counter-proposals:
            </p>

            <div className="space-y-2.5 pt-1">
              {COMPARISON_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleLoadPreset(preset)}
                  className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-950 transition cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 group-hover:text-amber-200 font-mono">
                      {preset.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Comparison Interface
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
      {/* Top Comparison Header Bar */}
      <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-['Cinzel',serif] flex items-center gap-2">
              Side-by-Side Instrument Comparator
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-sans font-medium">
                Dual-Pane Active
              </span>
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-xl">
              Cross-examining <span className="text-slate-200 font-medium">{documentTitleA}</span> vs <span className="text-amber-300 font-medium">{docBTitle}</span>
            </p>
          </div>
        </div>

        {/* Global Controls & Sync Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Diff Mode Button */}
          <button
            id="doc-comparator-toggle-diff-btn"
            type="button"
            onClick={handleToggleDiff}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-2 transition cursor-pointer shadow-sm ${
              isDiffActive
                ? 'bg-gradient-to-r from-rose-950/70 via-slate-900 to-emerald-950/70 border-emerald-500/60 text-white shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
            }`}
            title="Toggle red/green visual difference highlight system"
          >
            <GitCompare className={`w-3.5 h-3.5 ${isDiffActive ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Toggle Diff</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold flex items-center gap-1 ${
              isDiffActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-900 text-slate-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isDiffActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              {isDiffActive ? 'Red/Green Active' : 'Off'}
            </span>
          </button>

          {/* Synchronized Scroll Toggle */}
          <button
            type="button"
            onClick={() => setSyncScroll(!syncScroll)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
              syncScroll
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title={syncScroll ? 'Synchronized scrolling enabled' : 'Independent scrolling'}
          >
            {syncScroll ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">Sync Scroll</span>
          </button>

          {/* Copy Report */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Copy Discrepancy Ledger to Clipboard"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{copiedReport ? 'Copied' : 'Copy Ledger'}</span>
          </button>

          {/* Change Document B */}
          <button
            type="button"
            onClick={() => { setDocBText(''); setDocBTitle(''); }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Upload or select a different comparison document"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Switch Doc B</span>
          </button>
        </div>
      </div>

      {/* Visual Diff Highlight Banner & Legend Strip */}
      {isDiffActive && comparisonResult && (
        <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Diff Highlight Mode:
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/40 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <strong>RED</strong>: Omitted / Altered in Baseline (Doc A)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <strong>GREEN</strong>: Added / Revised in Version B
            </span>
            <span className="text-[11px] font-mono text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {comparisonResult.totalDiscrepancies} Discrepancies Highlighted
            </span>
          </div>
          <div className="text-[11px] font-sans text-slate-400">
            Click any red/green clause to jump to the discrepancy breakdown
          </div>
        </div>
      )}

      {/* Metrics Summary Strip */}

      {comparisonResult && (
        <div className="bg-slate-950/70 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Parity Score */}
            <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
              <span className="text-slate-400 font-medium">Textual Parity:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                comparisonResult.similarityScore > 80
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : comparisonResult.similarityScore > 50
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-red-500/15 text-red-300 border border-red-500/30'
              }`}>
                {comparisonResult.similarityScore}% Match
              </span>
            </div>

            {/* Counts */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Discrepancies:</span>
              <span className="font-mono font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded">
                {comparisonResult.totalDiscrepancies}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-slate-400 font-mono text-[11px]">
              <span className="text-amber-400 font-semibold">{comparisonResult.summary.modifications} Variations</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{comparisonResult.summary.additions} Additions</span>
              <span>•</span>
              <span className="text-rose-400 font-semibold">{comparisonResult.summary.removals} Removals</span>
            </div>
          </div>

          {/* Quick Jump Navigator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Discrepancy {currentIndex >= 0 ? currentIndex + 1 : 0} of {filteredDiscrepancies.length}
            </span>
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              aria-label="Previous discrepancy"
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= filteredDiscrepancies.length - 1}
              aria-label="Next discrepancy"
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs Strip */}
      <div className="bg-slate-900/90 px-6 py-2 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Differences ({comparisonResult ? comparisonResult.totalDiscrepancies : 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('MODIFIED')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'MODIFIED'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Variations ({comparisonResult?.summary.modifications || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('ADDED')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'ADDED'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Added in B ({comparisonResult?.summary.additions || 0})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('REMOVED')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeFilter === 'REMOVED'
                ? 'bg-rose-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Removed in B ({comparisonResult?.summary.removals || 0})
          </button>
        </div>

        {/* View Mode Toggle: Raw Split vs Word-level Diff */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-0.5 border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setViewStyle('split')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition cursor-pointer ${
              viewStyle === 'split' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dual Instrument
          </button>
          <button
            type="button"
            onClick={() => setViewStyle('word-diff')}
            className={`px-2 py-0.5 text-xs font-medium rounded transition cursor-pointer ${
              viewStyle === 'word-diff' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Redline Diff
          </button>
        </div>
      </div>

      {/* Main Dual-Pane Side-by-Side Comparison Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 min-h-[500px]">
        {/* Left Pane: Document A (Loaded Baseline) */}
        <div className="flex flex-col bg-slate-950/80">
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{documentTitleA}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
              Doc A • {linesA.length} Lines
            </span>
          </div>

          <div
            ref={paneARef}
            onScroll={handleScrollA}
            className="p-4 overflow-y-auto max-h-[520px] font-mono text-xs leading-relaxed space-y-0.5 select-text"
          >
            {linesA.map((line, idx) => {
              const lineNum = idx + 1;
              const matchingDiscrepancy = comparisonResult?.discrepancies.find(
                d => lineNum >= d.docALineStart && lineNum <= d.docALineEnd && d.type !== 'IDENTICAL'
              );
              const isActive = matchingDiscrepancy?.id === activeDiscrepancy?.id;

              let lineBg = 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-300';
              if (isActive) {
                lineBg = 'bg-amber-500/25 text-amber-200 font-medium ring-1 ring-amber-500/70';
              } else if (isDiffActive) {
                if (matchingDiscrepancy?.type === 'REMOVED') {
                  lineBg = 'bg-rose-950/40 text-rose-100 border-l-4 border-rose-500 shadow-sm hover:bg-rose-900/30';
                } else if (matchingDiscrepancy?.type === 'MODIFIED') {
                  lineBg = 'bg-rose-950/25 text-rose-100/90 border-l-4 border-rose-400/80 shadow-sm hover:bg-rose-900/20';
                }
              } else if (matchingDiscrepancy?.type === 'MODIFIED') {
                lineBg = 'bg-slate-850 text-slate-300 hover:bg-slate-800';
              } else if (matchingDiscrepancy?.type === 'REMOVED') {
                lineBg = 'bg-slate-850 text-slate-300 hover:bg-slate-800';
              }

              return (
                <div
                  key={idx}
                  id={`docA-line-${lineNum}`}
                  onClick={() => {
                    if (matchingDiscrepancy) setSelectedDiscrepancyId(matchingDiscrepancy.id);
                  }}
                  className={`flex items-start gap-2.5 py-0.5 px-2 rounded-sm transition cursor-pointer ${lineBg}`}
                >
                  <span className={`text-[10px] select-none w-7 text-right shrink-0 pt-0.5 font-mono ${
                    isDiffActive && matchingDiscrepancy && matchingDiscrepancy.type !== 'IDENTICAL'
                      ? 'text-rose-400 font-bold'
                      : 'text-slate-600'
                  }`}>
                    {lineNum}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap font-sans text-xs">
                    {renderDiffLine(line, matchingDiscrepancy, 'docA')}
                  </span>
                  {matchingDiscrepancy && lineNum === matchingDiscrepancy.docALineStart && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold shrink-0 select-none ${
                      isDiffActive
                        ? matchingDiscrepancy.type === 'REMOVED'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : getDiscrepancyBadge(matchingDiscrepancy.type).bg
                    }`}>
                      {isDiffActive
                        ? (matchingDiscrepancy.type === 'REMOVED' ? '[-] REMOVED IN B' : '[~] ALTERED IN B')
                        : getDiscrepancyBadge(matchingDiscrepancy.type).label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Document B (Comparison Instrument) */}
        <div className="flex flex-col bg-slate-950/80">
          <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300 flex items-center gap-1.5 truncate">
              <GitCompare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{docBTitle || 'Document B'}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
              Doc B • {linesB.length} Lines
            </span>
          </div>

          <div
            ref={paneBRef}
            onScroll={handleScrollB}
            className="p-4 overflow-y-auto max-h-[520px] font-mono text-xs leading-relaxed space-y-0.5 select-text"
          >
            {linesB.map((line, idx) => {
              const lineNum = idx + 1;
              const matchingDiscrepancy = comparisonResult?.discrepancies.find(
                d => lineNum >= d.docBLineStart && lineNum <= d.docBLineEnd && d.type !== 'IDENTICAL'
              );
              const isActive = matchingDiscrepancy?.id === activeDiscrepancy?.id;

              let lineBg = 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-300';
              if (isActive) {
                lineBg = 'bg-amber-500/25 text-amber-200 font-medium ring-1 ring-amber-500/70';
              } else if (isDiffActive) {
                if (matchingDiscrepancy?.type === 'ADDED') {
                  lineBg = 'bg-emerald-950/40 text-emerald-100 border-l-4 border-emerald-500 shadow-sm hover:bg-emerald-900/30';
                } else if (matchingDiscrepancy?.type === 'MODIFIED') {
                  lineBg = 'bg-emerald-950/25 text-emerald-100/90 border-l-4 border-emerald-400/80 shadow-sm hover:bg-emerald-900/20';
                }
              } else if (matchingDiscrepancy?.type === 'MODIFIED') {
                lineBg = 'bg-slate-850 text-slate-300 hover:bg-slate-800';
              } else if (matchingDiscrepancy?.type === 'ADDED') {
                lineBg = 'bg-slate-850 text-slate-300 hover:bg-slate-800';
              }

              return (
                <div
                  key={idx}
                  id={`docB-line-${lineNum}`}
                  onClick={() => {
                    if (matchingDiscrepancy) setSelectedDiscrepancyId(matchingDiscrepancy.id);
                  }}
                  className={`flex items-start gap-2.5 py-0.5 px-2 rounded-sm transition cursor-pointer ${lineBg}`}
                >
                  <span className={`text-[10px] select-none w-7 text-right shrink-0 pt-0.5 font-mono ${
                    isDiffActive && matchingDiscrepancy && matchingDiscrepancy.type !== 'IDENTICAL'
                      ? 'text-emerald-400 font-bold'
                      : 'text-slate-600'
                  }`}>
                    {lineNum}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap font-sans text-xs">
                    {renderDiffLine(line, matchingDiscrepancy, 'docB')}
                  </span>
                  {matchingDiscrepancy && lineNum === matchingDiscrepancy.docBLineStart && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold shrink-0 select-none ${
                      isDiffActive
                        ? matchingDiscrepancy.type === 'ADDED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : getDiscrepancyBadge(matchingDiscrepancy.type).bg
                    }`}>
                      {isDiffActive
                        ? (matchingDiscrepancy.type === 'ADDED' ? '[+] ADDED IN B' : '[~] REVISED IN B')
                        : getDiscrepancyBadge(matchingDiscrepancy.type).label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Discrepancy Deep Inspection Card */}
      {activeDiscrepancy && (
        <div className="p-6 bg-slate-900 border-t border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-md border ${getDiscrepancyBadge(activeDiscrepancy.type).bg}`}>
                {getDiscrepancyBadge(activeDiscrepancy.type).label}
              </span>
              <span className="text-sm font-bold text-white">
                {activeDiscrepancy.title}
              </span>
              <span className="text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {activeDiscrepancy.category}
              </span>
            </div>

            {/* Impact Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getImpactBadge(activeDiscrepancy.substantiveImpact).bg}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {getImpactBadge(activeDiscrepancy.substantiveImpact).label}
            </span>
          </div>

          {/* Substantive Legal Explanation */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Substantive Variation Analysis & Negotiation Impact:
            </span>
            <p>{activeDiscrepancy.explanation}</p>
          </div>

          {/* Word-level comparison or side-by-side snippet */}
          {viewStyle === 'word-diff' && activeDiscrepancy.type === 'MODIFIED' ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                  Red / Strikethrough = Present in Doc A, altered in Doc B
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Green = Modified wording in Doc B
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <p className="text-slate-300 leading-relaxed">
                  {generateWordDiff(activeDiscrepancy.docAText, activeDiscrepancy.docBText).map((token, idx) => {
                    if (token.type === 'removed') {
                      return (
                        <span key={idx} className="bg-rose-950 text-rose-300 line-through decoration-rose-500 px-0.5 rounded mx-0.5">
                          {token.text}
                        </span>
                      );
                    }
                    return <span key={idx}>{token.text}</span>;
                  })}
                </p>
                <div className="pt-2 border-t border-slate-800 text-emerald-300">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                    Document B Phrasing:
                  </span>
                  <p className="font-sans text-xs leading-relaxed">{activeDiscrepancy.docBText}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Doc A Snippet */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <span>Document A (Lines {activeDiscrepancy.docALineStart}-{activeDiscrepancy.docALineEnd})</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed min-h-[90px] whitespace-pre-wrap">
                  {activeDiscrepancy.docAText}
                </div>
              </div>

              {/* Doc B Snippet */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
                  <span>Document B (Lines {activeDiscrepancy.docBLineStart}-{activeDiscrepancy.docBLineEnd})</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/30 text-xs font-mono text-amber-200 leading-relaxed min-h-[90px] whitespace-pre-wrap">
                  {activeDiscrepancy.docBText}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
