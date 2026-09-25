/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  generateClauseMarkdown, 
  calculateClauseRiskScore 
} from '../src/utils/clauseExport';
import { CriticalClauseAudit } from '../src/types';

describe('Clause Markdown Snippet Export Suite', () => {
  const sampleClause: CriticalClauseAudit = {
    clause_id: 'Section 11.2',
    clause_category: 'Indemnity',
    verbatim_quote: 'Customer shall indemnify and defend Vendor against any and all third-party claims without limitation.',
    plain_english_meaning: 'Customer agrees to pay all legal fees and liabilities for Vendor with zero cap.',
    risk_level: 'CRITICAL',
    party_favored: 'Vendor Unilateral',
    hidden_pitfalls: [
      'Uncapped legal fee exposure',
      'No carve-outs for Vendor gross negligence'
    ],
    proposed_redline: 'Each party shall mutually indemnify the other, capped at fees paid over the trailing twelve (12) months.'
  };

  it('calculates numerical risk score accurately for critical unilateral clauses', () => {
    const score = calculateClauseRiskScore(sampleClause);
    expect(score).toBeGreaterThanOrEqual(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('generates fully formatted markdown snippet including risk score and audit notes', () => {
    const markdown = generateClauseMarkdown(sampleClause, {
      documentTitle: 'Enterprise Cloud SaaS MSA',
      verifiedLine: 142
    });

    // Verify title and document title
    expect(markdown).toContain('## ⚖️ Clause Audit: Section 11.2 — Indemnity');
    expect(markdown).toContain('Enterprise Cloud SaaS MSA');

    // Verify risk score in metadata table
    expect(markdown).toContain('| **Risk Severity** | `CRITICAL`');
    expect(markdown).toContain('Risk Score');

    // Verify verbatim quote
    expect(markdown).toContain('### 📜 Verbatim Instrument Extract');
    expect(markdown).toContain('> Customer shall indemnify and defend');

    // Verify plain english
    expect(markdown).toContain('### 💡 Plain-English Translation (Operational Impact)');
    expect(markdown).toContain(sampleClause.plain_english_meaning);

    // Verify pitfalls
    expect(markdown).toContain('### ⚠️ Latent Operational Hazards & Pitfalls');
    expect(markdown).toContain('Uncapped legal fee exposure');

    // Verify redline diff
    expect(markdown).toContain('### ✍️ Proposed Tactical Counter-Proposal (Redline)');
    expect(markdown).toContain('```diff');
    expect(markdown).toContain('+ Proposed:');

    // Verify attorney audit notes
    expect(markdown).toContain('### 📋 Attorney Audit Notes & Negotiation Playbook');
    expect(markdown).toContain('Reciprocity Defense');
    expect(markdown).toContain('Financial Cap Requirement');

    // Verify ground truth line
    expect(markdown).toContain('Verified at Line 142');
  });

  it('supports custom audit notes override', () => {
    const customNotes = 'Urgent: Partner approval required before signing off on this indemnity clause.';
    const markdown = generateClauseMarkdown(sampleClause, {
      auditNotes: customNotes
    });

    expect(markdown).toContain(customNotes);
  });

  it('handles low risk clauses with balanced reciprocity gracefully', () => {
    const lowRiskClause: CriticalClauseAudit = {
      clause_id: 'Section 14.1',
      clause_category: 'Governing Law',
      verbatim_quote: 'This Agreement shall be governed by the laws of the State of Delaware.',
      plain_english_meaning: 'Delaware state law applies to any disputes.',
      risk_level: 'LOW',
      party_favored: 'Mutual',
      hidden_pitfalls: [],
      proposed_redline: ''
    };

    const score = calculateClauseRiskScore(lowRiskClause);
    expect(score).toBeLessThanOrEqual(30);

    const markdown = generateClauseMarkdown(lowRiskClause);
    expect(markdown).toContain('`LOW`');
    expect(markdown).toContain('Standard commercial boilerplate terms');
  });
});
