import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Layers, 
  Filter, 
  Copy, 
  Check, 
  ArrowUpRight, 
  ChevronRight, 
  ShieldAlert, 
  Info, 
  Eye, 
  Bookmark,
  FileText,
  CornerDownRight,
  HelpCircle
} from 'lucide-react';
import { GlossaryCategory, GlossaryTerm } from '../types';
import { parseDocumentGlossary } from '../utils/legalGlossaryParser';

interface LegalGlossaryViewProps {
  documentText: string;
  documentTitle?: string;
  onLocateInSource?: (lineNumber: number) => void;
}

export const LegalGlossaryView: React.FC<LegalGlossaryViewProps> = ({
  documentText,
  documentTitle = 'Current Agreement',
  onLocateInSource
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [activeOccurrenceLine, setActiveOccurrenceLine] = useState<number | null>(null);
  const [copiedTerm, setCopiedTerm] = useState<boolean>(false);
  const [highlightAll, setHighlightAll] = useState<boolean>(true);

  const documentViewerRef = useRef<HTMLDivElement>(null);

  // Parse document for legal glossary terms
  const glossaryData = useMemo(() => {
    return parseDocumentGlossary(documentText);
  }, [documentText]);

  // Categories present in this document
  const availableCategories = useMemo(() => {
    const cats = new Set<GlossaryCategory>();
    glossaryData.terms.forEach(t => cats.add(t.category));
    return Array.from(cats);
  }, [glossaryData]);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    return glossaryData.terms.filter(item => {
      const matchesCategory = selectedCategoryId === 'ALL' || item.category === selectedCategoryId;
      const matchesSearch = !searchTerm.trim() || 
        item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.canonicalTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.plainEnglishDefinition.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [glossaryData, selectedCategoryId, searchTerm]);

  // Default selection
  useEffect(() => {
    if (filteredTerms.length > 0 && !selectedTermId) {
      setSelectedTermId(filteredTerms[0].id);
    } else if (filteredTerms.length > 0 && !filteredTerms.some(t => t.id === selectedTermId)) {
      setSelectedTermId(filteredTerms[0].id);
    }
  }, [filteredTerms, selectedTermId]);

  const activeTerm = useMemo(() => {
    return glossaryData.terms.find(t => t.id === selectedTermId) || filteredTerms[0] || null;
  }, [glossaryData, selectedTermId, filteredTerms]);

  // Scroll to active line in document viewer
  const scrollToLine = (lineNo: number) => {
    setActiveOccurrenceLine(lineNo);
    const el = document.getElementById(`glossary-line-${lineNo}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCopyDefinition = () => {
    if (!activeTerm) return;
    const text = [
      `LEGAL JARGON: ${activeTerm.term}`,
      `Category: ${activeTerm.category} (${activeTerm.riskSeverity} Risk)`,
      ``,
      `PLAIN ENGLISH DEFINITION:`,
      activeTerm.plainEnglishDefinition,
      ``,
      `WHY COUNTERPARTIES USE IT:`,
      activeTerm.whyPartiesUseIt,
      ``,
      `HIDDEN PITFALL & RISK:`,
      activeTerm.hiddenPitfallOrRisk,
      ``,
      `PRO NEGOTIATION TIPS:`,
      activeTerm.proTipsForNegotiation
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedTerm(true);
    setTimeout(() => setCopiedTerm(false), 2000);
  };

  // Render text line with clickable term highlights
  const renderHighlightedLine = (line: string, lineNo: number) => {
    if (!line) return <span className="opacity-0">.</span>;
    if (!highlightAll || glossaryData.terms.length === 0) {
      return <span>{line}</span>;
    }

    // Build regex from all matched terms
    const termMap: Record<string, GlossaryTerm> = {};
    glossaryData.terms.forEach(t => {
      termMap[t.canonicalTerm.toLowerCase()] = t;
    });

    const parts = line.split(/(\b[A-Za-z0-9'-]+\b)/g);

    return (
      <>
        {parts.map((part, pIdx) => {
          const lowerPart = part.toLowerCase();
          // Check if part matches any canonical term or word
          const matchedTerm = glossaryData.terms.find(t => {
            return t.canonicalTerm.toLowerCase() === lowerPart ||
                   t.canonicalTerm.toLowerCase().split(' ').includes(lowerPart);
          });

          if (matchedTerm) {
            const isCurrentActive = activeTerm?.id === matchedTerm.id;
            return (
              <button
                key={pIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTermId(matchedTerm.id);
                  setActiveOccurrenceLine(lineNo);
                }}
                className={`inline-block font-semibold px-1 py-0.5 rounded cursor-pointer transition underline decoration-amber-400/60 ${
                  isCurrentActive
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-bold ring-2 ring-amber-500'
                    : 'bg-amber-500/15 text-amber-300 hover:bg-amber-400 hover:text-slate-950'
                }`}
                title={`Click to define: ${matchedTerm.canonicalTerm}`}
              >
                {part}
              </button>
            );
          }
          return <span key={pIdx}>{part}</span>;
        })}
      </>
    );
  };

  const getRiskBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  const lines = useMemo(() => documentText.split('\n'), [documentText]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white font-['Cinzel',serif] tracking-tight">
                  Legal Jargon & Plain-English Glossary
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                  {glossaryData.terms.length} Terms Identified
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
                Automatically deconstructs archaic legal phrasing, Latin doctrines, and ambiguous boilerplate across <strong className="text-slate-200">{documentTitle}</strong> into actionable, plain-English translations.
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setHighlightAll(!highlightAll)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                highlightAll 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{highlightAll ? 'Highlights: Active' : 'Highlights: Off'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyDefinition}
              disabled={!activeTerm}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedTerm ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedTerm ? 'Copied' : 'Copy Plain English'}</span>
            </button>
          </div>
        </div>

        {/* Filter Strip & Search Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Chips */}
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <button
              type="button"
              onClick={() => setSelectedCategoryId('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                selectedCategoryId === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Categories ({glossaryData.terms.length})
            </button>
            {availableCategories.map(cat => {
              const count = glossaryData.terms.filter(t => t.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                    selectedCategoryId === cat
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search glossary terms..."
              className="w-full pl-8 pr-3 py-1 bg-slate-950 text-slate-200 placeholder-slate-500 text-xs rounded-lg border border-slate-800 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Two-Pane Grid: Left Glossary Term Dictionary & Right Interactive Document Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[680px]">
        {/* Left Column: Glossary List & Plain-English Deep Dive (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Scrollable Term Selection List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 max-h-[320px] overflow-y-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono block px-1">
              Select Jargon Term to Deconstruct
            </span>

            {filteredTerms.length === 0 ? (
              <p className="text-xs text-slate-500 p-4 text-center">
                No matching legal jargon terms found in this category.
              </p>
            ) : (
              <div className="space-y-1">
                {filteredTerms.map(term => {
                  const isSelected = term.id === activeTerm?.id;
                  return (
                    <div
                      key={term.id}
                      onClick={() => {
                        setSelectedTermId(term.id);
                        if (term.occurrences.length > 0) {
                          scrollToLine(term.occurrences[0].lineNumber);
                        }
                      }}
                      className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between gap-2 border ${
                        isSelected 
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-sm' 
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                            {term.term}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${getRiskBadge(term.riskSeverity)}`}>
                            {term.riskSeverity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {term.plainEnglishDefinition}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
                        {term.occurrenceCount}x
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Term Plain-English Deep Deconstruction Card */}
          {activeTerm && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 flex-1">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-['Cinzel',serif]">
                      {activeTerm.term}
                    </h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getRiskBadge(activeTerm.riskSeverity)}`}>
                      {activeTerm.riskSeverity} RISK
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Category: <strong className="text-slate-300">{activeTerm.category}</strong>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {activeTerm.occurrenceCount} Occurrences
                  </span>
                  <span className="text-[10px] text-slate-500 block">in loaded instrument</span>
                </div>
              </div>

              {/* 1. Plain English Meaning */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Plain-English Translation
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {activeTerm.plainEnglishDefinition}
                </p>
              </div>

              {/* 2. Hidden Pitfalls & Why Counterparties Use It */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-amber-400" />
                    Why Counterparties Insert This Jargon:
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {activeTerm.whyPartiesUseIt}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1">
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Hidden Legal Pitfall & Danger:
                  </span>
                  <p className="text-rose-200/90 leading-relaxed">
                    {activeTerm.hiddenPitfallOrRisk}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/40 space-y-1">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Pro In-House Counsel Negotiation Tip:
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {activeTerm.proTipsForNegotiation}
                  </p>
                </div>
              </div>

              {/* Document Occurrence Line Jumps */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                  Jump to Occurrences in Document Text:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {activeTerm.occurrences.map((occ, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollToLine(occ.lineNumber)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer border ${
                        activeOccurrenceLine === occ.lineNumber
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Line {occ.lineNumber}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Document View with Clickable Term Highlights (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* Viewer Toolbar */}
          <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white font-['Cinzel',serif]">
                Instrument View with Clickable Jargon Highlights
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
              <span>{lines.length} Lines</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">
                Click any highlighted term to define
              </span>
            </div>
          </div>

          {/* Active Highlight Banner */}
          {activeTerm && (
            <div className="px-5 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300 font-mono">
              <span className="flex items-center gap-1.5 truncate">
                <Bookmark className="w-3.5 h-3.5 shrink-0" />
                Active Term Focus: <strong>{activeTerm.canonicalTerm}</strong> ({activeTerm.occurrenceCount} occurrences in instrument)
              </span>
              {onLocateInSource && activeOccurrenceLine && (
                <button
                  type="button"
                  onClick={() => onLocateInSource(activeOccurrenceLine)}
                  className="text-amber-400 hover:text-amber-200 underline font-semibold flex items-center gap-1 shrink-0 ml-2"
                >
                  <span>Inspect in Dual-Pane Auditor</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Document Content with Clickable Highlights */}
          <div 
            ref={documentViewerRef}
            className="p-5 overflow-y-auto max-h-[620px] font-mono text-xs leading-relaxed space-y-1 select-text bg-slate-950/80 flex-1"
          >
            {lines.map((line, idx) => {
              const lineNo = idx + 1;
              const isTargetLine = activeOccurrenceLine === lineNo;

              return (
                <div
                  key={idx}
                  id={`glossary-line-${lineNo}`}
                  className={`flex items-start gap-3 py-1 px-2.5 rounded-sm transition ${
                    isTargetLine
                      ? 'bg-amber-500/20 text-amber-200 font-semibold ring-1 ring-amber-500/70'
                      : 'hover:bg-slate-900/50'
                  }`}
                >
                  <span className="text-[10px] text-slate-600 font-mono select-none w-7 text-right shrink-0 pt-0.5">
                    {lineNo}
                  </span>
                  <div className="flex-1 whitespace-pre-wrap font-sans text-xs text-slate-300">
                    {renderHighlightedLine(line, lineNo)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
