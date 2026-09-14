import React, { useState } from 'react';
import { WhatIfStressTest, UserProtectionLevel } from '../types';
import { 
  Zap, 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Play, 
  Loader2,
  Sparkles,
  GitBranch,
  CornerDownRight
} from 'lucide-react';

interface WhatIfSimulatorProps {
  tests: WhatIfStressTest[];
  documentText: string;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ tests, documentText }) => {
  const [activeTests, setActiveTests] = useState<WhatIfStressTest[]>(tests);
  const [customScenario, setCustomScenario] = useState<string>('');
  const [isRunningCustom, setIsRunningCustom] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Sync if tests prop changes
  React.useEffect(() => {
    setActiveTests(tests);
  }, [tests]);

  const getProtectionBadge = (level: UserProtectionLevel | string) => {
    switch (level) {
      case 'Well Protected':
        return {
          badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
          icon: ShieldCheck,
          label: 'WELL PROTECTED'
        };
      case 'Partially Protected':
        return {
          badge: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
          icon: AlertTriangle,
          label: 'PARTIALLY PROTECTED'
        };
      default:
        return {
          badge: 'bg-red-500/15 border-red-500/40 text-red-400',
          icon: ShieldAlert,
          label: 'UNPROTECTED / EXPOSED'
        };
    }
  };

  const handleRunCustomScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customScenario.trim() || !documentText.trim()) return;

    setIsRunningCustom(true);
    setCustomError(null);

    try {
      const res = await fetch('/api/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText,
          customScenario: customScenario.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to simulate scenario.');
      }

      const result = await res.json();
      const newTest: WhatIfStressTest = {
        scenario: result.scenario || customScenario,
        consequence_chain: result.consequence_chain,
        user_protection_level: (result.user_protection_level as UserProtectionLevel) || 'Unprotected'
      };

      setActiveTests(prev => [newTest, ...prev]);
      setCustomScenario('');
    } catch (err: any) {
      console.error('Custom stress test error:', err);
      setCustomError(err.message || 'Error executing scenario simulation.');
    } finally {
      setIsRunningCustom(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white font-['Cinzel',serif]">
              Contractual Stress-Test Engine
            </h3>
            <p className="text-xs text-slate-400">
              Traces sequential downstream contractual outcomes under operational pressure across interconnected covenants.
            </p>
          </div>
        </div>

        {/* Custom Scenario Ingestion */}
        <form onSubmit={handleRunCustomScenario} className="mt-4 pt-4 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Simulate Custom Operational Scenario ("What if...")
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                id="custom-scenario-input"
                type="text"
                value={customScenario}
                onChange={e => setCustomScenario(e.target.value)}
                placeholder="e.g., Counterparty declares Chapter 11 bankruptcy or delays milestone approval past 30 days..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                disabled={isRunningCustom}
              />
            </div>
            <button
              id="btn-simulate-scenario"
              type="submit"
              disabled={isRunningCustom || !customScenario.trim()}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {isRunningCustom ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Tracing Covenants...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Simulate Stress-Test</span>
                </>
              )}
            </button>
          </div>
          {customError && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {customError}
            </p>
          )}
        </form>
      </div>

      {/* Scenario Cards */}
      <div className="space-y-4">
        {activeTests.map((test, idx) => {
          const config = getProtectionBadge(test.user_protection_level);
          const Icon = config.icon;
          const chainSteps = test.consequence_chain.split('->').map(s => s.trim());

          return (
            <div
              key={idx}
              id={`stress-test-${idx}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700/80 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-amber-400 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Hypothetical Bottleneck
                    </span>
                    <h4 className="text-sm font-semibold text-white">
                      "{test.scenario}"
                    </h4>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.badge} self-start sm:self-auto`}>
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </span>
              </div>

              {/* Consequence Chain Visualization */}
              <div className="bg-slate-950/70 rounded-lg p-4 border border-slate-800/80">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                  Step-by-Step Consequence Chain
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-2 flex-wrap">
                  {chainSteps.map((step, sIdx) => (
                    <React.Fragment key={sIdx}>
                      <div className="flex-1 min-w-[200px] p-3 rounded-md bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span className="leading-relaxed font-mono text-[11px] sm:text-xs">
                          {step}
                        </span>
                      </div>
                      {sIdx < chainSteps.length - 1 && (
                        <div className="hidden md:flex text-amber-400 shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
