/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ShieldAlert, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Lexisense ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div 
          role="alert" 
          aria-live="assertive"
          className="p-6 my-4 bg-slate-900 border border-rose-500/40 rounded-2xl shadow-2xl max-w-2xl mx-auto text-left animate-fadeIn"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/30 shrink-0">
              <ShieldAlert className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-bold text-rose-300">
                {this.props.fallbackTitle || 'Component Execution Recovered'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Lexisense intercepted a runtime rendering exception and prevented the workspace from crashing. You can safely reset this module without losing your analysis state.
              </p>

              {this.state.error && (
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-rose-300/90 overflow-x-auto">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Terminal className="w-3 h-3" />
                    <span>Diagnostics:</span>
                  </div>
                  {this.state.error.message}
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs rounded-lg hover:from-amber-400 hover:to-amber-500 transition flex items-center gap-2 cursor-pointer shadow-lg focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reload Module</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold text-xs rounded-lg hover:bg-slate-750 hover:text-white transition cursor-pointer border border-slate-700 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:outline-none"
                >
                  Full Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
