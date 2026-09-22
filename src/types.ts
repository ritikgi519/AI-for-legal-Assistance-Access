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

export interface DFIDeduction {
  covenant: string;
  status: 'Heavily Unilateral' | 'Moderately Asymmetric' | 'Balanced Reciprocal' | 'Omission Detected';
  impact: number; // e.g. -20, -15, 0
  party_favored: string;
  rationale: string;
}

export interface DocumentOverview {
  document_title: string;
  document_type: string;
  parties_identified: string[];
  fairness_index: number; // 0 to 100
  executive_summary: string;
  dfi_breakdown?: DFIDeduction[];
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
  renegotiation_priority?: number;
  citation_verified?: boolean;
  match_confidence?: number; // 0 to 100%
  match_offset?: number;
  line_number?: number;
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

export type DiscrepancyType = 'MODIFIED' | 'ADDED' | 'REMOVED' | 'IDENTICAL';
export type SubstantiveImpact = 'FAVORABLE_TO_USER' | 'UNFAVORABLE_TO_USER' | 'NEUTRAL' | 'CRITICAL_SHIFT';

export interface ComparisonDiscrepancy {
  id: string;
  type: DiscrepancyType;
  category: string;
  title: string;
  docAText: string;
  docBText: string;
  docALineStart: number;
  docALineEnd: number;
  docBLineStart: number;
  docBLineEnd: number;
  substantiveImpact: SubstantiveImpact;
  explanation: string;
}

export interface DocumentComparisonResult {
  docAName: string;
  docBName: string;
  similarityScore: number; // 0 to 100
  totalDiscrepancies: number;
  summary: {
    modifications: number;
    additions: number;
    removals: number;
    identicalSections: number;
  };
  discrepancies: ComparisonDiscrepancy[];
}

export type MilestoneCategory = 'EFFECTIVE' | 'PAYMENT' | 'NOTICE' | 'TERMINATION' | 'RENEWAL' | 'POST_TERMINATION' | 'CUSTOM';
export type MilestoneUrgency = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ComplianceMilestone {
  id: string;
  title: string;
  category: MilestoneCategory;
  urgency: MilestoneUrgency;
  dateLabel: string;
  relativeOffsetDays: number; // approximate days from commencement for axis positioning
  phase: string; // e.g. "Execution Phase", "Initial Term", "Renewal Window", "Post-Term"
  clauseReference?: string; // e.g. "Section 6.1"
  verbatimQuote?: string;
  description: string;
  actionRequired: string;
  consequenceIfMissed: string;
  isTrapClause?: boolean;
}

export interface ComplianceTimelineData {
  effectiveDateStr?: string;
  totalDurationDays: number;
  initialTermMonths?: number;
  renewalTermMonths?: number;
  milestones: ComplianceMilestone[];
}

export type SearchResultType = 'CLAUSE' | 'STRESS_TEST' | 'TIMELINE_MILESTONE' | 'DOCUMENT_TEXT' | 'LEGAL_TOPIC';

export interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  category?: string;
  badgeText?: string;
  badgeColor?: string;
  excerpt: string;
  matchedField: string;
  score: number;
  targetTab: 'split' | 'clauses' | 'stress' | 'dossier' | 'timeline' | 'glossary';
  clauseId?: string;
  lineNumber?: number;
}

export type GlossaryCategory = 'Liability & Risk' | 'Remedies & Enforcement' | 'Administration & Notices' | 'Intellectual Property' | 'Boilerplate & Trap' | 'Financial & Payment';

export interface GlossaryTermOccurrence {
  lineNumber: number;
  snippet: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  canonicalTerm: string;
  category: GlossaryCategory;
  plainEnglishDefinition: string;
  whyPartiesUseIt: string;
  hiddenPitfallOrRisk: string;
  proTipsForNegotiation: string;
  occurrenceCount: number;
  occurrences: GlossaryTermOccurrence[];
  riskSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
}

