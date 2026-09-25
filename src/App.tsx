/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { SAMPLE_CONTRACTS } from './data/sampleContracts';
import { LexisenseAnalysisResult, SampleContract, SearchResultItem } from './types';
import { Header } from './components/Header';
import { FairnessGauge } from './components/FairnessGauge';
import { ClauseAuditList } from './components/ClauseAuditList';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { AttorneyDossier } from './components/AttorneyDossier';
import { DocumentModal } from './components/DocumentModal';
import { ExportModal } from './components/ExportModal';
import { SourceViewerModal } from './components/SourceViewerModal';
import { SplitViewAuditor } from './components/SplitViewAuditor';
import { ComplianceTimelineView } from './components/ComplianceTimelineView';
import { LegalGlossaryView } from './components/LegalGlossaryView';
import { AlignmentRubricModal } from './components/AlignmentRubricModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RiskRadarView } from './components/RiskRadarView';
import { CuratedDossierSidebar } from './components/CuratedDossierSidebar';
import { 
  PinnedDossierItem, 
  DossierPriority, 
  loadPinnedDossier, 
  savePinnedDossier, 
  togglePinClause, 
  updatePinnedItemNote, 
  updatePinnedItemPriority, 
  removePinnedItem 
} from './utils/pinnedDossierTracker';
import { CriticalClauseAudit } from './types';
import { 
  FileCheck, 
  Zap, 
  Briefcase, 
  FileText, 
  Sparkles, 
  Upload, 
  ShieldCheck, 
  Scale, 
  Layers,
  CheckCircle,
  ExternalLink,
  Info,
  Split,
  Crosshair,
  Calendar,
  BookOpen,
  Radar,
  Pin
} from 'lucide-react';

export default function App() {
  // Initialize with the first sample contract (Enterprise Cloud SaaS MSA)
  const defaultSample = SAMPLE_CONTRACTS[0];
  const [analysis, setAnalysis] = useState<LexisenseAnalysisResult | null>(defaultSample.presetAnalysis || null);
  const [currentDocumentText, setCurrentDocumentText] = useState<string>(defaultSample.content);
  const [currentDocTitle, setCurrentDocTitle] = useState<string>(defaultSample.title);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(defaultSample.id);

  // Modals & UI states
  const [activeTab, setActiveTab] = useState<'split' | 'clauses' | 'radar' | 'stress' | 'dossier' | 'timeline' | 'glossary'>('split');
  const [focusedClauseId, setFocusedClauseId] = useState<string | null>(null);
  const [isDocModalOpen, setIsDocModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState<boolean>(false);
  const [isAlignmentModalOpen, setIsAlignmentModalOpen] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [copiedDossier, setCopiedDossier] = useState<boolean>(false);

  // Curated consultation dossier state & sidebar visibility
  const [pinnedDossier, setPinnedDossier] = useState<Record<string, PinnedDossierItem>>(() =>
    loadPinnedDossier(defaultSample.title)
  );
  const [isDossierSidebarOpen, setIsDossierSidebarOpen] = useState<boolean>(false);

  // Handle selecting one of the pre-loaded benchmark contracts
  const handleSelectSample = useCallback((sample: SampleContract) => {
    setSelectedSampleId(sample.id);
    setCurrentDocumentText(sample.content);
    setCurrentDocTitle(sample.title);
    if (sample.presetAnalysis) {
      setAnalysis(sample.presetAnalysis);
    }
    setPinnedDossier(loadPinnedDossier(sample.title));
    setAnalysisError(null);
  }, []);

  // Handle analyzing custom text via Gemini backend
  const handleAnalyzeDocument = useCallback(async (text: string, title: string, perspective: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: text,
          perspective
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server returned error ${response.status}`);
      }

      const result: LexisenseAnalysisResult = await response.json();
      const docTitleToUse = title || result.document_overview.document_title;
      setAnalysis(result);
      setCurrentDocumentText(text);
      setCurrentDocTitle(docTitleToUse);
      setPinnedDossier(loadPinnedDossier(docTitleToUse));
      setSelectedSampleId('');
      setIsDocModalOpen(false);
      setActiveTab('clauses');
    } catch (err: unknown) {
      console.error('Lexisense Analysis Failure:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to complete document deconstruction.';
      setAnalysisError(errMsg);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Curated dossier handlers
  const handleTogglePin = useCallback((clause: CriticalClauseAudit) => {
    setPinnedDossier(prev => {
      const { updated } = togglePinClause(prev, clause);
      savePinnedDossier(currentDocTitle, updated);
      return updated;
    });
  }, [currentDocTitle]);

  const handleUpdatePinnedNote = useCallback((clauseId: string, note: string) => {
    setPinnedDossier(prev => {
      const updated = updatePinnedItemNote(prev, clauseId, note);
      savePinnedDossier(currentDocTitle, updated);
      return updated;
    });
  }, [currentDocTitle]);

  const handleUpdatePinnedPriority = useCallback((clauseId: string, priority: DossierPriority) => {
    setPinnedDossier(prev => {
      const updated = updatePinnedItemPriority(prev, clauseId, priority);
      savePinnedDossier(currentDocTitle, updated);
      return updated;
    });
  }, [currentDocTitle]);

  const handleRemovePinnedItem = useCallback((clauseId: string) => {
    setPinnedDossier(prev => {
      const updated = removePinnedItem(prev, clauseId);
      savePinnedDossier(currentDocTitle, updated);
      return updated;
    });
  }, [currentDocTitle]);

  const handleClearAllPinned = useCallback(() => {
    setPinnedDossier({});
    savePinnedDossier(currentDocTitle, {});
  }, [currentDocTitle]);

  // Quick copy attorney briefing
  const handleCopyDossier = useCallback(() => {
    if (!analysis) return;
    const dossier = analysis.lawyer_consultation_dossier;
    const brief = `# ATTORNEY CONSULTATION BRIEFING
Generated by Lexisense Legal Intelligence Engine
Document: ${analysis.document_overview.document_title}
Document Fairness Index (DFI): ${analysis.document_overview.fairness_index}/100

## TOP RED FLAGS FOR DISCUSSION
${dossier.top_red_flags_for_discussion.map((rf, i) => `${i + 1}. ${rf}`).join('\n')}

## HIGH-LEVERAGE QUESTIONS FOR COUNSEL
${dossier.high_leverage_questions_for_counsel.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## SUGGESTED WALKAWAY TERMS
${dossier.suggested_walkaway_terms.map((w, i) => `- ${w}`).join('\n')}

---
${analysis.statutory_disclaimer}
`;
    navigator.clipboard.writeText(brief);
    setCopiedDossier(true);
    setTimeout(() => setCopiedDossier(false), 2000);
  }, [analysis]);

  // Handle selecting a search result item from the global semantic search bar
  const handleSelectSearchResult = useCallback((result: SearchResultItem) => {
    const destinationTab = result.targetTab || (result.clauseId ? 'clauses' : 'clauses');
    setActiveTab(destinationTab);
    if (result.clauseId) {
      setFocusedClauseId(result.clauseId);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Accessible Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-950 focus:font-bold focus:rounded-lg focus:shadow-xl focus:ring-2 focus:ring-amber-300 focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Screen Reader Status Announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {isAnalyzing ? 'Analyzing document...' : `Loaded document: ${currentDocTitle}. Active tab: ${activeTab}.`}
      </div>

      {/* Top Navigation */}
      <Header
        onOpenNewAnalysis={() => setIsDocModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onCopyDossier={handleCopyDossier}
        onOpenAlignmentModal={() => setIsAlignmentModalOpen(true)}
        copiedDossier={copiedDossier}
        hasAnalysis={!!analysis}
        analysis={analysis}
        activeDocTitle={currentDocTitle}
        documentText={currentDocumentText}
        onSelectSearchResult={handleSelectSearchResult}
      />

      {/* Benchmark Selector Bar */}
      <nav aria-label="Benchmark Documents" className="bg-slate-900/60 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div role="group" aria-label="Sample Contracts" className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              Benchmarks:
            </span>
            {SAMPLE_CONTRACTS.map(sample => (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                aria-pressed={selectedSampleId === sample.id}
                aria-label={`Load benchmark contract: ${sample.title}`}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap font-medium transition cursor-pointer shrink-0 border focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                  selectedSampleId === sample.id
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {sample.title}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setIsSourceModalOpen(true)}
              aria-label="View raw source instrument text"
              className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none rounded px-1.5 py-0.5"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
              <span>View Source Text</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <ErrorBoundary fallbackTitle="Contract Audit Workspace Intercepted">
        <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 focus:outline-none">
        {analysis ? (
          <>
            {/* 1. Document Overview & Document Fairness Index Gauge */}
            <FairnessGauge
              overview={analysis.document_overview}
              clauses={analysis.critical_clause_audit}
              onOpenRiskRadar={() => setActiveTab('radar')}
            />

            {/* 2. Interactive Navigation Tabs */}
            <div className="border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <nav role="tablist" aria-label="Contract Analysis Modules" className="flex space-x-1 sm:space-x-4">
                <button
                  id="tab-split"
                  role="tab"
                  aria-selected={activeTab === 'split'}
                  aria-controls="panel-split"
                  onClick={() => setActiveTab('split')}
                  className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    activeTab === 'split'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Split className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Dual-Pane Citation Inspector</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono">
                    Ground Truth
                  </span>
                </button>

                <button
                  id="tab-clauses"
                  role="tab"
                  aria-selected={activeTab === 'clauses'}
                  aria-controls="panel-clauses"
                  onClick={() => setActiveTab('clauses')}
                  className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    activeTab === 'clauses'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Clause Audit Cards</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                    {analysis.critical_clause_audit.length}
                  </span>
                </button>

                <button
                  id="tab-radar"
                  role="tab"
                  aria-selected={activeTab === 'radar'}
                  aria-controls="panel-radar"
                  onClick={() => setActiveTab('radar')}
                  className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    activeTab === 'radar'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Radar className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Risk Radar</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-950/80 text-rose-300 border border-rose-800/60 font-mono">
                    D3 Matrix
                  </span>
                </button>

                <button
                  id="tab-stress"
                  role="tab"
                  aria-selected={activeTab === 'stress'}
                  aria-controls="panel-stress"
                  onClick={() => setActiveTab('stress')}
                  className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    activeTab === 'stress'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>"What-If" Stress-Tests</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                    {analysis.what_if_stress_tests.length}
                  </span>
                </button>

                <button
                  id="tab-dossier"
                  role="tab"
                  aria-selected={activeTab === 'dossier'}
                  aria-controls="panel-dossier"
                  onClick={() => setActiveTab('dossier')}
                  className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    activeTab === 'dossier'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                  <span>Attorney Dossier</span>
                  {Object.keys(pinnedDossier).length > 0 ? (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                      {Object.keys(pinnedDossier).length} Curated
                    </span>
                  ) : (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                      High Leverage
                    </span>
                  )}
                </button>

                <button
                  id="tab-timeline"
                  role="tab"
                  aria-selected={activeTab === 'timeline'}
                  aria-controls="panel-timeline"
                  onClick={() => setActiveTab('timeline')}
                  className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    activeTab === 'timeline'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Compliance Timeline</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono">
                    Deadlines
                  </span>
                </button>

                <button
                  id="tab-glossary"
                  role="tab"
                  aria-selected={activeTab === 'glossary'}
                  aria-controls="panel-glossary"
                  onClick={() => setActiveTab('glossary')}
                  className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
                    activeTab === 'glossary'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Legal Glossary</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-medium">
                    Plain English
                  </span>
                </button>
              </nav>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <button
                  id="btn-nav-curated-dossier"
                  type="button"
                  onClick={() => setIsDossierSidebarOpen(true)}
                  aria-label={`Open curated consultation dossier with ${Object.keys(pinnedDossier).length} pinned clauses`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                    Object.keys(pinnedDossier).length > 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-slate-200 border-slate-700'
                  }`}
                  title="View your curated consultation clauses"
                >
                  <Pin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Curated Dossier ({Object.keys(pinnedDossier).length})</span>
                </button>

                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  100% Verbatim Ground Truth Active
                </span>
              </div>
            </div>

            {/* Tab Views */}
            <div className="focus:outline-none">
              {activeTab === 'split' && (
                <section role="tabpanel" id="panel-split" aria-labelledby="tab-split" tabIndex={0} className="focus:outline-none">
                  <SplitViewAuditor
                    documentText={currentDocumentText}
                    clauses={analysis.critical_clause_audit}
                    documentTitle={analysis.document_overview.document_title || currentDocTitle}
                    focusedClauseId={focusedClauseId}
                    pinnedItems={pinnedDossier}
                    onTogglePin={handleTogglePin}
                  />
                </section>
              )}

              {activeTab === 'clauses' && (
                <section role="tabpanel" id="panel-clauses" aria-labelledby="tab-clauses" tabIndex={0} className="focus:outline-none">
                  <ClauseAuditList
                    clauses={analysis.critical_clause_audit}
                    documentText={currentDocumentText}
                    documentTitle={analysis.document_overview.document_title || currentDocTitle}
                    focusedClauseId={focusedClauseId}
                    pinnedItems={pinnedDossier}
                    onTogglePin={handleTogglePin}
                    onOpenCuratedSidebar={() => setIsDossierSidebarOpen(true)}
                    onLocateInSource={(_clauseId) => {
                      setFocusedClauseId(_clauseId);
                      setActiveTab('split');
                    }}
                  />
                </section>
              )}

              {activeTab === 'radar' && (
                <section role="tabpanel" id="panel-radar" aria-labelledby="tab-radar" tabIndex={0} className="focus:outline-none">
                  <RiskRadarView
                    clauses={analysis.critical_clause_audit}
                    docTitle={analysis.document_overview.document_title || currentDocTitle}
                    onNavigateToClause={(_clauseId) => {
                      setActiveTab('split');
                    }}
                  />
                </section>
              )}

              {activeTab === 'stress' && (
                <section role="tabpanel" id="panel-stress" aria-labelledby="tab-stress" tabIndex={0} className="focus:outline-none">
                  <WhatIfSimulator
                    tests={analysis.what_if_stress_tests}
                    documentText={currentDocumentText}
                  />
                </section>
              )}

              {activeTab === 'dossier' && (
                <section role="tabpanel" id="panel-dossier" aria-labelledby="tab-dossier" tabIndex={0} className="focus:outline-none">
                  <AttorneyDossier
                    dossier={analysis.lawyer_consultation_dossier}
                    docTitle={analysis.document_overview.document_title}
                    fairnessIndex={analysis.document_overview.fairness_index}
                    disclaimer={analysis.statutory_disclaimer}
                    partyFavored={analysis.document_overview.parties_identified?.[1] || analysis.critical_clause_audit?.[0]?.party_favored || 'Counterparty'}
                    pinnedItems={pinnedDossier}
                    onUpdateNote={handleUpdatePinnedNote}
                    onUpdatePriority={handleUpdatePinnedPriority}
                    onRemoveItem={handleRemovePinnedItem}
                    onNavigateToClause={(clauseId) => {
                      setFocusedClauseId(clauseId);
                      setActiveTab('clauses');
                    }}
                    onOpenSidebar={() => setIsDossierSidebarOpen(true)}
                  />
                </section>
              )}

              {activeTab === 'timeline' && (
                <section role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline" tabIndex={0} className="focus:outline-none">
                  <ComplianceTimelineView
                    documentText={currentDocumentText}
                    documentTitle={analysis.document_overview.document_title || currentDocTitle}
                    clauses={analysis.critical_clause_audit}
                    onNavigateToClause={(_clauseId) => {
                      setActiveTab('split');
                    }}
                  />
                </section>
              )}

              {activeTab === 'glossary' && (
                <section role="tabpanel" id="panel-glossary" aria-labelledby="tab-glossary" tabIndex={0} className="focus:outline-none">
                  <LegalGlossaryView
                    documentText={currentDocumentText}
                    documentTitle={analysis.document_overview.document_title || currentDocTitle}
                    onLocateInSource={(_lineNumber) => {
                      setActiveTab('split');
                    }}
                  />
                </section>
              )}
            </div>
          </>
        ) : (
          /* Empty State when no document loaded */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto" aria-hidden="true">
              <Scale className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white font-['Cinzel',serif]">
                No Instrument Currently Loaded
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Ingest any contract, service agreement, lease, or NDA to activate the Lexisense legal deconstruction engine.
              </p>
            </div>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold shadow-md transition cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none"
            >
              Analyze Contract Now
            </button>
          </div>
        )}
        </main>
      </ErrorBoundary>

      {/* Footer */}
      <footer role="contentinfo" className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="font-semibold text-slate-300">Lexisense Legal Intelligence & Document Deconstruction</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Automated Legal Intelligence Engine • Strictly Citation Locked • For Educational & Preparatory Purposes
          </p>
        </div>
      </footer>

      {/* Modals */}
      <DocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onAnalyze={handleAnalyzeDocument}
        onSelectSample={handleSelectSample}
        isAnalyzing={isAnalyzing}
        error={analysisError}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        analysis={analysis}
      />

      <SourceViewerModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        title={currentDocTitle}
        content={currentDocumentText}
      />

      <AlignmentRubricModal
        isOpen={isAlignmentModalOpen}
        onClose={() => setIsAlignmentModalOpen(false)}
      />

      {/* Floating Curated Consultation Dossier Trigger Button */}
      {Object.keys(pinnedDossier).length > 0 && (
        <button
          id="fab-curated-dossier"
          type="button"
          onClick={() => setIsDossierSidebarOpen(true)}
          aria-label={`Open curated consultation dossier with ${Object.keys(pinnedDossier).length} pinned clauses`}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-2xl border border-indigo-400/50 flex items-center gap-2 transition cursor-pointer hover:scale-105 active:scale-95 group"
        >
          <Pin className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span>Curated Dossier</span>
          <span className="w-5 h-5 rounded-full bg-black/40 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center">
            {Object.keys(pinnedDossier).length}
          </span>
        </button>
      )}

      {/* Curated Dossier Slide-out Sidebar Drawer */}
      <CuratedDossierSidebar
        isOpen={isDossierSidebarOpen}
        onClose={() => setIsDossierSidebarOpen(false)}
        pinnedItems={pinnedDossier}
        docTitle={analysis?.document_overview.document_title || currentDocTitle}
        dfiScore={analysis?.document_overview.fairness_index || 50}
        onUpdateNote={handleUpdatePinnedNote}
        onUpdatePriority={handleUpdatePinnedPriority}
        onRemoveItem={handleRemovePinnedItem}
        onClearAll={handleClearAllPinned}
        onNavigateToClause={(clauseId) => {
          setFocusedClauseId(clauseId);
          setActiveTab('clauses');
        }}
        onOpenFullDossierTab={() => setActiveTab('dossier')}
      />
    </div>
  );
}
