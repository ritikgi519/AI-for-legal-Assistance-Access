/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CriticalClauseAudit, RiskRadarNode, RiskRewardQuadrant, RadarCategoryAggregate, RiskLevel } from '../types';
import { FastLRUCache } from './memoCache';

const radarCache = new FastLRUCache<{
  nodes: RiskRadarNode[];
  categoryAggregates: RadarCategoryAggregate[];
  quadrantCounts: Record<RiskRewardQuadrant, number>;
}>(40);

/**
 * Calculates risk score (0-100) based on severity, favored party, and hidden pitfalls
 */
function calculateClauseRiskScore(clause: CriticalClauseAudit): number {
  let baseScore = 20;

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

  // Adjust for unilateral party advantage
  const party = (clause.party_favored || '').toLowerCase();
  if (party.includes('vendor') || party.includes('counterparty') || party.includes('landlord') || party.includes('employer') || party.includes('unilateral')) {
    baseScore += 6;
  } else if (party.includes('mutual') || party.includes('client') || party.includes('reciprocal')) {
    baseScore -= 6;
  }

  // Pitfalls add blast radius & risk
  const pitfalls = clause.hidden_pitfalls || [];
  baseScore += Math.min(pitfalls.length * 3, 10);

  // Clamp 5 - 98
  return Math.max(5, Math.min(98, Math.round(baseScore)));
}

/**
 * Calculates strategic reward / operational protective value (0-100)
 */
function calculateClauseRewardScore(clause: CriticalClauseAudit): number {
  const cat = (clause.clause_category || '').toLowerCase();
  let baseReward = 50;

  // High strategic asset categories
  if (cat.includes('ip') || cat.includes('intellectual') || cat.includes('patent') || cat.includes('data')) {
    baseReward = 86;
  } else if (cat.includes('payment') || cat.includes('fee') || cat.includes('revenue')) {
    baseReward = 78;
  } else if (cat.includes('confidential') || cat.includes('trade secret') || cat.includes('nda')) {
    baseReward = 74;
  } else if (cat.includes('termination') || cat.includes('exit') || cat.includes('transition')) {
    baseReward = 68;
  } else if (cat.includes('warranty') || cat.includes('sla') || cat.includes('service level')) {
    baseReward = 62;
  } else if (cat.includes('indemnity') || cat.includes('liability')) {
    // If client/mutual, indemnity provides high defense shield; if unilateral counterparty, value is lower
    const party = (clause.party_favored || '').toLowerCase();
    baseReward = party.includes('counterparty') || party.includes('vendor') ? 28 : 55;
  } else if (cat.includes('dispute') || cat.includes('jurisdiction') || cat.includes('arbitration')) {
    baseReward = 38;
  } else {
    // General boilerplate
    baseReward = 32;
  }

  // Reciprocal clauses grant higher operational equity
  const party = (clause.party_favored || '').toLowerCase();
  if (party.includes('client') || party.includes('customer') || party.includes('employee')) {
    baseReward += 10;
  } else if (party.includes('mutual') || party.includes('reciprocal')) {
    baseReward += 5;
  } else if (party.includes('vendor') || party.includes('counterparty')) {
    baseReward -= 8;
  }

  return Math.max(8, Math.min(95, Math.round(baseReward)));
}

/**
 * Categorizes node into one of four Risk-Reward quadrants
 */
export function determineQuadrant(risk: number, reward: number): RiskRewardQuadrant {
  if (risk >= 50 && reward < 50) return 'TOXIC_PITFALL';
  if (risk >= 50 && reward >= 50) return 'STRATEGIC_BET';
  if (risk < 50 && reward >= 50) return 'GOLDEN_COVENANT';
  return 'STANDARD_BOILERPLATE';
}

/**
 * Returns user-facing metadata for each quadrant
 */
export function getQuadrantMeta(quadrant: RiskRewardQuadrant) {
  switch (quadrant) {
    case 'TOXIC_PITFALL':
      return {
        label: 'Toxic Pitfalls',
        shortDesc: 'High Risk, Low Reward',
        action: 'Mandatory Redline / Strike',
        color: '#f43f5e', // rose-500
        bgColor: 'bg-rose-500/10',
        borderColor: 'border-rose-500/30',
        textColor: 'text-rose-400',
        glowColor: 'rgba(244, 63, 94, 0.35)',
        badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-800/60'
      };
    case 'STRATEGIC_BET':
      return {
        label: 'Strategic Bets',
        shortDesc: 'High Risk, High Reward',
        action: 'Cap Exposure & Hedge',
        color: '#f59e0b', // amber-500
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        glowColor: 'rgba(245, 158, 11, 0.35)',
        badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-800/60'
      };
    case 'GOLDEN_COVENANT':
      return {
        label: 'Golden Covenants',
        shortDesc: 'Low Risk, High Reward',
        action: 'Preserve & Defend',
        color: '#10b981', // emerald-500
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-400',
        glowColor: 'rgba(16, 185, 129, 0.35)',
        badgeBg: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
      };
    case 'STANDARD_BOILERPLATE':
      return {
        label: 'Boilerplate & Administrative',
        shortDesc: 'Low Risk, Low Reward',
        action: 'Standard Audit Check',
        color: '#64748b', // slate-500
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        textColor: 'text-slate-400',
        glowColor: 'rgba(100, 116, 139, 0.35)',
        badgeBg: 'bg-slate-900/60 text-slate-300 border-slate-700/60'
      };
  }
}

/**
 * Transforms contractual clauses into an interactive D3 Risk Radar dataset
 */
export function buildRiskRadarData(
  clauses: CriticalClauseAudit[],
  docTitle = ''
): {
  nodes: RiskRadarNode[];
  categoryAggregates: RadarCategoryAggregate[];
  quadrantCounts: Record<RiskRewardQuadrant, number>;
} {
  const cacheKey = FastLRUCache.hashKey(
    clauses.map(c => `${c.clause_id}:${c.risk_level}:${c.party_favored}`).join('|') + docTitle,
    'radar'
  );

  const cached = radarCache.get(cacheKey);
  if (cached) return cached;

  const quadrantCounts: Record<RiskRewardQuadrant, number> = {
    TOXIC_PITFALL: 0,
    STRATEGIC_BET: 0,
    GOLDEN_COVENANT: 0,
    STANDARD_BOILERPLATE: 0
  };

  const categoryMap = new Map<string, { totalRisk: number; totalReward: number; count: number; criticalCount: number; maxRisk: number; maxRiskClause: string }>();

  const nodes: RiskRadarNode[] = clauses.map((clause, idx) => {
    const riskScore = calculateClauseRiskScore(clause);
    const rewardScore = calculateClauseRewardScore(clause);
    const quadrant = determineQuadrant(riskScore, rewardScore);
    quadrantCounts[quadrant]++;

    // Dynamic blast radius sizing: 10px to 22px
    const blastRadius = Math.round(10 + (riskScore / 100) * 8 + ((clause.hidden_pitfalls?.length || 0) * 1.5));

    // Update category map
    const cat = clause.clause_category || 'General';
    const existing = categoryMap.get(cat) || { totalRisk: 0, totalReward: 0, count: 0, criticalCount: 0, maxRisk: 0, maxRiskClause: clause.clause_id };
    existing.totalRisk += riskScore;
    existing.totalReward += rewardScore;
    existing.count += 1;
    if (clause.risk_level === 'CRITICAL') existing.criticalCount += 1;
    if (riskScore > existing.maxRisk) {
      existing.maxRisk = riskScore;
      existing.maxRiskClause = clause.clause_id;
    }
    categoryMap.set(cat, existing);

    return {
      id: `radar-node-${clause.clause_id || idx}`,
      clauseId: clause.clause_id || `Clause ${idx + 1}`,
      title: `${clause.clause_id || 'Clause'} · ${clause.clause_category || 'General'}`,
      category: clause.clause_category || 'General',
      riskScore,
      rewardScore,
      blastRadius,
      quadrant,
      riskLevel: clause.risk_level,
      verbatimQuote: clause.verbatim_quote,
      plainEnglishMeaning: clause.plain_english_meaning,
      partyFavored: clause.party_favored,
      hiddenPitfalls: clause.hidden_pitfalls || [],
      proposedRedline: clause.proposed_redline,
      lineNumber: clause.line_number
    };
  });

  const categoryAggregates: RadarCategoryAggregate[] = Array.from(categoryMap.entries()).map(([category, stats]) => ({
    category,
    avgRisk: Math.round(stats.totalRisk / stats.count),
    avgReward: Math.round(stats.totalReward / stats.count),
    count: stats.count,
    criticalCount: stats.criticalCount,
    maxRiskClause: stats.maxRiskClause
  })).sort((a, b) => b.avgRisk - a.avgRisk);

  const result = {
    nodes,
    categoryAggregates,
    quadrantCounts
  };

  radarCache.set(cacheKey, result);
  return result;
}
