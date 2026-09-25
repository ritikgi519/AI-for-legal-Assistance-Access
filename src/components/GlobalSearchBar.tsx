import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  X, 
  FileText, 
  Zap, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  CornerDownLeft, 
  Layers, 
  AlertTriangle,
  Scale
} from 'lucide-react';
import { LexisenseAnalysisResult, SearchResultItem } from '../types';
import { performSemanticSearch } from '../utils/semanticSearch';
import { useDebounce } from '../hooks/useDebounce';

interface GlobalSearchBarProps {
  analysis: LexisenseAnalysisResult | null;
  documentText: string;
  onSelectResult: (result: SearchResultItem) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  analysis,
  documentText,
  onSelectResult
}) => {
  const [query, setQuery] = useState<string>('');
  const debouncedQuery = useDebounce(query, 120);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [activeTypeFilter, setActiveTypeFilter] = useState<'ALL' | 'CLAUSE' | 'STRESS_TEST' | 'TIMELINE_MILESTONE'>('ALL');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Compute search results with debounced query
  const rawResults = useMemo(() => {
    return performSemanticSearch(debouncedQuery, analysis, documentText);
  }, [debouncedQuery, analysis, documentText]);

  // Filter results by type chip
  const filteredResults = useMemo(() => {
    if (activeTypeFilter === 'ALL') return rawResults;
    return rawResults.filter(r => r.type === activeTypeFilter);
  }, [rawResults, activeTypeFilter]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: SearchResultItem) => {
    onSelectResult(item);
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CLAUSE':
        return <Scale className="w-3.5 h-3.5 text-amber-400" />;
      case 'STRESS_TEST':
        return <Zap className="w-3.5 h-3.5 text-rose-400" />;
      case 'TIMELINE_MILESTONE':
        return <Clock className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <span key={i} className="bg-amber-400/30 text-amber-200 font-semibold px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md mx-2 sm:mx-4">
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="global-search-results"
          aria-label="Global semantic search across legal concepts and clauses"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search legal concepts (e.g. 'liability', 'indemnity', 'termination', 'ip')..."
          className="w-full pl-9 pr-14 py-1.5 bg-slate-950/80 hover:bg-slate-950 focus:bg-slate-950 text-slate-200 placeholder-slate-500 text-xs rounded-lg border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition focus:outline-none"
        />

        {/* Clear Button or Cmd+K Badge */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded pointer-events-none">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown: Quick Legal Concept Suggestions when empty/focused */}
      {isOpen && query.trim().length < 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Query Specific Legal Concepts
            </span>
            <span className="text-[10px] font-mono text-slate-500">1-click audit</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Limitation of Liability', query: 'liability', icon: '⚖️' },
              { label: 'Indemnification & Defense', query: 'indemnity', icon: '🛡️' },
              { label: 'Termination & Cure', query: 'termination', icon: '⏱️' },
              { label: 'Payment Penalties', query: 'payment', icon: '💳' },
              { label: 'IP Rights & Ownership', query: 'intellectual property', icon: '💡' },
              { label: 'Confidentiality & Data', query: 'confidentiality', icon: '🔒' },
              { label: 'Governing Law & Venue', query: 'governing law', icon: '🌐' },
              { label: 'SLA & Uptime Credits', query: 'sla', icon: '⚡' },
              { label: 'D3 Risk Radar', query: 'radar', icon: '🎯' }
            ].map(concept => (
              <button
                key={concept.query}
                type="button"
                onClick={() => {
                  setQuery(concept.query);
                  setIsOpen(true);
                  inputRef.current?.focus();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-amber-500/10 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 border border-slate-800 text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{concept.icon}</span>
                <span>{concept.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span>Click any legal topic to jump straight to corresponding covenants</span>
            <kbd className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">esc to close</kbd>
          </div>
        </div>
      )}

      {/* Dropdown Results Palette */}
      {isOpen && query.trim().length >= 2 && (
        <div id="global-search-results" className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-[440px] flex flex-col">
          {/* Palette Sub-header & Filters */}
          <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                <strong>{rawResults.length}</strong> match{rawResults.length === 1 ? '' : 'es'} across document
              </span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTypeFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  activeTypeFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeFilter('CLAUSE')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  activeTypeFilter === 'CLAUSE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clauses
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeFilter('STRESS_TEST')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  activeTypeFilter === 'STRESS_TEST' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Stress Tests
              </button>
              <button
                type="button"
                onClick={() => setActiveTypeFilter('TIMELINE_MILESTONE')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  activeTypeFilter === 'TIMELINE_MILESTONE' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Deadlines
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Search className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-300 font-medium">No direct or semantic matches found</p>
                <p className="text-[11px] text-slate-500">
                  Try searching broader terms like "liability", "termination", "indemnity", "payment", or "audit".
                </p>
              </div>
            ) : (
              filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`p-3 transition cursor-pointer flex items-start gap-3 ${
                      isSelected ? 'bg-amber-500/10 border-l-2 border-l-amber-400' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">
                          {highlightMatch(item.title, query)}
                        </span>
                        {item.badgeText && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                            {item.badgeText}
                          </span>
                        )}
                        <span className="text-[10px] text-amber-400/90 font-mono ml-auto">
                          {item.matchedField}
                        </span>
                      </div>

                      {item.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                      )}

                      <p className="text-[11px] text-slate-300 line-clamp-2 font-mono bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
                        "{highlightMatch(item.excerpt, query)}"
                      </p>
                    </div>

                    <div className="shrink-0 pt-1 flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 transition ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-sm' 
                          : 'bg-slate-950/80 text-amber-300 border-amber-500/30'
                      }`}>
                        <span>{item.clauseId ? 'Jump to Clause' : 'Jump to View'}</span>
                        <CornerDownLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-2 bg-slate-950/90 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between px-3">
            <div className="flex items-center gap-2 font-mono">
              <span><kbd className="bg-slate-900 border border-slate-800 px-1 rounded text-slate-300">↑</kbd> <kbd className="bg-slate-900 border border-slate-800 px-1 rounded text-slate-300">↓</kbd> to navigate</span>
              <span><kbd className="bg-slate-900 border border-slate-800 px-1 rounded text-slate-300">↵</kbd> to jump to view</span>
              <span><kbd className="bg-slate-900 border border-slate-800 px-1 rounded text-slate-300">esc</kbd> to close</span>
            </div>
            <span className="text-amber-400/80 font-medium">Lexisense Semantic Index</span>
          </div>
        </div>
      )}
    </div>
  );
};
