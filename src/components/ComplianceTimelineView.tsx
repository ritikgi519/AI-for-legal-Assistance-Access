import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  Zap, 
  Sparkles, 
  Layers, 
  Milestone, 
  Filter, 
  ArrowUpRight,
  HelpCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ComplianceMilestone, CriticalClauseAudit } from '../types';
import { extractComplianceTimeline, generateICSContent } from '../utils/timelineExtractor';

interface ComplianceTimelineViewProps {
  documentText: string;
  documentTitle?: string;
  clauses?: CriticalClauseAudit[];
  onNavigateToClause?: (clauseId: string) => void;
}

export const ComplianceTimelineView: React.FC<ComplianceTimelineViewProps> = ({
  documentText,
  documentTitle = 'Current Agreement',
  clauses = [],
  onNavigateToClause
}) => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'CRITICAL' | 'RENEWAL' | 'PAYMENT'>('ALL');
  const [copiedCalendar, setCopiedCalendar] = useState<boolean>(false);
  const [downloadedICS, setDownloadedICS] = useState<boolean>(false);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Extract timeline data from document
  const timelineData = useMemo(() => {
    return extractComplianceTimeline(documentText, clauses);
  }, [documentText, clauses]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    if (activeFilter === 'CRITICAL') {
      return timelineData.milestones.filter(m => m.urgency === 'CRITICAL' || m.isTrapClause);
    }
    if (activeFilter === 'RENEWAL') {
      return timelineData.milestones.filter(m => m.category === 'RENEWAL' || m.category === 'TERMINATION');
    }
    if (activeFilter === 'PAYMENT') {
      return timelineData.milestones.filter(m => m.category === 'PAYMENT');
    }
    return timelineData.milestones;
  }, [timelineData, activeFilter]);

  // Set initial selected milestone
  useEffect(() => {
    if (filteredMilestones.length > 0 && !selectedMilestoneId) {
      // Prefer critical trap milestone if present, otherwise first
      const trap = filteredMilestones.find(m => m.isTrapClause) || filteredMilestones[0];
      setSelectedMilestoneId(trap.id);
    } else if (filteredMilestones.length > 0 && !filteredMilestones.find(m => m.id === selectedMilestoneId)) {
      setSelectedMilestoneId(filteredMilestones[0].id);
    }
  }, [filteredMilestones, selectedMilestoneId]);

  const activeMilestone = useMemo(() => {
    return timelineData.milestones.find(m => m.id === selectedMilestoneId) || filteredMilestones[0] || null;
  }, [timelineData, selectedMilestoneId, filteredMilestones]);

  const activeIndex = filteredMilestones.findIndex(m => m.id === activeMilestone?.id);

  // Navigation handlers
  const handlePrev = () => {
    if (activeIndex > 0) {
      setSelectedMilestoneId(filteredMilestones[activeIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (activeIndex < filteredMilestones.length - 1) {
      setSelectedMilestoneId(filteredMilestones[activeIndex + 1].id);
    }
  };

  // Export iCalendar (.ics) file
  const handleDownloadICS = () => {
    const icsContent = generateICSContent(timelineData.milestones, documentTitle);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_milestones_${documentTitle.replace(/\s+/g, '_').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadedICS(true);
    setTimeout(() => setDownloadedICS(false), 2500);
  };

  // Copy structured markdown agenda
  const handleCopySummary = () => {
    const text = [
      `# COMPLIANCE & DEADLINE LIFECYCLE TIMELINE`,
      `Agreement: ${documentTitle}`,
      `Effective Date: ${timelineData.effectiveDateStr}`,
      `Initial Term Horizon: ${timelineData.initialTermMonths} Months | Successive Renewal: ${timelineData.renewalTermMonths} Months`,
      ``,
      `--- CRITICAL DEADLINES & ACTION CHECKLIST ---`,
      ...timelineData.milestones.map((m, idx) => (
        `[${idx + 1}] ${m.dateLabel} - ${m.title} (${m.urgency})\n` +
        `   • Clause: ${m.clauseReference || 'General'}\n` +
        `   • Action Required: ${m.actionRequired}\n` +
        `   • Risk if Missed: ${m.consequenceIfMissed}\n`
      ))
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedCalendar(true);
    setTimeout(() => setCopiedCalendar(false), 2000);
  };

  // Horizontal scroll controls for timeline track
  const scrollTrack = (direction: 'left' | 'right') => {
    if (!timelineScrollRef.current) return;
    const offset = direction === 'left' ? -280 : 280;
    timelineScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const getUrgencyBadge = (urgency: string, isTrap?: boolean) => {
    if (isTrap) {
      return {
        label: 'CRITICAL TRAP',
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        nodeBg: 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-900/50'
      };
    }
    switch (urgency) {
      case 'CRITICAL':
        return {
          label: 'CRITICAL',
          bg: 'bg-red-500/20 text-red-300 border-red-500/40',
          nodeBg: 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-900/50'
        };
      case 'HIGH':
        return {
          label: 'HIGH PRIORITY',
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          nodeBg: 'bg-amber-500 border-amber-300 text-slate-950 shadow-lg shadow-amber-900/40'
        };
      case 'MEDIUM':
        return {
          label: 'OPERATIONAL',
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          nodeBg: 'bg-blue-600 border-blue-400 text-white'
        };
      default:
        return {
          label: 'COMMENCEMENT',
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          nodeBg: 'bg-emerald-600 border-emerald-400 text-white'
        };
    }
  };

  // Count trap milestones
  const trapCount = timelineData.milestones.filter(m => m.isTrapClause).length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Milestone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white font-['Cinzel',serif] tracking-tight">
                  Compliance & Deadline Lifecycle Timeline
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                  {timelineData.milestones.length} Milestones Extracted
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans leading-relaxed">
                Horizontal chronological mapping of effective commencement dates, payment windows, auto-renewal trap cutoffs, and post-termination survival obligations for <strong className="text-slate-200">{documentTitle}</strong>.
              </p>
            </div>
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadICS}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Download iCalendar file to import into Google Calendar or Outlook"
            >
              {downloadedICS ? <Check className="w-3.5 h-3.5 text-white" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadedICS ? 'ICS Saved' : 'Export Calendar (.ics)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="Copy markdown agenda checklist to clipboard"
            >
              {copiedCalendar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedCalendar ? 'Copied' : 'Copy Agenda'}</span>
            </button>
          </div>
        </div>

        {/* Milestone Quick Stats Strip */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Commencement: <strong className="text-white">{timelineData.effectiveDateStr}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Initial Term: <strong className="text-white">{timelineData.initialTermMonths} Months</strong>
            </span>
            {trapCount > 0 && (
              <span className="flex items-center gap-1.5 text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded border border-rose-800/60">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <strong>{trapCount} Critical Trap Cutoffs Identified</strong>
              </span>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <Filter className="w-3 h-3 text-slate-500 ml-1 mr-0.5" />
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                activeFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({timelineData.milestones.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('CRITICAL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                activeFilter === 'CRITICAL' ? 'bg-rose-500 text-white font-bold' : 'text-rose-400 hover:text-rose-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Traps ({timelineData.milestones.filter(m => m.urgency === 'CRITICAL' || m.isTrapClause).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('RENEWAL')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                activeFilter === 'RENEWAL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Term & Renewal
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('PAYMENT')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                activeFilter === 'PAYMENT' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Payment
            </button>
          </div>
        </div>
      </div>

      {/* Visual Horizontal Timeline Axis */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <Milestone className="w-4 h-4" />
              Interactive Horizontal Chronology Track
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              (Click any milestone node to inspect legal obligations)
            </span>
          </div>

          {/* Track Horizontal Pan Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollTrack('left')}
              aria-label="Scroll timeline left"
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollTrack('right')}
              aria-label="Scroll timeline right"
              className="p-1 rounded-md bg-slate-800 hover:bg-slate-750 text-slate-300 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Scrollable Horizontal Timeline Canvas */}
        <div 
          ref={timelineScrollRef}
          className="overflow-x-auto pb-6 pt-8 px-4 select-none scrollbar-thin scrollbar-thumb-slate-700"
        >
          <div className="relative min-w-[860px] max-w-full mx-auto py-8">
            {/* Background Phase Bands */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-14 bg-slate-950/60 rounded-xl border border-slate-800/80 flex overflow-hidden pointer-events-none">
              <div className="w-[20%] border-r border-slate-800/80 bg-emerald-950/10 flex items-center justify-center">
                <span className="text-[10px] text-emerald-400/80 font-mono tracking-wider font-semibold">
                  EXECUTION & BILLING
                </span>
              </div>
              <div className="w-[45%] border-r border-slate-800/80 bg-slate-900/30 flex items-center justify-center">
                <span className="text-[10px] text-slate-400 font-mono tracking-wider font-semibold">
                  ACTIVE INITIAL TERM (MONTHS 1-32)
                </span>
              </div>
              <div className="w-[20%] border-r border-slate-800/80 bg-rose-950/20 flex items-center justify-center">
                <span className="text-[10px] text-rose-400 font-mono tracking-wider font-semibold animate-pulse">
                  TRAP WINDOW (M32-36)
                </span>
              </div>
              <div className="w-[15%] bg-indigo-950/15 flex items-center justify-center">
                <span className="text-[10px] text-indigo-400/80 font-mono tracking-wider font-semibold">
                  AUTO-RENEWAL
                </span>
              </div>
            </div>

            {/* Central Linear Vector Axis */}
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-emerald-500 via-amber-500 via-rose-500 to-indigo-500 rounded-full shadow-sm" />

            {/* Milestone Nodes Spaced Proportionally along the Axis */}
            <div className="relative flex justify-between items-center z-10">
              {timelineData.milestones.map((milestone, idx) => {
                const isSelected = milestone.id === activeMilestone?.id;
                const badge = getUrgencyBadge(milestone.urgency, milestone.isTrapClause);
                const isEven = idx % 2 === 0;

                return (
                  <div
                    key={milestone.id}
                    onClick={() => setSelectedMilestoneId(milestone.id)}
                    className="flex flex-col items-center cursor-pointer group relative"
                    style={{ flex: 1 }}
                  >
                    {/* Upper Callout Label (for even nodes) */}
                    {isEven && (
                      <div className={`mb-3 text-center transition group-hover:-translate-y-1 ${isSelected ? '-translate-y-1' : ''}`}>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold block whitespace-nowrap shadow-md ${
                          isSelected 
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold ring-2 ring-amber-400/50'
                            : badge.bg
                        }`}>
                          {milestone.dateLabel}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-200 mt-1 block max-w-[130px] truncate">
                          {milestone.title}
                        </span>
                      </div>
                    )}

                    {/* Milestone Center Node on the Vector Axis */}
                    <div className="relative">
                      {isSelected && (
                        <div className="absolute -inset-2 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
                      )}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition transform group-hover:scale-110 shadow-lg ${
                          badge.nodeBg
                        } ${isSelected ? 'ring-4 ring-amber-400/60 scale-110' : ''}`}
                      >
                        {milestone.isTrapClause ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : milestone.category === 'EFFECTIVE' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : milestone.category === 'PAYMENT' ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <Milestone className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Lower Callout Label (for odd nodes) */}
                    {!isEven && (
                      <div className={`mt-3 text-center transition group-hover:translate-y-1 ${isSelected ? 'translate-y-1' : ''}`}>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold block whitespace-nowrap shadow-md ${
                          isSelected 
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold ring-2 ring-amber-400/50'
                            : badge.bg
                        }`}>
                          {milestone.dateLabel}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-200 mt-1 block max-w-[130px] truncate">
                          {milestone.title}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Milestone Detail Deconstruction Inspector */}
        {activeMilestone && (
          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-5">
            {/* Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold font-mono px-3 py-1 rounded-md border flex items-center gap-1.5 ${getUrgencyBadge(activeMilestone.urgency, activeMilestone.isTrapClause).bg}`}>
                  {activeMilestone.isTrapClause && <AlertTriangle className="w-3.5 h-3.5" />}
                  {getUrgencyBadge(activeMilestone.urgency, activeMilestone.isTrapClause).label}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {activeMilestone.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span className="text-amber-400 font-mono font-semibold">{activeMilestone.dateLabel}</span>
                    <span>•</span>
                    <span>Phase: <strong className="text-slate-300">{activeMilestone.phase}</strong></span>
                    {activeMilestone.clauseReference && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-indigo-300">{activeMilestone.clauseReference}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Prev / Next Milestone Navigation Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={activeIndex <= 0}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-xs font-medium flex items-center gap-1 transition"
                  aria-label="Previous milestone"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
                <span className="text-xs text-slate-400 font-mono px-2">
                  {activeIndex + 1} / {filteredMilestones.length}
                </span>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={activeIndex >= filteredMilestones.length - 1}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-200 text-xs font-medium flex items-center gap-1 transition"
                  aria-label="Next milestone"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Strategic Action Required vs Consequence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Action Required */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Mandatory Legal & Operational Action:
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {activeMilestone.actionRequired}
                </p>
              </div>

              {/* Severe Consequence if Missed */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Risk & Consequence if Deadline Breached:
                </span>
                <p className="text-xs sm:text-sm text-rose-200/90 leading-relaxed font-sans">
                  {activeMilestone.consequenceIfMissed}
                </p>
              </div>
            </div>

            {/* Verbatim Contract Quote & Explanation */}
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Source Covenant Extract ({activeMilestone.clauseReference || 'Instrument Clause'})
                </span>
                {onNavigateToClause && activeMilestone.clauseReference && (
                  <button
                    type="button"
                    onClick={() => onNavigateToClause(activeMilestone.clauseReference || '')}
                    className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1 underline transition cursor-pointer"
                  >
                    <span>Inspect in Dual-Pane Auditor</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <blockquote className="text-xs sm:text-sm font-mono text-slate-300 border-l-2 border-amber-500 pl-3.5 py-0.5 leading-relaxed whitespace-pre-wrap">
                "{activeMilestone.verbatimQuote || activeMilestone.description}"
              </blockquote>
              <p className="text-xs text-slate-400 leading-relaxed">
                {activeMilestone.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chronological Milestone Ledger Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-['Cinzel',serif]">
              Complete Chronological Milestone Matrix
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {timelineData.milestones.length} Sequential Events
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {timelineData.milestones.map((m, idx) => {
            const isSelected = m.id === activeMilestone?.id;
            const badge = getUrgencyBadge(m.urgency, m.isTrapClause);

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMilestoneId(m.id)}
                className={`p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition cursor-pointer ${
                  isSelected ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-500 w-5">
                      #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {m.title}
                    </span>
                    {m.clauseReference && (
                      <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-800">
                        {m.clauseReference}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed pl-7">
                    {m.actionRequired}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 pl-7 md:pl-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-300 block">
                      {m.dateLabel}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {m.phase}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-500 transition ${isSelected ? 'text-amber-400 translate-x-1' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
