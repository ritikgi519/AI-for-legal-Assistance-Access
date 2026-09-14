import React from 'react';
import { DocumentOverview, CriticalClauseAudit } from '../types';
import { ShieldAlert, ShieldCheck, AlertOctagon, Users, FileCheck, HelpCircle } from 'lucide-react';

interface FairnessGaugeProps {
  overview: DocumentOverview;
  clauses: CriticalClauseAudit[];
  onSelectCategory?: (category: string) => void;
}

export const FairnessGauge: React.FC<FairnessGaugeProps> = ({ overview, clauses }) => {
  const score = Math.max(0, Math.min(100, overview.fairness_index));

  // Determine DFI tier and theme
  let tierName = 'Balanced / Fair Reciprocal';
  let tierDesc = 'Balanced covenants with customary mutual protections and reciprocal remedies.';
  let strokeColor = '#10b981'; // emerald-500
  let textColor = 'text-emerald-400';
  let bgBadge = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
  let Icon = ShieldCheck;

  if (score <= 40) {
    tierName = 'High Risk / Predatory / Heavily Unilateral';
    tierDesc = 'Disproportionate liabilities, asymmetric termination rights, or uncapped indemnification clauses favor the counterparty.';
    strokeColor = '#ef4444'; // red-500
    textColor = 'text-red-400';
    bgBadge = 'bg-red-500/10 border-red-500/30 text-red-300';
    Icon = ShieldAlert;
  } else if (score <= 70) {
    tierName = 'Moderate Risk / Standard Corporate Terms';
    tierDesc = 'Standard commercial terms with notable unilateral leanings that require targeted attorney redlining prior to execution.';
    strokeColor = '#f59e0b'; // amber-500
    textColor = 'text-amber-400';
    bgBadge = 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    Icon = AlertOctagon;
  }

  // Count stats
  const criticalCount = clauses.filter(c => c.risk_level === 'CRITICAL').length;
  const highCount = clauses.filter(c => c.risk_level === 'HIGH').length;
  const omissionCount = clauses.filter(c => 
    c.verbatim_quote.includes('[OMISSION DETECTED]') || 
    c.plain_english_meaning.includes('[OMISSION DETECTED]')
  ).length;

  // SVG Gauge calculations (semi-circle meter)
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  // Use 180 degrees arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * score) / 100;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
      {/* Background glow accent */}
      <div 
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ backgroundColor: strokeColor }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive DFI Dial */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 text-center">
          <div className="relative flex items-center justify-center">
            <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={arcLength}
                strokeLinecap="round"
              />
              {/* Active Meter Fill */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={strokeColor}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={arcLength}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center Score Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold tracking-tight ${textColor} font-['Cinzel',serif]`}>
                {score}
              </span>
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
                DFI Score / 100
              </span>
            </div>
          </div>

          <div className="mt-3 flex flex-col items-center">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bgBadge}`}>
              <Icon className="w-3.5 h-3.5" />
              {tierName.split('/')[0].trim()}
            </span>
            <p className="text-[11px] text-slate-400 mt-2 max-w-xs leading-relaxed">
              {tierDesc}
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-slate-800 text-center">
            <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-base font-bold text-red-400">{criticalCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">Critical</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-base font-bold text-amber-400">{highCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">High Risk</div>
            </div>
            <div className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <div className="text-base font-bold text-indigo-400">{omissionCount}</div>
              <div className="text-[10px] text-slate-400 uppercase font-medium">Omissions</div>
            </div>
          </div>
        </div>

        {/* Right: Document Meta & Executive Summary */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center gap-1.5">
                <FileCheck className="w-3 h-3 text-amber-400" />
                {overview.document_type || 'Legal Instrument'}
              </span>
              {overview.parties_identified?.map((party, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80 inline-flex items-center gap-1"
                >
                  <Users className="w-3 h-3 text-slate-400" />
                  {party}
                </span>
              ))}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Cinzel',serif]">
              {overview.document_title || 'Legal Document Analysis'}
            </h2>
          </div>

          {/* Executive Summary Card */}
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                Executive Plain-English Deconstruction
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-slate-500" />
                8th-Grade Reading Level
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {overview.executive_summary}
            </p>
          </div>

          {/* Key Rule Indicators */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span>Score &lt; 40: High Unilateral Risk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400"></div>
              <span>Score 41-70: Requires Redlines</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span>Score &gt; 70: Fair / Reciprocal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
