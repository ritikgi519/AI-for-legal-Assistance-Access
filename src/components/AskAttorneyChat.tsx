/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  Pin, 
  AlertTriangle, 
  Scale, 
  Briefcase, 
  HelpCircle, 
  MessageSquare, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight,
  BookmarkPlus,
  ArrowRight,
  Filter
} from 'lucide-react';
import { PinnedDossierItem, DossierPriority } from '../utils/pinnedDossierTracker';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  referencedClauses?: string[];
}

interface AskAttorneyChatProps {
  pinnedItems: Record<string, PinnedDossierItem>;
  docTitle?: string;
  dfiScore?: number;
  partyFavored?: string;
  onAppendNoteToClause?: (clauseId: string, noteToAppend: string) => void;
  className?: string;
}

export const AskAttorneyChat: React.FC<AskAttorneyChatProps> = ({
  pinnedItems,
  docTitle = 'Contract Document',
  dfiScore = 50,
  partyFavored = 'Neutral',
  onAppendNoteToClause,
  className = ''
}) => {
  const itemList = Object.values(pinnedItems);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      role: 'model',
      content: `### Welcome to Ask the Attorney
I am **Counsel Strategist**, your dedicated AI negotiation consultant within Lexisense. 

${itemList.length > 0 
  ? `I have contextually loaded your **${itemList.length} curated dossier clause${itemList.length === 1 ? '' : 's'}** (${itemList.map(i => i.clauseId).join(', ')}), including your custom notes and priority tags.`
  : `Your curated dossier is currently empty. You can ask general legal strategy questions, or **pin clauses from the Clause Audit Cards** to give me strict context on your exact contractual wording and client notes.`
}

How can I help you formulate counter-proposals or prepare for your counsel consultation today?`,
      timestamp: Date.now()
    }
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [savingNoteClauseId, setSavingNoteClauseId] = useState<string | null>(null);
  const [savedSuccessClauseId, setSavedSuccessClauseId] = useState<string | null>(null);
  
  // Clause filter selection for focused consultation
  const [selectedFocusClauseId, setSelectedFocusClauseId] = useState<string>('ALL');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Contextually dynamic prompt chips
  const promptSuggestions = React.useMemo(() => {
    if (itemList.length === 0) {
      return [
        "What are the standard 3 commercial terms I must protect in any MSA?",
        "How do I negotiate a reciprocal consequential damages waiver?",
        "What is standard market practice for termination notice and cure periods?",
        "What questions should I bring to an initial attorney consultation?"
      ];
    }

    const highestRiskItem = itemList.find(i => i.clause?.risk_level === 'CRITICAL') || itemList[0];
    const categoryName = highestRiskItem?.clause?.clause_category || 'Commercial Terms';
    const suggestions = [
      `How do I negotiate our highest-risk provision (${highestRiskItem.clauseId} - ${categoryName})?`,
      `Draft a balanced counter-offer email for ${highestRiskItem.clauseId} to review with counsel.`,
      `What leverage trade-offs can I make between my ${itemList.length} pinned clauses?`,
      `What should my absolute walk-away line be for ${highestRiskItem.clauseId}?`,
      `Give me 3 pointed questions to ask my external attorney about our pinned covenants.`
    ];
    return suggestions;
  }, [itemList]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    setInputMessage('');
    setErrorMsg(null);

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Filter curated items if specific clause is focused
      const itemsToPass = selectedFocusClauseId === 'ALL'
        ? itemList
        : itemList.filter(i => i.clauseId === selectedFocusClauseId);

      const payload = {
        messages: newHistory.map(m => ({
          role: m.role,
          content: m.content
        })),
        curatedDossierItems: itemsToPass.map(i => ({
          clauseId: i.clauseId,
          category: i.clause?.clause_category || '',
          verbatimQuote: i.clause?.verbatim_quote || '',
          plainEnglish: i.clause?.plain_english_meaning || '',
          riskLevel: i.clause?.risk_level || 'MEDIUM',
          partyFavored: i.clause?.party_favored || '',
          proposedRedline: i.workingRedline || i.clause?.proposed_redline || '',
          clientNotes: i.customNote || '',
          priority: i.priority
        })),
        documentContext: {
          title: docTitle,
          fairnessScore: dfiScore,
          partyFavored
        }
      };

      const res = await fetch('/api/chat-attorney', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `counsel-${Date.now()}`,
        role: 'model',
        content: data.reply || 'No strategic advice generated.',
        timestamp: data.timestamp || Date.now(),
        referencedClauses: itemsToPass.map(i => i.clauseId)
      };

      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Chat Attorney request failed:', err);
      setErrorMsg(err.message || 'Unable to connect to the Attorney Strategist.');
      // Add local error response
      const fallbackMsg: ChatMessage = {
        id: `counsel-err-${Date.now()}`,
        role: 'model',
        content: `I encountered a communication interruption. Here is immediate baseline guidance for **${itemList[0]?.clauseId || 'your document'}**:

Always counter unilateral provisions by demanding **bilateral mutuality**, a **12-month trailing fee liability ceiling**, and an express **30-day written cure period** before default. Present these items to your counsel as non-negotiable risk boundaries.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleSaveToClauseNotes = (clauseId: string, adviceText: string) => {
    if (!onAppendNoteToClause) return;
    // Extract a concise bullet from adviceText (e.g. first 200 characters)
    const excerpt = adviceText.split('\n').filter(l => l.trim().length > 0)[0] || adviceText.slice(0, 150);
    onAppendNoteToClause(clauseId, `Counsel Strategy: ${excerpt}`);
    setSavedSuccessClauseId(clauseId);
    setSavingNoteClauseId(null);
    setTimeout(() => setSavedSuccessClauseId(null), 2500);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: 'model',
        content: `Consultation chat history cleared. Ready for fresh strategic analysis on your **${itemList.length} curated clauses**.`,
        timestamp: Date.now()
      }
    ]);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Briefcase className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Ask the Attorney AI
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs">
              Context-grounded legal strategy & negotiation counter-proposals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition cursor-pointer text-xs flex items-center gap-1 border border-transparent hover:border-slate-700"
              title="Reset consultation conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Curated Context Ribbon */}
      <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Pin className="w-3 h-3 text-amber-400" />
            Active Dossier Context:
          </span>

          {itemList.length === 0 ? (
            <span className="text-[11px] italic text-slate-500">
              No clauses pinned yet (general mode)
            </span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedFocusClauseId('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer border ${
                  selectedFocusClauseId === 'ALL'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
                }`}
              >
                All ({itemList.length})
              </button>

              {itemList.slice(0, 4).map(item => (
                <button
                  key={item.clauseId}
                  type="button"
                  onClick={() => setSelectedFocusClauseId(item.clauseId)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition cursor-pointer border ${
                    selectedFocusClauseId === item.clauseId
                      ? 'bg-indigo-500/25 text-indigo-300 border-indigo-500/60 font-bold ring-1 ring-indigo-500/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                  title={`${item.clause?.clause_category || 'Clause'}: ${item.clause?.risk_level || 'Medium'} Risk`}
                >
                  {item.clauseId}
                  {item.clause?.risk_level === 'CRITICAL' && <span className="text-red-400 ml-1">●</span>}
                </button>
              ))}

              {itemList.length > 4 && (
                <span className="text-[10px] text-slate-500">
                  +{itemList.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {savedSuccessClauseId && (
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
            <Check className="w-3 h-3 text-emerald-400" />
            Advice saved to {savedSuccessClauseId} notes!
          </span>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((msg) => {
          const isModel = msg.role === 'model';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isModel ? 'justify-start' : 'justify-end'}`}
            >
              {isModel && (
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3.5 space-y-2 leading-relaxed shadow-sm ${
                  isModel
                    ? 'bg-slate-900 border border-slate-800 text-slate-200'
                    : 'bg-amber-500/20 border border-amber-500/40 text-amber-100 font-medium'
                }`}
              >
                {/* Header info for model message */}
                {isModel && (
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2 text-[10px] text-slate-400">
                    <span className="font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Counsel Strategist
                    </span>
                    <span className="text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Content body with simple markdown rendering */}
                <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                  {msg.content.split('\n\n').map((para, pIdx) => {
                    if (para.startsWith('### ')) {
                      return (
                        <h4 key={pIdx} className="font-bold text-amber-300 text-xs tracking-wide pt-1">
                          {para.replace('### ', '')}
                        </h4>
                      );
                    }
                    if (para.startsWith('> ')) {
                      return (
                        <blockquote key={pIdx} className="border-l-2 border-amber-400/80 pl-3 py-1 my-1 italic text-emerald-200 bg-emerald-950/20 font-mono text-[11px] rounded-r">
                          {para.replace(/^>\s*/gm, '')}
                        </blockquote>
                      );
                    }
                    return <p key={pIdx}>{para}</p>;
                  })}
                </div>

                {/* Model message action toolbar */}
                {isModel && msg.id !== 'msg-welcome' && (
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition cursor-pointer py-0.5 px-1 rounded hover:bg-slate-800"
                        title="Copy counsel advice to clipboard"
                      >
                        {copiedMsgId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Copy Advice</span>
                          </>
                        )}
                      </button>

                      {onAppendNoteToClause && itemList.length > 0 && (
                        <div className="relative">
                          {savingNoteClauseId === msg.id ? (
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-700 shadow-md">
                              <span className="text-[10px] text-slate-400 px-1">Save to:</span>
                              {itemList.map(item => (
                                <button
                                  key={item.clauseId}
                                  type="button"
                                  onClick={() => handleSaveToClauseNotes(item.clauseId, msg.content)}
                                  className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-mono transition cursor-pointer"
                                >
                                  {item.clauseId}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setSavingNoteClauseId(null)}
                                className="text-slate-500 hover:text-slate-300 text-[10px] px-1"
                              >
                                ×
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSavingNoteClauseId(msg.id)}
                              className="text-slate-400 hover:text-amber-300 flex items-center gap-1 transition cursor-pointer py-0.5 px-1 rounded hover:bg-slate-800"
                              title="Save advice directly into a curated clause's consultation notes"
                            >
                              <BookmarkPlus className="w-3 h-3 text-amber-400" />
                              <span>Save to Curated Notes</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 italic">
                      Strategic AI Counsel
                    </span>
                  </div>
                )}
              </div>

              {!isModel && (
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <User className="w-4 h-4 text-indigo-300" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
              <Briefcase className="w-4 h-4 text-amber-400" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-300 shadow-sm max-w-sm">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Counsel Strategist analyzing dossier covenants...</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Evaluating commercial risk allocation, market precedents, and counterparty leverage trade-offs.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 2 && (
        <div className="p-3 bg-slate-900/40 border-t border-slate-800/80 space-y-1.5 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Suggested Strategic Questions:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {promptSuggestions.slice(0, 3).map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="px-4 py-2 bg-red-950/40 border-t border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-400 hover:text-red-200 text-xs"
          >
            ×
          </button>
        </div>
      )}

      {/* Input Box Bar */}
      <div className="p-3.5 bg-slate-900 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                itemList.length > 0
                  ? `Ask counsel about your ${itemList.length} pinned clauses (or specific counter-proposals)...`
                  : 'Ask legal strategy questions or pin clauses to dossier for specific counsel...'
              }
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500/60 resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            aria-label="Send message to Attorney Strategist"
            className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 rounded-lg font-bold transition cursor-pointer disabled:cursor-not-allowed shadow-sm flex items-center justify-center shrink-0 h-10 w-10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between px-1">
          <span>Press Enter to send, Shift+Enter for newline</span>
          <span>Educational Legal Intelligence • Not Formal Representation</span>
        </div>
      </div>
    </div>
  );
};
