/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Pin, 
  Trash2, 
  Copy, 
  Check, 
  Briefcase, 
  ExternalLink, 
  FileText, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Scale, 
  ChevronRight, 
  FileDown, 
  Sparkles,
  ArrowRight,
  HelpCircle,
  Ban
} from 'lucide-react';
import { 
  PinnedDossierItem, 
  DossierPriority, 
  updatePinnedItemNote, 
  updatePinnedItemPriority, 
  removePinnedItem,
  exportCuratedDossierMarkdown 
} from '../utils/pinnedDossierTracker';
import { AskAttorneyChat } from './AskAttorneyChat';

interface CuratedDossierSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedItems: Record<string, PinnedDossierItem>;
  docTitle: string;
  dfiScore?: number;
  partyFavored?: string;
  initialTab?: 'items' | 'chat';
  onUpdateNote: (clauseId: string, note: string) => void;
  onUpdatePriority: (clauseId: string, priority: DossierPriority) => void;
  onRemoveItem: (clauseId: string) => void;
  onClearAll: () => void;
  onNavigateToClause?: (clauseId: string) => void;
  onOpenFullDossierTab?: () => void;
}

export const CuratedDossierSidebar: React.FC<CuratedDossierSidebarProps> = ({
  isOpen,
  onClose,
  pinnedItems,
  docTitle,
  dfiScore = 50,
  partyFavored = 'Neutral',
  initialTab = 'items',
  onUpdateNote,
  onUpdatePriority,
  onRemoveItem,
  onClearAll,
  onNavigateToClause,
  onOpenFullDossierTab
}) => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<'items' | 'chat'>(initialTab);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);
  const [editingNoteClauseId, setEditingNoteClauseId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');

  useEffect(() => {
    if (initialTab) {
      setActiveSidebarTab(initialTab);
    }
  }, [initialTab]);

  const itemList = Object.values(pinnedItems).sort((a, b) => b.pinnedAt - a.pinnedAt);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyCuratedBrief = async () => {
    const md = exportCuratedDossierMarkdown(itemList, docTitle, dfiScore);
    try {
      await navigator.clipboard.writeText(md);
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleStartEditNote = (item: PinnedDossierItem) => {
    setEditingNoteClauseId(item.clauseId);
    setTempNoteText(item.customNote || '');
  };

  const handleSaveNote = (clauseId: string) => {
    onUpdateNote(clauseId, tempNoteText);
    setEditingNoteClauseId(null);
  };

  const getPriorityConfig = (priority: DossierPriority) => {
    switch (priority) {
      case 'HIGH_PRIORITY':
        return {
          label: 'High Priority',
          color: 'bg-red-500/15 text-red-300 border-red-500/40',
          dot: 'bg-red-400'
        };
      case 'WALKAWAY':
        return {
          label: 'Walkaway Threshold',
          color: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-500'
        };
      case 'REDLINE':
        return {
          label: 'Redline Required',
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400'
        };
      default:
        return {
          label: 'Clarification for Counsel',
          color: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400'
        };
    }
  };

  const highPriorityCount = itemList.filter(i => i.priority === 'HIGH_PRIORITY' || i.priority === 'WALKAWAY').length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="curated-dossier-title">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md md:max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Pin className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="curated-dossier-title" className="text-base font-bold text-white font-['Cinzel',serif]">
                    Curated Dossier
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                    {itemList.length} {itemList.length === 1 ? 'Clause' : 'Clauses'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Targeted briefing points curated for your attorney consultation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close Curated Dossier Sidebar"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Top View Mode Switcher: Curated Items vs Ask Attorney AI */}
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 shrink-0">
            <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-800 w-full">
              <button
                type="button"
                id="tab-sidebar-curated-items"
                onClick={() => setActiveSidebarTab('items')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeSidebarTab === 'items'
                    ? 'bg-slate-800 text-amber-300 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>Curated Items ({itemList.length})</span>
              </button>

              <button
                type="button"
                id="tab-sidebar-ask-attorney"
                onClick={() => setActiveSidebarTab('chat')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  activeSidebarTab === 'chat'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>Ask Attorney AI</span>
                {itemList.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {activeSidebarTab === 'chat' ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <AskAttorneyChat
                pinnedItems={pinnedItems}
                docTitle={docTitle}
                dfiScore={dfiScore}
                partyFavored={partyFavored}
                onAppendNoteToClause={onUpdateNote}
                className="h-full border-0 rounded-none shadow-none"
              />
            </div>
          ) : (
            <>
              {/* Metrics Sub-strip */}
              {itemList.length > 0 && (
                <div className="px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-300">
                      <span>Document:</span>
                      <strong className="text-slate-200 truncate max-w-[140px] sm:max-w-xs">{docTitle}</strong>
                    </span>
                    {highPriorityCount > 0 && (
                      <span className="flex items-center gap-1 text-red-300 font-semibold">
                        <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                        {highPriorityCount} High Priority
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onClearAll}
                    className="text-[11px] text-slate-500 hover:text-red-400 transition cursor-pointer"
                    title="Remove all pinned clauses from this collection"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Content Body: Scrollable list of curated clauses */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {itemList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
                  <Pin className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-300">No Clauses Pinned Yet</h3>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  Click the <strong className="text-amber-300">"Pin to Dossier"</strong> button on any Clause Audit Card to save pivotal terms for your attorney briefing.
                </p>
              </div>
            ) : (
              itemList.map((item, idx) => {
                const pConfig = getPriorityConfig(item.priority);
                const isEditingThisNote = editingNoteClauseId === item.clauseId;

                return (
                  <div
                    key={item.clauseId}
                    id={`dossier-item-${item.clauseId}`}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 space-y-3 transition shadow-xs"
                  >
                    {/* Item Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {item.clause.clause_id}
                        </span>
                        <span className="text-xs font-medium text-slate-300 truncate max-w-[160px]">
                          {item.clause.clause_category}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveSidebarTab('chat')}
                          className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-semibold flex items-center gap-1 border border-amber-500/30 transition cursor-pointer"
                          title="Ask the AI Attorney Strategist about this specific clause"
                        >
                          <Briefcase className="w-3 h-3 text-amber-400" />
                          <span>Ask Counsel</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateToClause) {
                              onNavigateToClause(item.clauseId);
                              onClose();
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
                          title="Locate in Clause Audit Cards"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.clauseId)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                          title="Unpin from Dossier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Priority Selector & Risk Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">Priority:</span>
                        <select
                          aria-label={`Set consultation priority for ${item.clauseId}`}
                          value={item.priority}
                          onChange={(e) => onUpdatePriority(item.clauseId, e.target.value as DossierPriority)}
                          className={`text-[11px] font-semibold rounded px-2 py-0.5 border cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-hidden ${pConfig.color}`}
                        >
                          <option value="HIGH_PRIORITY">🔥 High Priority</option>
                          <option value="WALKAWAY">⛔ Walkaway Threshold</option>
                          <option value="CLARIFY">❓ Clarify with Counsel</option>
                          <option value="REDLINE">✍️ Redline Proposal</option>
                        </select>
                      </div>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 font-mono">
                        {item.clause.risk_level} Risk
                      </span>
                    </div>

                    {/* Verbatim quote snippet */}
                    <div className="bg-slate-900/60 rounded p-2.5 border border-slate-800/80 text-xs font-serif italic text-slate-300 line-clamp-3">
                      "{item.clause.verbatim_quote}"
                    </div>

                    {/* Plain English Impact */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {item.clause.plain_english_meaning}
                    </p>

                    {/* Client Consultation Note / Objective */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-indigo-300 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-indigo-400" />
                          Consultation Inquiries / Notes:
                        </span>
                        {!isEditingThisNote && (
                          <button
                            type="button"
                            onClick={() => handleStartEditNote(item)}
                            className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                          >
                            {item.customNote ? 'Edit Note' : '+ Add Note'}
                          </button>
                        )}
                      </div>

                      {isEditingThisNote ? (
                        <div className="space-y-2">
                          <textarea
                            value={tempNoteText}
                            onChange={(e) => setTempNoteText(e.target.value)}
                            placeholder="Add specific questions for your attorney (e.g. 'Ask if we can negotiate a 2x cap instead of 12 months')..."
                            className="w-full bg-slate-900 border border-indigo-500/50 rounded p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            rows={2}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingNoteClauseId(null)}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveNote(item.clauseId)}
                              className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        item.customNote ? (
                          <p className="text-xs text-indigo-200 bg-indigo-950/30 border border-indigo-500/20 rounded p-2 leading-relaxed">
                            "{item.customNote}"
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-500 italic">
                            No specific questions noted yet. Click "+ Add Note" to note discussion objectives.
                          </p>
                        )
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {itemList.length > 0 && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-copy-curated-brief"
                  onClick={handleCopyCuratedBrief}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {copiedBrief ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Curated Brief!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Curated Brief (MD)</span>
                    </>
                  )}
                </button>

                {onOpenFullDossierTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenFullDossierTab();
                      onClose();
                    }}
                    className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
                    title="View complete briefing in Attorney Dossier tab"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Dossier Tab</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
      </div>
    </div>
  );
};
