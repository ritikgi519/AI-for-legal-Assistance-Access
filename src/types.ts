export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ClauseCategory = 
  | 'Indemnity' 
  | 'Termination' 
  | 'Liability' 
  | 'Non-Compete' 
  | 'Payment' 
  | 'IP' 
  | 'Dispute' 
  | 'Confidentiality' 
  | 'Warranty'
  | 'Force Majeure';

export type UserProtectionLevel = 'Unprotected' | 'Partially Protected' | 'Well Protected';

export interface DocumentOverview {
  document_title: string;
  document_type: string;
  parties_identified: string[];
  fairness_index: number; // 0 to 100
  executive_summary: string;
}

export interface CriticalClauseAudit {
  clause_id: string; // e.g. "Section 11.2"
  clause_category: ClauseCategory | string;
  verbatim_quote: string;
  plain_english_meaning: string;
  risk_level: RiskLevel;
  party_favored: string; // e.g. "Vendor", "Client", "Mutual"
  hidden_pitfalls: string[];
  proposed_redline: string;
}

export interface WhatIfStressTest {
  scenario: string;
  consequence_chain: string; // e.g. "Clause X -> Grace Period Y -> Remedy Z"
  user_protection_level: UserProtectionLevel;
}

export interface LawyerConsultationDossier {
  top_red_flags_for_discussion: string[];
  high_leverage_questions_for_counsel: string[];
  suggested_walkaway_terms: string[];
}

export interface LexisenseAnalysisResult {
  document_overview: DocumentOverview;
  critical_clause_audit: CriticalClauseAudit[];
  what_if_stress_tests: WhatIfStressTest[];
  lawyer_consultation_dossier: LawyerConsultationDossier;
  statutory_disclaimer: string;
}

export interface SampleContract {
  id: string;
  title: string;
  category: string;
  parties: string;
  description: string;
  content: string;
  presetAnalysis?: LexisenseAnalysisResult;
}
