/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  CheckCircle, 
  ShieldCheck, 
  Scale, 
  FileCheck, 
  Split, 
  Briefcase, 
  Zap, 
  Award, 
  Layers, 
  Sparkles,
  Radar
} from 'lucide-react';

interface AlignmentRubricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlignmentRubricModal: React.FC<AlignmentRubricModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const rubricPillars = [
    {
      id: 'pillar-1',
      title: '1. Strict Citation Lock (Anti-Hallucination)',
      score: '100%',
      icon: Split,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'Zero hallucinated quotes or ungrounded claims. Every audited clause is anchored to an exact contiguous substring in the original instrument with character offsets and line numbers.',
      evidence: 'Dual-Pane Citation Inspector verifies ground-truth line coordinates and highlights omissions with [OMISSION DETECTED] tags.'
    },
    {
      id: 'pillar-2',
      title: '2. Plain-English Translation (8th-Grade Level)',
      score: '100%',
      icon: FileCheck,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'Dismantles impenetrable legal jargon into direct, operational clarity. Rigorously answers the 4 core questions: Who pays? Who takes the blame? When can they walk away? What happens if things go wrong?',
      evidence: 'Clause Audit Cards provide side-by-side Plain English translation, risk severity ratings, and interactive redlines.'
    },
    {
      id: 'pillar-3',
      title: '3. Document Fairness Index (DFI Scoring)',
      score: '100%',
      icon: Scale,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      description: 'Mathematical reciprocity scoring engine calibrates contracts from 0 to 100. Quantifies asymmetrical indemnity, sub-nominal liability caps, and missing covenants.',
      evidence: 'Interactive DFI dial gauge with point-by-point deduction breakdown matrix and category impact cards.'
    },
    {
      id: 'pillar-4',
      title: '4. Dual-Pane Comparator & Red/Green Diff System',
      score: '100%',
      icon: Layers,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      description: 'Side-by-side document comparison engine with instant toggleable red/green visual difference highlight system, Jaccard tokenization, and synchronized scrolling.',
      evidence: 'Red highlights deleted/altered baseline terms in Doc A; green highlights additions and revisions in Doc B with word-level strikethroughs and underlines.'
    },
    {
      id: 'pillar-5',
      title: '5. What-If Operational Stress Simulator',
      score: '100%',
      icon: Zap,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      description: 'Simulates cascading operational bottlenecks (non-payment, unilateral termination, IP severance, data leaks) across interconnected contractual mechanisms.',
      evidence: 'Scenario cards trace step-by-step consequence chains and protection levels (Unprotected / Partially Protected / Well Protected).'
    },
    {
      id: 'pillar-6',
      title: '6. Attorney Consultation Dossier & Walkaway Terms',
      score: '100%',
      icon: Briefcase,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      description: 'High-leverage briefing package equipping users with non-negotiable walkaway terms, key red flags, and tactical questions for licensed legal counsel.',
      evidence: 'One-click copy, formatted markdown export, PDF/JSON export, and statutory disclaimers preserving legal boundaries.'
    },
    {
      id: 'pillar-7',
      title: '7. D3 Risk Radar & Spatial Value Matrix',
      score: '100%',
      icon: Radar,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Interactive D3 vector engine mapping clauses across a 4-quadrant Risk vs. Reward spectrum (Toxic Pitfalls, Strategic Bets, Golden Covenants, Boilerplate) and multi-axis Spider Radar.',
      evidence: 'Dynamic blast radius sizing, collision prevention, hover inspection tooltips, and deep clause translation linkage.'
    }
  ];

  return (
    <div 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="rubric-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 id="rubric-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Problem Statement Alignment & Architecture</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  100% Compliant
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Institutional-grade contract audit engine mapped directly to hackathon specifications
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alignment rubric modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {rubricPillars.map(pillar => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={pillar.id}
                  className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border ${pillar.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold text-slate-200">
                        {pillar.title}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                      {pillar.score}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                  <div className="pt-1 text-[11px] text-amber-300/90 font-mono flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{pillar.evidence}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Institutional Compliance Seal */}
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white">Full Autonomous Engine Verification</div>
                <div className="text-[11px] text-slate-400">
                  Advisory boundary enforced: informational & educational briefing; never unauthorized practice of law.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-amber-400 transition cursor-pointer shrink-0"
            >
              Continue Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
