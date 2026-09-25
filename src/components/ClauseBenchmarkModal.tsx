/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CriticalClauseAudit } from '../types';
import { 
  getBenchmarkForCategory, 
  analyzeClauseBenchmarkGap,
  IndustryBenchmarkClause,
  BenchmarkStanceOption
} from '../utils/benchmarkClauses';
import { generateWordDiff } from '../utils/citationMatcher';
import { 
  X, 
  Copy, 
  Check, 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  Split, 
  GitCommit, 
  BookOpen, 
  Download, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  Quote,
  CheckCircle2,
  FileText,
  Layers
} from 'lucide-react';

interface ClauseBenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  clause: CriticalClauseAudit | null;
  documentTitle?: string;
  onAdoptBenchmarkAsRedline?: (benchmarkText: string, stanceLabel: string) => void;
}

export const ClauseBenchmarkModal: React.FC<ClauseBenchmarkModalProps> = ({
  isOpen,
  onClose,
  clause,
  documentTitle = '',
  onAdoptBenchmarkAsRedline
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'word-diff'>('side-by-side');
  const [selectedStance, setSelectedStance] = useState<'BALANCED' | 'PRO_CUSTOMER' | 'PRO_VENDOR'>('BALANCED');
  const [copiedBenchmark, setCopiedBenchmark] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset stance and copy states when clause changes
  useEffect(() => {
    setSelectedStance('BALANCED');
    setCopiedBenchmark(false);
    setCopiedReport(false);
  }, [clause]);

  if (!isOpen || !clause) return null;

  const benchmark = getBenchmarkForCategory(clause.clause_category);
  const analysis = analyzeClauseBenchmarkGap(clause, benchmark);

  // Active stance boilerplate
  const activeStanceObj: BenchmarkStanceOption = 
    benchmark.stances.find(s => s.stance === selectedStance) || 
    benchmark.stances[0] || {
      stance: 'BALANCED',
      label: 'Balanced Market Standard',
      badge: 'Balanced',
      boilerplateText: benchmark.defaultBoilerplate,
      summary: benchmark.attorneyRationale
    };

  const activeBoilerplateText = activeStanceObj.boilerplateText;

  // Word diff computation
  const isOmission = clause.verbatim_quote.includes('OMISSION DETECTED');
  const wordDiff = !isOmission ? generateWordDiff(clause.verbatim_quote, activeBoilerplateText) : [];

  const handleCopyBenchmark = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeBoilerplateText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = activeBoilerplateText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedBenchmark(true);
      setTimeout(() => setCopiedBenchmark(false), 2000);
    } catch (err) {
      console.error('Failed to copy benchmark text', err);
    }
  };

  const generateComparisonReportMarkdown = (): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    return [
      `# ⚖️ Industry Benchmark Comparison: ${clause.clause_id} (${clause.clause_category})`,
      `**Document:** ${documentTitle || 'Contract Instrument'}  `,
      `**Date of Audit:** ${timestamp}  `,
      `**Governing Benchmark Standard:** ${benchmark.governingStandard}  `,
      `**Market Adoption Rate:** ${benchmark.marketPrevalence}  `,
      `**Alignment Score:** ${analysis.alignmentScore}%  `,
      '',
      '---',
      '',
      '## 1. Executive Gap Analysis',
      `- **Current Instrument Favors:** ${clause.party_favored} (Risk Level: ${clause.risk_level})`,
      `- **Benchmark Norm:** ${analysis.mutualityStatus.benchmark}`,
      `- **Mutuality Alignment:** ${analysis.mutualityStatus.isAligned ? 'Balanced Reciprocal' : 'Asymmetric / Unilateral'}`,
      '',
      '### Identified Deviations & Hazards:',
      ...analysis.keyGaps.map(gap => `* ${gap}`),
      '',
      `**Strategic Counsel Recommendation:** ${analysis.strategicTakeaway}`,
      '',
      '---',
      '',
      '## 2. Your Instrument Clause (Current)',
      `> "${clause.verbatim_quote}"`,
      '',
      `*Plain-English Meaning:* ${clause.plain_english_meaning}`,
      '',
      '---',
      '',
      `## 3. Industry-Standard Boilerplate (${activeStanceObj.label})`,
      '```text',
      activeBoilerplateText,
      '```',
      '',
      '### Key Standard Protections Guaranteed in Benchmark:',
      ...benchmark.standardProtections.map(p => `* [x] ${p}`),
      '',
      '### Common Defects & Pitfalls Guarded Against:',
      ...benchmark.commonDefectsToLookFor.map(d => `* [!] ${d}`),
      '',
      '---',
      '*Report generated by LexiSense Contract Auditor Benchmark Engine*'
    ].join('\n');
  };

  const handleCopyReport = async () => {
    try {
      const report = generateComparisonReportMarkdown();
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = report;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch (err) {
      console.error('Failed to copy comparison report', err);
    }
  };

  const handleDownloadReport = () => {
    const report = generateComparisonReportMarkdown();
    const filename = `${clause.clause_id.replace(/[^a-zA-Z0-9_-]/g, '_')}_benchmark_comparison.md`;
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="benchmark-modal-title"
    >
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header Strip */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {clause.clause_id}
                </span>
                <span className="text-xs font-semibold text-slate-300 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                  {clause.clause_category}
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                  vs. Industry Standard Boilerplate
                </span>
              </div>
              <h2 id="benchmark-modal-title" className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{benchmark.title}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Alignment Score Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[11px] text-slate-400">Market Alignment:</span>
              <span className={`text-xs font-mono font-bold ${
                analysis.alignmentScore >= 70 ? 'text-emerald-400' :
                analysis.alignmentScore >= 45 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {analysis.alignmentScore}%
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close benchmark comparison modal"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Stance Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Benchmark Standard:
            </span>
            <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              {benchmark.stances.map(s => (
                <button
                  key={s.stance}
                  type="button"
                  onClick={() => setSelectedStance(s.stance)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer ${
                    selectedStance === s.stance
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.badge}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode Toggle & Standard Pill */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden md:inline-block font-medium">
              Source: <strong className="text-slate-300 font-semibold">{benchmark.governingStandard}</strong>
            </span>

            <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'side-by-side'
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('word-diff')}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'word-diff'
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitCommit className="w-3.5 h-3.5" />
                <span>Redline Diff</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Quick Deviation Summary Alert Banner */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Negotiating Leverage Audit
                </span>
                <span className="text-xs text-slate-400">
                  {benchmark.marketPrevalence}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {analysis.strategicTakeaway}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyBenchmark}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                {copiedBenchmark ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-slate-950" />
                    <span>Copied Benchmark</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-950" />
                    <span>Copy Benchmark Language</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyReport}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedReport ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied Dossier</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Report (MD)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Main Comparison Area */}
          {viewMode === 'side-by-side' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Your Current Instrument Clause */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-slate-400" />
                      Your Current Contract Clause
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Favors: <strong className="text-amber-300">{clause.party_favored}</strong>
                  </span>
                </div>

                {/* Verbatim Box */}
                <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                      Verbatim Instrument Quote
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                      clause.risk_level === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      clause.risk_level === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {clause.risk_level} RISK
                    </span>
                  </div>
                  <blockquote className="text-xs text-slate-300 font-serif italic border-l-2 border-amber-500/50 pl-3 py-1 leading-relaxed bg-amber-500/[0.02] whitespace-pre-wrap max-h-64 overflow-y-auto">
                    "{clause.verbatim_quote}"
                  </blockquote>
                </div>

                {/* Plain English Translation */}
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-1.5">
                  <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" />
                    Plain-English Operational Meaning
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {clause.plain_english_meaning}
                  </p>
                </div>

                {/* Flagged Pitfalls in Current Clause */}
                {clause.hidden_pitfalls && clause.hidden_pitfalls.length > 0 && (
                  <div className="rounded-xl bg-red-950/20 border border-red-900/40 p-4 space-y-2">
                    <span className="text-[10px] font-semibold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      Latent Hazards in Your Current Clause
                    </span>
                    <ul className="space-y-1.5">
                      {clause.hidden_pitfalls.map((pitfall, pIdx) => (
                        <li key={pIdx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                          <span>{pitfall}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right Column: Industry Standard Benchmark Boilerplate */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Industry-Standard Benchmark
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {activeStanceObj.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onAdoptBenchmarkAsRedline && (
                      <button
                        type="button"
                        id="btn-adopt-benchmark-redline"
                        onClick={() => {
                          onAdoptBenchmarkAsRedline(activeBoilerplateText, activeStanceObj.badge);
                          onClose();
                        }}
                        className="text-[11px] text-amber-300 hover:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>Adopt as Redline</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyBenchmark}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition cursor-pointer"
                    >
                      {copiedBenchmark ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedBenchmark ? 'Copied' : 'Copy Boilerplate'}</span>
                    </button>
                  </div>
                </div>

                {/* Boilerplate Text Box */}
                <div className="rounded-xl bg-slate-950/90 border border-emerald-500/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                      Standard Market Language
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Standard: Mutual / Reciprocal
                    </span>
                  </div>
                  <pre className="text-xs text-slate-200 font-mono leading-relaxed bg-emerald-500/[0.03] p-3 rounded-lg border border-emerald-500/20 whitespace-pre-wrap max-h-64 overflow-y-auto select-all">
                    {activeBoilerplateText}
                  </pre>
                  <p className="text-[11px] text-slate-400 italic">
                    {activeStanceObj.summary}
                  </p>
                </div>

                {/* Standard Protections Guaranteed */}
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-2">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Market Protections Built Into Benchmark
                  </span>
                  <ul className="space-y-1.5">
                    {benchmark.standardProtections.map((prot, protIdx) => (
                      <li key={protIdx} className="text-xs text-slate-300 flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{prot}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Defects Standard Guardrails Guard Against */}
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-2">
                  <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Pitfalls Countered by this Benchmark
                  </span>
                  <ul className="space-y-1.5">
                    {benchmark.commonDefectsToLookFor.map((defect, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-300 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{defect}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Word Diff View */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-amber-400" />
                  Comparative Strike & Insertion Redline against Market Standard
                </span>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-red-400">
                    <span className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-800 line-through">Struck Term</span>
                    (In Your Clause, Absent in Benchmark)
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">Standard Language</span>
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-5 border border-slate-800 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                {isOmission ? (
                  <div className="text-amber-400 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <p className="font-semibold mb-1">Clause Entirely Omitted in Current Instrument</p>
                    <p className="text-xs text-slate-300">
                      Your current contract lacks this covenant entirely. Below is the industry-standard boilerplate to insert:
                    </p>
                    <pre className="mt-3 text-xs text-emerald-300 font-mono whitespace-pre-wrap">
                      {activeBoilerplateText}
                    </pre>
                  </div>
                ) : (
                  <div>
                    {wordDiff.map((token, i) => {
                      if (token.type === 'removed') {
                        return (
                          <span
                            key={i}
                            className="bg-red-950/90 text-red-300 line-through px-1 py-0.5 rounded mx-0.5 border border-red-800/60 font-medium"
                          >
                            {token.text}
                          </span>
                        );
                      }
                      return <span key={i} className="text-slate-300">{token.text}</span>;
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Target Benchmark Language for Counter-Proposal
                </span>
                <pre className="text-xs text-emerald-300/90 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap select-all">
                  {activeBoilerplateText}
                </pre>
              </div>
            </div>
          )}

          {/* 3. Key Gap Breakdown & Comparison Grid */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Comprehensive Market Alignment Audit
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Mutuality Assessment</span>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="text-slate-200">Current: {clause.party_favored}</span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-emerald-400">Mutual</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {analysis.mutualityStatus.isAligned ? 'Balanced bilateral allocation' : 'One-sided unilateral tilt'}
                </p>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Market Standard Standardizer</span>
                <div className="font-semibold text-slate-200">
                  {benchmark.governingStandard}
                </div>
                <p className="text-[11px] text-slate-400">
                  Widely accepted commercial baseline
                </p>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Strategic Negotiation Leverage</span>
                <div className="font-semibold text-amber-400">
                  High Reversion Potential
                </div>
                <p className="text-[11px] text-slate-400">
                  Counter-parties routinely accept standard boilerplate
                </p>
              </div>
            </div>

            {analysis.keyGaps.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Identified Gaps Between Current Clause and Market Baseline:
                </span>
                <div className="space-y-1.5">
                  {analysis.keyGaps.map((gap, gIdx) => (
                    <div key={gIdx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadReport}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700/80 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Download Report (.md)</span>
            </button>
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              ESC to close
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyBenchmark}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              {copiedBenchmark ? (
                <>
                  <Check className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copied Boilerplate</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-950" />
                  <span>Copy Benchmark Boilerplate</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
