import React, { useState, useRef } from 'react';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';
import { SampleContract } from '../types';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Scale, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (text: string, title: string, perspective: string) => Promise<void>;
  onSelectSample: (sample: SampleContract) => void;
  isAnalyzing: boolean;
  error: string | null;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  onSelectSample,
  isAnalyzing,
  error
}) => {
  const [inputText, setInputText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [perspective, setPerspective] = useState('Neutral Auditor / General Counterparty Protection');
  const [activeTab, setActiveTab] = useState<'custom' | 'samples'>('custom');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await onAnalyze(inputText.trim(), docTitle.trim() || 'Custom Legal Instrument', perspective);
  };

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Cinzel',serif]">
                Ingest Contract into Lexisense
              </h2>
              <p className="text-xs text-slate-400">
                Paste contract clauses, upload document files, or choose benchmark contracts.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste / Upload Contract
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('samples')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'samples'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Pre-Loaded Benchmark Contracts ({SAMPLE_CONTRACTS.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'custom' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Document Title / Reference Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Master Services Agreement v3"
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reviewing Perspective
                  </label>
                  <select
                    value={perspective}
                    onChange={e => setPerspective(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/60 cursor-pointer"
                  >
                    <option value="Customer / Buyer Protection">Protect Customer / Buyer / Client</option>
                    <option value="Vendor / Service Provider Protection">Protect Vendor / Service Provider</option>
                    <option value="Contractor / Consultant / Employee Protection">Protect Contractor / Freelancer / Consultant</option>
                    <option value="Commercial Tenant Protection">Protect Tenant / Lessee</option>
                    <option value="Neutral Auditor / Reciprocal Balance">Neutral Auditor / Maximum Reciprocity</option>
                  </select>
                </div>
              </div>

              {/* Text Input Area & Drag/Drop */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="font-semibold text-slate-300">
                    Source Contract Clauses (Verbatim Legal Text)
                  </label>
                  <span>
                    {wordCount} words • {charCount} characters
                  </span>
                </div>

                <textarea
                  id="contract-source-textarea"
                  rows={11}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder={`Paste contract text or clauses here...\n\nExample:\nSECTION 8. LIMITATION OF LIABILITY\n8.1 Vendor's total liability shall be limited to $100...\n\nSECTION 11. INDEMNIFICATION\nCustomer shall indemnify Vendor for all claims including attorney fees...`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-600 font-mono leading-relaxed focus:outline-none focus:border-amber-500/60"
                  required
                />
              </div>

              {/* Upload Helper */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.md,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Document File (.txt, .md)</span>
                  </button>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    or drag & drop anywhere in this window
                  </span>
                </div>

                <button
                  id="btn-run-analysis-modal"
                  type="submit"
                  disabled={isAnalyzing || !inputText.trim()}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deconstructing Contract with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 fill-slate-950" />
                      <span>Run Lexisense Deconstruction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE_CONTRACTS.map((sample) => (
                <div
                  key={sample.id}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl p-4 flex flex-col justify-between transition cursor-pointer group"
                  onClick={() => {
                    onSelectSample(sample);
                    onClose();
                  }}
                >
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {sample.category}
                    </span>
                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                      {sample.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {sample.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
                    <span>Load Benchmark</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
