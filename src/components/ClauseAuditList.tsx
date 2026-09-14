import React, { useState } from 'react';
import { CriticalClauseAudit, RiskLevel } from '../types';
import { verifyCitation } from '../utils/citationMatcher';
import { RedlineDiffViewer } from './RedlineDiffViewer';
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
  Sparkles
} from 'lucide-react';

interface ClauseAuditListProps {
  clauses: CriticalClauseAudit[];
  documentText?: string;
  onLocateInSource?: (clauseId: string) => void;
}

export const ClauseAuditList: React.FC<ClauseAuditListProps> = ({ 
  clauses, 
  documentText = '',
  onLocateInSource 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(clauses.map(c => c.clause_category)))];

  const filteredClauses = clauses.filter(clause => {
    const matchesCategory = selectedCategory === 'ALL' || clause.clause_category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesRisk = selectedRisk === 'ALL' || clause.risk_level === selectedRisk;
    const matchesSearch = 
      clause.clause_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.clause_category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.plain_english_meaning.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.verbatim_quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.proposed_redline.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesRisk && matchesSearch;
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

  return (
    <div className="space-y-6">
      {/* Controls Bar: Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="clause-search-input"
            type="text"
            placeholder="Search clauses, citations, redlines, keywords..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="clause-category-select"
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

          <span className="text-xs text-slate-400 pl-2">
            Showing <strong className="text-slate-200">{filteredClauses.length}</strong> of {clauses.length} clauses
          </span>
        </div>
      </div>

      {/* Clause Cards */}
      <div className="space-y-5">
        {filteredClauses.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
            <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm">No clauses found matching your filter criteria.</p>
          </div>
        ) : (
          filteredClauses.map((clause, idx) => {
            const riskConfig = getRiskBadge(clause.risk_level);
            const isOmission = clause.verbatim_quote.includes('[OMISSION DETECTED]');
            const matchInfo = documentText ? verifyCitation(documentText, clause.verbatim_quote) : null;

            return (
              <div
                key={idx}
                id={`clause-card-${idx}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl overflow-hidden transition shadow-sm"
              >
                {/* Header Strip */}
                <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      {clause.clause_id}
                    </span>
                    <span className="text-xs font-medium text-slate-300 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/50">
                      {clause.clause_category}
                    </span>
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

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-slate-500" />
                      Favors: <strong className="text-slate-200">{clause.party_favored}</strong>
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskConfig.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${riskConfig.dot}`} />
                      {riskConfig.label}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4">
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

                  {/* 4. Precision Redline Diff Component */}
                  <div>
                    <RedlineDiffViewer
                      clauseId={clause.clause_id}
                      originalQuote={clause.verbatim_quote}
                      proposedRedline={clause.proposed_redline}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
