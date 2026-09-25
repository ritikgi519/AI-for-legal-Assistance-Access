/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CriticalClauseAudit, ClauseToneConfig, ClauseToneSentiment } from '../types';

interface TonePattern {
  regex: RegExp;
  label: string;
  weight: number;
}

const ASSERTIVE_PATTERNS: TonePattern[] = [
  { regex: /sole (and absolute )?discretion/i, label: 'sole discretion', weight: 28 },
  { regex: /at (its|vendor's|landlord's|company's) (sole )?option/i, label: 'unilateral option', weight: 25 },
  { regex: /without (notice|cause|liability|penalty)/i, label: 'without cause/liability', weight: 24 },
  { regex: /defend,?\s*indemnify,?\s*and\s*hold\s*harmless/i, label: 'indemnify and hold harmless', weight: 26 },
  { regex: /uncapped (attorneys'?|legal) fees/i, label: 'uncapped attorneys fees', weight: 25 },
  { regex: /shall immediately|shall forthwith|shall at all times/i, label: 'immediate obligation', weight: 20 },
  { regex: /must promptly|strictly prohibited|time is of the essence/i, label: 'strict demand', weight: 20 },
  { regex: /shall unconditionally|unconditionally and irrevocably/i, label: 'unconditional commitment', weight: 25 },
  { regex: /in no event shall|under no circumstances/i, label: 'absolute prohibition', weight: 22 },
  { regex: /waives? (any|all) rights?|waive trial by jury|irrevocably waives?/i, label: 'rights waiver', weight: 26 },
  { regex: /liquidated damages|forfeiture|automatically forfeit|accelerate/i, label: 'punitive remedy', weight: 26 },
  { regex: /regardless of the prevailing party/i, label: 'one-way fee shift', weight: 25 },
  { regex: /active negligence|exclusive property of/i, label: 'broad exculpation/ownership', weight: 24 },
  { regex: /perpetual,?\s*irrevocable/i, label: 'perpetual irrevocable grant', weight: 24 },
  { regex: /non-compete|liquidated damages of \$/i, label: 'restrictive covenant', weight: 24 },
  { regex: /notwithstanding anything to the contrary/i, label: 'override clause', weight: 20 },
  { regex: /omission detected: no provision/i, label: 'unilateral omission', weight: 20 },
  { regex: /no right to terminate/i, label: 'termination ban', weight: 25 },
  { regex: /remedy is zero|illusion of remedy/i, label: 'exculpatory shield', weight: 22 },
];

const PROTECTIVE_PATTERNS: TonePattern[] = [
  { regex: /opportunity to cure|cure (window|period)/i, label: 'cure period', weight: 26 },
  { regex: /prior written notice|days'? (prior )?written notice/i, label: 'prior written notice', weight: 24 },
  { regex: /written notice of breach|written consent/i, label: 'written notice requirement', weight: 22 },
  { regex: /commercially reasonable( efforts)?|reasonable commercial efforts/i, label: 'commercially reasonable standard', weight: 25 },
  { regex: /good faith|duty of care|prudent|best efforts/i, label: 'good faith standard', weight: 20 },
  { regex: /provided,?\s*however/i, label: 'protective proviso', weight: 20 },
  { regex: /except (in the case|in the event|for gross negligence|for willful misconduct)/i, label: 'liability carve-out', weight: 26 },
  { regex: /carve-?out|safe harbor|to the extent permitted/i, label: 'safe harbor', weight: 25 },
  { regex: /aggregate liability shall not exceed|capped at|maximum liability/i, label: 'liability ceiling', weight: 26 },
  { regex: /limitation of liability|sole and exclusive remedy/i, label: 'exclusive remedy cap', weight: 22 },
  { regex: /hold (in|proprietary information in) (strict )?confidence/i, label: 'confidentiality protection', weight: 25 },
  { regex: /confidentiality|non-disclosure|safeguard|trade secrets?/i, label: 'safeguard covenant', weight: 20 },
  { regex: /force majeure|beyond (its|the party's|reasonable) control|excused from performance/i, label: 'force majeure relief', weight: 24 },
  { regex: /pro-rata refund|refund of unearned/i, label: 'remedial refund', weight: 22 },
  { regex: /subject to Section/i, label: 'conditional qualification', weight: 18 },
  { regex: /retains all right, title/i, label: 'IP retention', weight: 24 },
  { regex: /mitigate damages/i, label: 'damage mitigation duty', weight: 22 },
];

const NEUTRAL_PATTERNS: TonePattern[] = [
  { regex: /governed by the laws of|jurisdiction|venue/i, label: 'governing law', weight: 25 },
  { regex: /construed in accordance with|executed in counterparts/i, label: 'standard construction', weight: 22 },
  { regex: /severability|entire agreement|headings (are )?for convenience/i, label: 'standard boilerplate', weight: 24 },
  { regex: /ordinary course of business|net 30|business days/i, label: 'standard business terms', weight: 20 },
  { regex: /delivered via (electronic mail|email|certified mail)/i, label: 'notice delivery mechanic', weight: 20 },
  { regex: /either party|neither party|both parties|mutually agreed/i, label: 'bilateral mutuality', weight: 25 },
  { regex: /mutual written agreement|each party/i, label: 'reciprocal covenant', weight: 24 },
  { regex: /as defined herein|shall mean|for purposes of this/i, label: 'contractual definition', weight: 20 },
  { regex: /prevailing party shall be entitled to recover/i, label: 'bilateral fee shifting', weight: 22 },
];

/**
 * Builds standard configuration and attorney-grade explanations for a determined tone sentiment
 */
function buildToneConfig(
  sentiment: ClauseToneSentiment,
  score: number,
  markers: string[],
  clause: CriticalClauseAudit
): ClauseToneConfig {
  const markerString = markers.length > 0 ? markers.join(', ') : 'linguistic structure';

  switch (sentiment) {
    case 'Assertive':
      return {
        sentiment: 'Assertive',
        score,
        label: 'Assertive',
        badge: 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:bg-purple-500/25',
        dot: 'bg-purple-400',
        icon: 'Flame',
        partyIntentSummary: 'Commands unilateral compliance, strict obligations, or aggressive liability shifting.',
        keyMarkers: markers,
        tooltip: `Legalese Tone: Assertive (${score}% Intensity) • Party Intent: Commands unilateral compliance, strict liability, or aggressive enforcement (Cues: ${markerString}).`,
        strategicAdvice: 'Counter with reciprocal obligations, notice-and-cure periods, and mutual liability caps.'
      };

    case 'Protective':
      return {
        sentiment: 'Protective',
        score,
        label: 'Protective',
        badge: 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25',
        dot: 'bg-sky-400',
        icon: 'Shield',
        partyIntentSummary: 'Safeguards party exposure via liability caps, cure mechanisms, or defensive carve-outs.',
        keyMarkers: markers,
        tooltip: `Legalese Tone: Protective (${score}% Intensity) • Party Intent: Safeguards exposure via liability limitations, cure windows, or defensive carve-outs (Cues: ${markerString}).`,
        strategicAdvice: 'Preserve these defensive safe harbors and verify that notice timeframes align with internal operations.'
      };

    case 'Neutral':
    default:
      return {
        sentiment: 'Neutral',
        score,
        label: 'Neutral',
        badge: 'bg-slate-800/90 border-slate-700/80 text-slate-300 hover:bg-slate-750',
        dot: 'bg-slate-400',
        icon: 'Scale',
        partyIntentSummary: 'Establishes balanced procedural administration, standard governance, and reciprocal terms.',
        keyMarkers: markers,
        tooltip: `Legalese Tone: Neutral (${score}% Intensity) • Party Intent: Balanced procedural governance and standard administrative terms (Cues: ${markerString}).`,
        strategicAdvice: 'Standard administrative mechanism; review for operational fit with low legal negotiation priority.'
      };
  }
}

/**
 * Analyzes the legalese tone of a clause to gauge the drafting party's intent
 * Categorizes into Assertive, Protective, or Neutral with associated confidence and markers.
 */
export function analyzeClauseLegaleseTone(clause: CriticalClauseAudit): ClauseToneConfig {
  // If the clause already has a predefined sentiment (e.g. from structured audit/server), use it
  if (clause.legalese_tone === 'Assertive' || clause.legalese_tone === 'Neutral' || clause.legalese_tone === 'Protective') {
    return buildToneConfig(clause.legalese_tone, 88, [], clause);
  }

  const combinedText = [
    clause.verbatim_quote || '',
    clause.plain_english_meaning || '',
    (clause.hidden_pitfalls || []).join(' ')
  ].join(' ');

  let assertiveScore = 0;
  let protectiveScore = 0;
  let neutralScore = 0;

  const detectedAssertive: string[] = [];
  const detectedProtective: string[] = [];
  const detectedNeutral: string[] = [];

  for (const pat of ASSERTIVE_PATTERNS) {
    if (pat.regex.test(combinedText)) {
      assertiveScore += pat.weight;
      detectedAssertive.push(pat.label);
    }
  }

  for (const pat of PROTECTIVE_PATTERNS) {
    if (pat.regex.test(combinedText)) {
      protectiveScore += pat.weight;
      detectedProtective.push(pat.label);
    }
  }

  for (const pat of NEUTRAL_PATTERNS) {
    if (pat.regex.test(combinedText)) {
      neutralScore += pat.weight;
      detectedNeutral.push(pat.label);
    }
  }

  // Factor in favored party asymmetry
  const party = (clause.party_favored || '').toLowerCase();
  const isCounterparty = party.includes('vendor') || party.includes('landlord') || party.includes('company') || party.includes('licensor');
  const isClient = party.includes('client') || party.includes('customer') || party.includes('tenant') || party.includes('contractor');
  const isMutual = party.includes('mutual') || party.includes('reciprocal') || party.includes('both');

  if (isCounterparty) {
    if (clause.risk_level === 'CRITICAL' || clause.risk_level === 'HIGH') {
      assertiveScore += 30;
    } else {
      assertiveScore += 12;
    }
  } else if (isClient) {
    protectiveScore += 25;
  } else if (isMutual) {
    if (detectedProtective.length > 0) {
      protectiveScore += 25;
    }
    neutralScore += 20;
    if (clause.risk_level === 'LOW' && detectedProtective.length === 0) {
      neutralScore += 15;
    }
  }

  // Factor in category heuristics
  const cat = (clause.clause_category || '').toLowerCase();
  if (cat.includes('indemnity') && isCounterparty) {
    assertiveScore += 20;
  } else if (cat.includes('confidentiality') && (isMutual || isClient || clause.risk_level === 'LOW')) {
    protectiveScore += 20;
  } else if (cat.includes('termination') && detectedProtective.length > 0) {
    protectiveScore += 15;
  } else if (cat.includes('dispute') && !combinedText.includes('regardless of the prevailing party')) {
    neutralScore += 15;
  }

  // Check pitfalls
  const pitfalls = clause.hidden_pitfalls || [];
  if (pitfalls.length >= 2 && (clause.risk_level === 'CRITICAL' || clause.risk_level === 'HIGH')) {
    assertiveScore += Math.min(pitfalls.length * 6, 24);
  }

  // Determine winning sentiment
  let sentiment: ClauseToneSentiment;
  let winningScore: number;
  let winningMarkers: string[];

  if (assertiveScore > protectiveScore && assertiveScore >= neutralScore && assertiveScore >= 20) {
    sentiment = 'Assertive';
    const total = assertiveScore + protectiveScore + neutralScore + 10;
    winningScore = Math.min(98, Math.max(68, Math.round(50 + (assertiveScore / total) * 50)));
    winningMarkers = Array.from(new Set(detectedAssertive)).slice(0, 3);
  } else if (protectiveScore >= assertiveScore && (protectiveScore >= neutralScore || detectedProtective.length >= 2) && protectiveScore >= 20) {
    sentiment = 'Protective';
    const total = assertiveScore + protectiveScore + neutralScore + 10;
    winningScore = Math.min(98, Math.max(65, Math.round(50 + (protectiveScore / total) * 50)));
    winningMarkers = Array.from(new Set(detectedProtective)).slice(0, 3);
  } else {
    sentiment = 'Neutral';
    const total = assertiveScore + protectiveScore + neutralScore + 10;
    winningScore = Math.min(95, Math.max(55, Math.round(50 + (neutralScore / total) * 50)));
    winningMarkers = Array.from(new Set(detectedNeutral)).slice(0, 3);
  }

  return buildToneConfig(sentiment, winningScore, winningMarkers, clause);
}

/**
 * Convenient alias for analyzeClauseLegaleseTone
 */
export const getClauseToneSentiment = analyzeClauseLegaleseTone;
