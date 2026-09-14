import React, { useState } from 'react';
import { LexisenseAnalysisResult } from '../types';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileCode, 
  FileText, 
  Printer 
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: LexisenseAnalysisResult | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  analysis
}) => {
  const [copiedJson, setCopiedJson] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'markdown'>('json');

  if (!isOpen || !analysis) return null;

  const jsonString = JSON.stringify(analysis, null, 2);

  const markdownString = `# ${analysis.document_overview.document_title}
**Document Type:** ${analysis.document_overview.document_type}  
**Parties Identified:** ${analysis.document_overview.parties_identified.join(', ')}  
**Document Fairness Index (DFI):** ${analysis.document_overview.fairness_index}/100  

## Executive Summary
${analysis.document_overview.executive_summary}

---

## Critical Clause Audit (${analysis.critical_clause_audit.length} Clauses Audited)
${analysis.critical_clause_audit.map(c => `
### ${c.clause_id} [${c.clause_category}] - Risk: ${c.risk_level} (Favors: ${c.party_favored})
**Verbatim Quote:**
> "${c.verbatim_quote}"

**Plain-English Meaning:**
${c.plain_english_meaning}

**Hidden Pitfalls:**
${c.hidden_pitfalls.map(p => `- ${p}`).join('\n')}

**Proposed Redline:**
\`\`\`
${c.proposed_redline}
\`\`\`
`).join('\n')}

---

## Stress-Test Scenarios ("What-If" Operational Analysis)
${analysis.what_if_stress_tests.map(t => `
- **Scenario:** ${t.scenario}
  - **Consequence Chain:** ${t.consequence_chain}
  - **User Protection Level:** ${t.user_protection_level}
`).join('\n')}

---

## Attorney Consultation Dossier

### Top Red Flags for Discussion
${analysis.lawyer_consultation_dossier.top_red_flags_for_discussion.map((rf, i) => `${i + 1}. ${rf}`).join('\n')}

### High-Leverage Questions for Counsel
${analysis.lawyer_consultation_dossier.high_leverage_questions_for_counsel.map((q, i) => `${i + 1}. ${q}`).join('\n')}

### Suggested Walkaway Terms
${analysis.lawyer_consultation_dossier.suggested_walkaway_terms.map(w => `- ${w}`).join('\n')}

---
*Statutory Disclaimer: ${analysis.statutory_disclaimer}*
`;

  const handleCopy = () => {
    const text = activeTab === 'json' ? jsonString : markdownString;
    navigator.clipboard.writeText(text);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownload = () => {
    const text = activeTab === 'json' ? jsonString : markdownString;
    const filename = `${analysis.document_overview.document_title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_lexisense.${activeTab === 'json' ? 'json' : 'md'}`;
    const blob = new Blob([text], { type: activeTab === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Cinzel',serif]">
                Export Deconstruction Dossier
              </h2>
              <p className="text-xs text-slate-400">
                Download strictly formatted JSON schema or Attorney Consultation Markdown.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
              title="Print Dossier"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('json')}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'json'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Strict JSON Output (Schema Compliant)
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`pb-3 px-3 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'markdown'
                  ? 'border-amber-500 text-amber-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Attorney Briefing (Markdown)
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .{activeTab === 'json' ? 'json' : 'md'}</span>
            </button>
          </div>
        </div>

        {/* Code / Text viewer */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs bg-slate-950 text-slate-300">
          <pre className="whitespace-pre-wrap leading-relaxed">
            {activeTab === 'json' ? jsonString : markdownString}
          </pre>
        </div>
      </div>
    </div>
  );
};
