import { CriticalClauseAudit, LexisenseAnalysisResult, SearchResultItem, WhatIfStressTest } from '../types';
import { extractComplianceTimeline } from './timelineExtractor';
import { parseDocumentGlossary } from './legalGlossaryParser';
import { FastLRUCache } from './memoCache';

// Semantic legal topic taxonomy mapping common terms, intent, and synonyms
const LEGAL_TAXONOMY: Record<string, { topic: string; synonyms: string[]; category: string }> = {
  liability: {
    topic: 'Limitation of Liability & Damages',
    category: 'Liability',
    synonyms: ['liability', 'cap', 'damages', 'consequential', 'supercap', 'punitive', 'aggregate', 'limitation', 'uncapped', 'gross negligence', '$100', 'indirect', 'loss of profits']
  },
  indemnity: {
    topic: 'Indemnification & Defense Obligations',
    category: 'Indemnity',
    synonyms: ['indemn', 'indemnity', 'indemnification', 'hold harmless', 'defend', 'infringement', 'third party', 'third-party', 'ip claims', 'patent', 'copyright']
  },
  termination: {
    topic: 'Termination Rights & Non-Renewal Cutoffs',
    category: 'Termination',
    synonyms: ['terminat', 'termination', 'cancel', 'cancellation', 'convenience', 'material breach', 'notice period', 'cure', 'auto-renew', 'renewal', 'expire', 'expiration', 'trap', 'non-renewal', '30 days']
  },
  payment: {
    topic: 'Billing, Invoicing & Late Payment Penalties',
    category: 'Payment',
    synonyms: ['pay', 'payment', 'fee', 'fees', 'invoice', 'billing', 'net 15', 'net 30', 'interest', 'late fee', 'price', 'pricing', 'advance', 'non-refundable', 'charges', 'overdue']
  },
  ip: {
    topic: 'Intellectual Property Ownership & Licensing',
    category: 'IP',
    synonyms: ['ip', 'intellectual property', 'patent', 'copyright', 'trademark', 'trade secret', 'ownership', 'work made for hire', 'license', 'licensing', 'derivative work', 'background ip', 'infringe']
  },
  assignment: {
    topic: 'Assignment & Change of Control',
    category: 'Assignment',
    synonyms: ['assign', 'assignment', 'subcontract', 'subcontracting', 'change of control', 'transfer', 'merger', 'acquisition', 'affiliate', 'delegate']
  },
  audit: {
    topic: 'Audit & Books Inspection Rights',
    category: 'Audit',
    synonyms: ['audit', 'inspection', 'books', 'records', 'compliance', 'verify', 'auditor', 'examine', 'accounting']
  },
  noncompete: {
    topic: 'Non-Compete & Restrictive Covenants',
    category: 'Non-Compete',
    synonyms: ['non-compete', 'compete', 'competition', 'restrictive', 'solicit', 'non-solicitation', 'territory', 'exclusivity', 'poaching']
  },
  governing_law: {
    topic: 'Governing Law, Jurisdiction & Dispute Resolution',
    category: 'Dispute',
    synonyms: ['governing law', 'jurisdiction', 'venue', 'dispute', 'arbitration', 'court', 'trial', 'jury', 'waiver', 'delaware', 'new york', 'california']
  },
  confidentiality: {
    topic: 'Confidentiality & Data Protection',
    category: 'Confidentiality',
    synonyms: ['confidential', 'confidentiality', 'nda', 'trade secret', 'proprietary', 'privacy', 'security', 'data breach', 'gdpr', 'ccpa', 'disclosure']
  },
  warranty: {
    topic: 'Warranties, Disclaimers & "As-Is"',
    category: 'Warranty',
    synonyms: ['warranty', 'warranties', 'disclaimer', 'as is', 'as-is', 'merchantability', 'fitness', 'express', 'implied']
  },
  sla: {
    topic: 'Service Level Agreement & Uptime',
    category: 'SLA',
    synonyms: ['sla', 'uptime', 'downtime', 'availability', '99.9%', 'credits', 'support', 'response time', 'maintenance']
  },
  force_majeure: {
    topic: 'Force Majeure & Unforeseen Events',
    category: 'Force Majeure',
    synonyms: ['force majeure', 'act of god', 'pandemic', 'war', 'epidemic', 'unforeseeable', 'governmental action', 'disaster']
  },
  remedies: {
    topic: 'Remedies, Injunctions & Equitable Relief',
    category: 'Remedies',
    synonyms: ['sole remedy', 'exclusive remedy', 'injunction', 'injunctive relief', 'equitable relief', 'specific performance', 'irreparable harm']
  }
};

const searchCache = new FastLRUCache<SearchResultItem[]>(60);

/**
 * Performs semantic search across loaded document, clause audits, stress tests, and timeline milestones.
 * Accelerated with FastLRUCache for instant O(1) autocomplete and search retrieval.
 * @complexity O(N) where N is number of clauses + milestones, O(1) on cache hit
 */
export function performSemanticSearch(
  query: string,
  analysis: LexisenseAnalysisResult | null,
  documentText: string
): SearchResultItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || trimmed.length < 2) return [];

  const cacheKey = `${trimmed}:${FastLRUCache.hashKey(documentText, 'searchDoc')}:${analysis?.document_overview.fairness_index ?? 0}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const results: SearchResultItem[] = [];
  const queryTokens = trimmed.split(/\s+/).filter(t => t.length > 1);

  // Identify semantic topic matches
  const matchedTaxonomies: { key: string; topic: string; category: string }[] = [];
  for (const [key, entry] of Object.entries(LEGAL_TAXONOMY)) {
    const isMatched = entry.synonyms.some(syn => trimmed.includes(syn) || syn.includes(trimmed)) ||
      queryTokens.some(tok => entry.synonyms.some(s => s.startsWith(tok)));
    if (isMatched) {
      matchedTaxonomies.push({ key, topic: entry.topic, category: entry.category });
    }
  }

  // Feature Match: Risk Radar & Matrix
  if (trimmed.includes('radar') || trimmed.includes('matrix') || trimmed.includes('risk-reward') || trimmed.includes('quadrant') || trimmed.includes('pitfall') || trimmed.includes('spider')) {
    results.push({
      id: 'feature-risk-radar',
      type: 'LEGAL_TOPIC',
      title: 'Contractual Risk Radar & Value Matrix (D3 Audit)',
      subtitle: 'Visual 2D Scatter Matrix & Multi-Axis Spider Chart',
      category: 'Visual Audit',
      badgeText: 'D3 RADAR',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      excerpt: 'Interactive D3 visualization mapping all contractual clauses across liability risk and operational protective upside into 4 distinct quadrants: Toxic Pitfalls, Strategic Bets, Golden Covenants, and Boilerplate.',
      matchedField: 'Risk Radar Tool',
      score: 160,
      targetTab: 'radar'
    });
  }

  // 1. Search in Critical Clause Audits
  if (analysis?.critical_clause_audit) {
    analysis.critical_clause_audit.forEach((clause: CriticalClauseAudit) => {
      let score = 0;
      let matchedField = '';
      const lowerTitle = clause.clause_id.toLowerCase();
      const lowerCat = (clause.clause_category || '').toLowerCase();
      const lowerQuote = clause.verbatim_quote.toLowerCase();
      const lowerMeaning = clause.plain_english_meaning.toLowerCase();
      const lowerPitfalls = (clause.hidden_pitfalls || []).join(' ').toLowerCase();

      // Direct ID or title match
      if (lowerTitle.includes(trimmed)) {
        score += 120;
        matchedField = 'Clause Heading';
      }

      // Semantic category / taxonomy match
      for (const tax of matchedTaxonomies) {
        if (lowerCat.includes(tax.category.toLowerCase()) || lowerTitle.includes(tax.category.toLowerCase())) {
          score += 65;
          matchedField = matchedField || `Topic: ${tax.topic}`;
        }
      }

      // Verbatim quote match
      if (lowerQuote.includes(trimmed)) {
        score += 80;
        matchedField = matchedField || 'Covenant Source Text';
      } else if (queryTokens.every(tok => lowerQuote.includes(tok))) {
        score += 50;
        matchedField = matchedField || 'Covenant Text Terms';
      }

      // Meaning / Pitfalls match
      if (lowerMeaning.includes(trimmed) || lowerPitfalls.includes(trimmed)) {
        score += 45;
        matchedField = matchedField || 'Risk Analysis & Meaning';
      }

      // Priority boost
      if (clause.risk_level === 'CRITICAL') score += 15;
      else if (clause.risk_level === 'HIGH') score += 10;

      if (score > 0) {
        results.push({
          id: `clause-${clause.clause_id}`,
          type: 'CLAUSE',
          title: clause.clause_id,
          subtitle: `${clause.clause_category} • Favors: ${clause.party_favored}`,
          category: clause.clause_category,
          badgeText: `${clause.risk_level} RISK`,
          badgeColor: clause.risk_level === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      clause.risk_level === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      'bg-blue-500/20 text-blue-300 border-blue-500/40',
          excerpt: clause.verbatim_quote.slice(0, 180) + (clause.verbatim_quote.length > 180 ? '...' : ''),
          matchedField: matchedField || 'Clause Text',
          score,
          targetTab: 'split',
          clauseId: clause.clause_id,
          lineNumber: clause.line_number
        });
      }
    });
  }

  // 2. Search in What-If Stress Tests
  if (analysis?.what_if_stress_tests) {
    analysis.what_if_stress_tests.forEach((test: WhatIfStressTest, index: number) => {
      let score = 0;
      let matchedField = '';
      const lowerScenario = test.scenario.toLowerCase();
      const lowerConsequence = test.consequence_chain.toLowerCase();

      if (lowerScenario.includes(trimmed)) {
        score += 70;
        matchedField = 'Stress Scenario';
      } else if (queryTokens.every(tok => lowerScenario.includes(tok))) {
        score += 45;
        matchedField = 'Stress Scenario Terms';
      }

      if (lowerConsequence.includes(trimmed)) {
        score += 50;
        matchedField = matchedField || 'Consequence Chain';
      }

      for (const tax of matchedTaxonomies) {
        if (lowerScenario.includes(tax.category.toLowerCase()) || lowerConsequence.includes(tax.category.toLowerCase())) {
          score += 35;
          matchedField = matchedField || `Scenario Category: ${tax.topic}`;
        }
      }

      if (score > 0) {
        results.push({
          id: `stress-${index}`,
          type: 'STRESS_TEST',
          title: test.scenario,
          subtitle: `Protection: ${test.user_protection_level}`,
          category: 'Stress Test',
          badgeText: test.user_protection_level.toUpperCase(),
          badgeColor: test.user_protection_level === 'Unprotected' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                      'bg-amber-500/20 text-amber-300 border-amber-500/40',
          excerpt: test.consequence_chain,
          matchedField: matchedField || 'Stress Scenario',
          score,
          targetTab: 'stress'
        });
      }
    });
  }

  // 3. Search in Compliance Timeline Milestones
  if (documentText) {
    try {
      const timeline = extractComplianceTimeline(documentText, analysis?.critical_clause_audit || []);
      timeline.milestones.forEach(milestone => {
        let score = 0;
        let matchedField = '';
        const lowerTitle = milestone.title.toLowerCase();
        const lowerAction = milestone.actionRequired.toLowerCase();
        const lowerConsequence = milestone.consequenceIfMissed.toLowerCase();

        if (lowerTitle.includes(trimmed)) {
          score += 65;
          matchedField = 'Milestone Deadline';
        } else if (queryTokens.every(tok => lowerTitle.includes(tok))) {
          score += 40;
          matchedField = 'Milestone Terms';
        }

        if (lowerAction.includes(trimmed) || lowerConsequence.includes(trimmed)) {
          score += 35;
          matchedField = matchedField || 'Compliance Action';
        }

        for (const tax of matchedTaxonomies) {
          if (tax.key === 'termination' && (milestone.category === 'RENEWAL' || milestone.category === 'TERMINATION')) {
            score += 45;
            matchedField = matchedField || 'Renewal Deadline';
          }
          if (tax.key === 'payment' && milestone.category === 'PAYMENT') {
            score += 45;
            matchedField = matchedField || 'Payment Deadline';
          }
        }

        if (score > 0) {
          results.push({
            id: `timeline-${milestone.id}`,
            type: 'TIMELINE_MILESTONE',
            title: milestone.title,
            subtitle: `${milestone.dateLabel} • Phase: ${milestone.phase}`,
            category: milestone.category,
            badgeText: milestone.isTrapClause ? 'CRITICAL TRAP' : milestone.urgency,
            badgeColor: milestone.isTrapClause ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
            excerpt: milestone.actionRequired,
            matchedField: matchedField || 'Timeline Deadline',
            score,
            targetTab: 'timeline'
          });
        }
      });
    } catch {
      // Ignore fallback
    }
  }

  // 4. Search in Legal Jargon Glossary
  if (documentText) {
    try {
      const glossary = parseDocumentGlossary(documentText);
      glossary.terms.forEach(term => {
        let score = 0;
        let matchedField = '';
        const lowerTerm = term.term.toLowerCase();
        const lowerCanon = term.canonicalTerm.toLowerCase();
        const lowerDef = term.plainEnglishDefinition.toLowerCase();

        if (lowerTerm.includes(trimmed) || lowerCanon.includes(trimmed)) {
          score += 100;
          matchedField = 'Glossary Definition';
        } else if (queryTokens.every(tok => lowerTerm.includes(tok) || lowerCanon.includes(tok))) {
          score += 60;
          matchedField = 'Glossary Concept';
        }

        if (lowerDef.includes(trimmed)) {
          score += 40;
          matchedField = matchedField || 'Plain-English Meaning';
        }

        if (score > 0) {
          results.push({
            id: `glossary-${term.id}`,
            type: 'LEGAL_TOPIC',
            title: `${term.term}`,
            subtitle: `${term.category} • ${term.occurrenceCount} occurrences`,
            category: term.category,
            badgeText: 'GLOSSARY',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            excerpt: term.plainEnglishDefinition,
            matchedField: matchedField || 'Legal Glossary',
            score,
            targetTab: 'glossary'
          });
        }
      });
    } catch {
      // Ignore fallback
    }
  }

  // 5. Search in Raw Document Lines (for verbatim hits not covered in audited cards)
  if (documentText && results.length < 15) {
    const lines = documentText.split('\n');
    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.length < 15) return;
      const lowerLine = trimmedLine.toLowerCase();

      if (lowerLine.includes(trimmed)) {
        // Check if this line is already covered in a clause result
        const alreadyCovered = results.some(r => r.lineNumber === idx + 1);
        if (!alreadyCovered && results.length < 20) {
          results.push({
            id: `doc-line-${idx + 1}`,
            type: 'DOCUMENT_TEXT',
            title: `Line ${idx + 1}: ${trimmedLine.slice(0, 60)}${trimmedLine.length > 60 ? '...' : ''}`,
            subtitle: `Raw Instrument Text`,
            category: 'Source Document',
            badgeText: `LINE ${idx + 1}`,
            badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
            excerpt: trimmedLine,
            matchedField: 'Verbatim Match in Instrument',
            score: 25,
            targetTab: 'split',
            lineNumber: idx + 1
          });
        }
      }
    });
  }

  // Sort descending by relevance score
  results.sort((a, b) => b.score - a.score);

  const topResults = results.slice(0, 15);
  searchCache.set(cacheKey, topResults);
  return topResults;
}
