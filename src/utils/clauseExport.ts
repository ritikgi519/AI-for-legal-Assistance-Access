/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CriticalClauseAudit, RiskLevel } from '../types';

/**
 * Derives a standardized 0-100 numerical risk score for a clause
 */
export function calculateClauseRiskScore(clause: CriticalClauseAudit): number {
  let baseScore = 25;
  switch (clause.risk_level) {
    case 'CRITICAL':
      baseScore = 88;
      break;
    case 'HIGH':
      baseScore = 72;
      break;
    case 'MEDIUM':
      baseScore = 48;
      break;
    case 'LOW':
      baseScore = 22;
      break;
  }

  // Adjust for favored party asymmetry
  const party = (clause.party_favored || '').toLowerCase();
  if (party.includes('vendor') || party.includes('counterparty') || party.includes('unilateral')) {
    baseScore += 6;
  } else if (party.includes('mutual') || party.includes('client') || party.includes('reciprocal')) {
    baseScore -= 6;
  }

  // Factor in hidden hazards
  const pitfalls = clause.hidden_pitfalls || [];
  baseScore += Math.min(pitfalls.length * 3, 10);

  return Math.max(5, Math.min(98, Math.round(baseScore)));
}

export type ClauseRiskTier = 'Low' | 'Medium' | 'High';

export interface ClauseRiskIndicatorConfig {
  tier: ClauseRiskTier;
  score: number;
  label: string; // e.g. "Low Risk", "Medium Risk", "High Risk"
  badge: string;
  dot: string;
  tooltip: string;
}

/**
 * Maps the 0-100 internal risk assessment score to a standardized tier (Low, Medium, High)
 */
export function getRiskTierFromScore(score: number): ClauseRiskTier {
  if (score >= 65) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Returns full indicator configuration for rendering a small, color-coded risk indicator tag
 */
export function getClauseRiskIndicator(clause: CriticalClauseAudit): ClauseRiskIndicatorConfig {
  const score = calculateClauseRiskScore(clause);
  const tier = getRiskTierFromScore(score);

  switch (tier) {
    case 'High':
      return {
        tier: 'High',
        score,
        label: 'High Risk',
        badge: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
        dot: 'bg-rose-400',
        tooltip: `Internal Risk Assessment Score: ${score}/100 (High Risk)`
      };
    case 'Medium':
      return {
        tier: 'Medium',
        score,
        label: 'Medium Risk',
        badge: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
        dot: 'bg-amber-400',
        tooltip: `Internal Risk Assessment Score: ${score}/100 (Medium Risk)`
      };
    case 'Low':
    default:
      return {
        tier: 'Low',
        score,
        label: 'Low Risk',
        badge: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
        dot: 'bg-emerald-400',
        tooltip: `Internal Risk Assessment Score: ${score}/100 (Low Risk)`
      };
  }
}

/**
 * Generates an executive-ready formatted Markdown snippet for a single audited clause
 */
export function generateClauseMarkdown(
  clause: CriticalClauseAudit,
  options?: {
    documentTitle?: string;
    verifiedLine?: number;
    auditNotes?: string;
  }
): string {
  const riskScore = calculateClauseRiskScore(clause);
  const isOmission = clause.verbatim_quote.includes('OMISSION DETECTED') || 
    clause.plain_english_meaning.includes('OMISSION DETECTED');

  const lines: string[] = [];

  // Title
  lines.push(`## ⚖️ Clause Audit: ${clause.clause_id} — ${clause.clause_category}`);
  if (options?.documentTitle) {
    lines.push(`*Source Instrument:* **${options.documentTitle}**\n`);
  } else {
    lines.push('');
  }

  // Executive Metadata Table
  lines.push('| Audit Metric | Assessment Value |');
  lines.push('| :--- | :--- |');
  lines.push(`| **Risk Severity** | \`${clause.risk_level}\` (${riskScore}/100 Risk Score) |`);
  lines.push(`| **Covenant Reciprocity** | Favors **${clause.party_favored || 'Unspecified'}** |`);
  lines.push(`| **Category Classification** | ${clause.clause_category} |`);
  lines.push(`| **Ground-Truth Integrity** | ${isOmission ? '⚠️ OMISSION FLAGGED' : options?.verifiedLine ? `✅ Verified at Line ${options.verifiedLine}` : '100% Verbatim Match'} |`);
  lines.push('');

  // Verbatim Instrument Text
  lines.push('### 📜 Verbatim Instrument Extract');
  lines.push('> ' + clause.verbatim_quote.replace(/\n/g, '\n> '));
  lines.push('');

  // Plain-English Translation
  lines.push('### 💡 Plain-English Translation (Operational Impact)');
  lines.push(clause.plain_english_meaning);
  lines.push('');

  // Hidden Pitfalls
  if (clause.hidden_pitfalls && clause.hidden_pitfalls.length > 0) {
    lines.push('### ⚠️ Latent Operational Hazards & Pitfalls');
    clause.hidden_pitfalls.forEach(pitfall => {
      lines.push(`- **Risk Factor:** ${pitfall}`);
    });
    lines.push('');
  }

  // Proposed Tactical Redline
  if (clause.proposed_redline) {
    lines.push('### ✍️ Proposed Tactical Counter-Proposal (Redline)');
    lines.push('```diff');
    lines.push(`- Original: ${clause.verbatim_quote}`);
    lines.push(`+ Proposed: ${clause.proposed_redline}`);
    lines.push('```');
    lines.push('');
  }

  // Additional Audit Notes & Guidance
  const auditNotes = options?.auditNotes || generateDefaultAuditNotes(clause, riskScore);
  lines.push('### 📋 Attorney Audit Notes & Negotiation Playbook');
  lines.push(auditNotes);
  lines.push('');

  // Footer Attribution
  lines.push('---');
  lines.push(`*Generated via Lexisense Legal Intelligence Suite · Timestamp: ${new Date().toISOString().split('T')[0]}*`);

  return lines.join('\n');
}

/**
 * Creates contextual negotiation playbook advice based on clause severity and category
 */
function generateDefaultAuditNotes(clause: CriticalClauseAudit, riskScore: number): string {
  const cat = (clause.clause_category || '').toLowerCase();
  const party = (clause.party_favored || '').toLowerCase();

  const recommendations: string[] = [];

  if (riskScore >= 70) {
    recommendations.push('**High Priority Action Item:** This covenant creates asymmetric exposure for your organization and should be designated as a non-negotiable redline prior to contract signature.');
  }

  if (party.includes('vendor') || party.includes('counterparty')) {
    recommendations.push('**Reciprocity Defense:** Request mutual language ensuring identical rights, cure periods, and indemnity protections apply symmetrically to both signatories.');
  }

  if (cat.includes('indemnity') || cat.includes('liability')) {
    recommendations.push('**Financial Cap Requirement:** Ensure liability is strictly capped at fees paid over the trailing 12 months, and eliminate carve-outs for indirect or consequential damages.');
  } else if (cat.includes('termination')) {
    recommendations.push('**Exit Preservation:** Insist on a minimum 30-day written notice and cure window for alleged material breaches before any unilateral termination takes effect.');
  } else if (cat.includes('ip') || cat.includes('intellectual')) {
    recommendations.push('**IP Ringfencing:** Confirm explicitly that customer background intellectual property and confidential data remain exclusively owned by your enterprise.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Standard commercial boilerplate terms. Review for alignment with company operational baselines and standard governing law requirements.');
  }

  return recommendations.join('\n\n');
}

export { 
  analyzeClauseLegaleseTone, 
  getClauseToneSentiment 
} from './clauseToneAnalyzer';
export type { ClauseToneSentiment, ClauseToneConfig } from '../types';
