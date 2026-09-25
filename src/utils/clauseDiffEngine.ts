/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DetailedDiffToken {
  type: 'unchanged' | 'removed' | 'added';
  text: string;
  isKeyLegalTerm?: boolean;
  legalCategory?: 'liability' | 'damages' | 'carveout' | 'mutuality' | 'term' | 'indemnity' | 'remedy';
}

export interface KeyLegalModification {
  id: string;
  category: string;
  label: string;
  detail: string;
  severity: 'critical' | 'favorable' | 'neutral';
  direction: 'added_protection' | 'removed_restriction' | 'balanced_allocation';
  badge: string;
}

export interface DiffComparisonAnalysis {
  sourceText: string;
  targetText: string;
  sourceLabel: string;
  targetLabel: string;
  addedWordsCount: number;
  removedWordsCount: number;
  unchangedWordsCount: number;
  similarityPercentage: number;
  inlineTokens: DetailedDiffToken[];
  sourceTokens: DetailedDiffToken[];
  targetTokens: DetailedDiffToken[];
  keyModifications: KeyLegalModification[];
}

const KEY_LEGAL_TERMS_PATTERNS: Array<{
  pattern: RegExp;
  category: DetailedDiffToken['legalCategory'];
}> = [
  { pattern: /\b(aggregate\s+liability|liability\s+cap|fees\s+paid|twelve\s+\(12\)\s+months|12\s+months|supercap)\b/i, category: 'liability' },
  { pattern: /\b(consequential|indirect|incidental|punitive|exemplary|special\s+damages|loss\s+of\s+profits|business\s+interruption)\b/i, category: 'damages' },
  { pattern: /\b(gross\s+negligence|willful\s+misconduct|confidentiality\s+obligations|intentional\s+misconduct)\b/i, category: 'carveout' },
  { pattern: /\b(mutual|mutually|reciprocal|each\s+party|either\s+party|bilateral)\b/i, category: 'mutuality' },
  { pattern: /\b(indemnif\w*|defend|hold\s+harmless|third-party\s+claims|infringement)\b/i, category: 'indemnity' },
  { pattern: /\b(sole\s+and\s+exclusive|exclusive\s+remedy|remedies|as-is|disclaim\w*)\b/i, category: 'remedy' },
  { pattern: /\b(cure\s+period|30\s+days|thirty\s+\(30\)\s+days|material\s+breach|written\s+notice)\b/i, category: 'term' },
];

/**
 * Tokenize string into words and whitespace
 */
function tokenizeText(text: string): string[] {
  if (!text) return [];
  return text.match(/\S+|\s+/g) || [];
}

/**
 * Clean token for matching purposes
 */
function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
}

/**
 * Check if a word or token matches a key legal term
 */
function checkKeyLegalTerm(text: string): { isKey: boolean; category?: DetailedDiffToken['legalCategory'] } {
  for (const { pattern, category } of KEY_LEGAL_TERMS_PATTERNS) {
    if (pattern.test(text)) {
      return { isKey: true, category };
    }
  }
  return { isKey: false };
}

/**
 * Computes Longest Common Subsequence (LCS) matrix between two token arrays
 */
function computeLCS(tokensA: string[], tokensB: string[]): number[][] {
  const m = tokensA.length;
  const n = tokensB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    const wordA = normalizeWord(tokensA[i - 1]);
    for (let j = 1; j <= n; j++) {
      const wordB = normalizeWord(tokensB[j - 1]);
      if (wordA && wordB && wordA === wordB) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

/**
 * Extracts substantive legal modifications between source (current) and target (legal standard or previous version)
 */
export function detectKeyLegalModifications(
  source: string, 
  target: string, 
  category?: string
): KeyLegalModification[] {
  const modifications: KeyLegalModification[] = [];
  const srcLower = source.toLowerCase();
  const tgtLower = target.toLowerCase();

  // 1. Mutuality & Reciprocity
  const srcHasMutual = /\b(mutual|mutually|reciprocal|each party|either party)\b/.test(srcLower);
  const tgtHasMutual = /\b(mutual|mutually|reciprocal|each party|either party)\b/.test(tgtLower);
  const srcHasUnilateral = /\b(customer shall|provider shall|solely|exclusive discretion)\b/.test(srcLower);

  if (!srcHasMutual && tgtHasMutual) {
    modifications.push({
      id: 'mutuality-shift',
      category: 'Mutuality & Reciprocity',
      label: 'Converted to Reciprocal Covenant',
      detail: 'Replaces unilateral one-way risk obligation with bilateral reciprocal protection for both parties.',
      severity: 'favorable',
      direction: 'balanced_allocation',
      badge: 'Reciprocal Allocation'
    });
  } else if (srcHasMutual && !tgtHasMutual && srcHasUnilateral) {
    modifications.push({
      id: 'mutuality-unilateral',
      category: 'Mutuality & Reciprocity',
      label: 'Deviates to One-Sided Allocation',
      detail: 'Unilateral covenant allocates performance liability exclusively to one party.',
      severity: 'critical',
      direction: 'removed_restriction',
      badge: 'Asymmetric'
    });
  }

  // 2. Consequential Damages Waiver
  const srcHasConsequential = /\b(consequential|indirect|punitive|loss of profits|exemplary)\b/.test(srcLower);
  const tgtHasConsequential = /\b(consequential|indirect|punitive|loss of profits|exemplary)\b/.test(tgtLower);

  if (!srcHasConsequential && tgtHasConsequential) {
    modifications.push({
      id: 'consequential-damages-waiver',
      category: 'Damages Limitation',
      label: 'Added Consequential Damages Waiver',
      detail: 'Shields parties from speculative claims, including lost revenue, profits, business interruption, and punitive damages.',
      severity: 'favorable',
      direction: 'added_protection',
      badge: 'Consequential Waiver'
    });
  }

  // 3. Aggregate Fee Cap
  const srcHasCap = /\b(aggregate liability|shall in no event exceed|fees actually paid|12 months|twelve \(12\) months)\b/.test(srcLower);
  const tgtHasCap = /\b(aggregate liability|shall in no event exceed|fees actually paid|12 months|twelve \(12\) months)\b/.test(tgtLower);

  if (!srcHasCap && tgtHasCap) {
    modifications.push({
      id: 'liability-fee-cap',
      category: 'Liability Cap',
      label: 'Introduced 12-Month Aggregate Cap',
      detail: 'Places a commercial ceiling on financial exposure limited to trailing 12-month fees paid or payable.',
      severity: 'favorable',
      direction: 'added_protection',
      badge: '12-Month Cap'
    });
  } else if (tgtLower.includes('supercap') && !srcLower.includes('supercap')) {
    modifications.push({
      id: 'supercap-protection',
      category: 'Liability Cap',
      label: 'Added Data / SLA Supercap Guardrail',
      detail: 'Creates separate 2x-3x multiplier supercap specifically covering data privacy and SLA defaults.',
      severity: 'favorable',
      direction: 'added_protection',
      badge: 'Data Supercap'
    });
  }

  // 4. Carve-Outs (Gross Negligence & Willful Misconduct)
  const srcHasCarveouts = /\b(gross negligence|willful misconduct|confidentiality obligations)\b/.test(srcLower);
  const tgtHasCarveouts = /\b(gross negligence|willful misconduct|confidentiality obligations)\b/.test(tgtLower);

  if (!srcHasCarveouts && tgtHasCarveouts) {
    modifications.push({
      id: 'market-carveouts',
      category: 'Risk Carve-Outs',
      label: 'Narrowed Intentional Misconduct Carve-Outs',
      detail: 'Properly preserves liability exceptions strictly for intentional misconduct, gross negligence, and breach of confidentiality.',
      severity: 'neutral',
      direction: 'balanced_allocation',
      badge: 'Standard Carve-Outs'
    });
  }

  // 5. Indemnification Scope & Third-Party Claims
  const srcHasIndem = /\b(indemnif|hold harmless|defend)\b/.test(srcLower);
  const tgtHasIndem = /\b(indemnif|hold harmless|defend)\b/.test(tgtLower);
  const tgtHasThirdParty = /\b(third-party claims|third party)\b/.test(tgtLower);
  const srcHasThirdParty = /\b(third-party claims|third party)\b/.test(srcLower);

  if (tgtHasIndem && tgtHasThirdParty && (!srcHasThirdParty && srcHasIndem)) {
    modifications.push({
      id: 'third-party-indemnity-limit',
      category: 'Indemnification',
      label: 'Restricted to Third-Party Claims',
      detail: 'Prevents indemnity from being weaponized for direct intra-party contractual breach claims.',
      severity: 'favorable',
      direction: 'added_protection',
      badge: 'Third-Party Defense Only'
    });
  }

  // 6. Notice and Cure Periods
  const srcHasCure = /\b(cure period|30 days|thirty \(30\) days|written notice)\b/.test(srcLower);
  const tgtHasCure = /\b(cure period|30 days|thirty \(30\) days|written notice)\b/.test(tgtLower);

  if (!srcHasCure && tgtHasCure) {
    modifications.push({
      id: 'cure-period-safeguard',
      category: 'Termination & Default',
      label: 'Added 30-Day Written Cure Period',
      detail: 'Mandates prior written notice with a mandatory 30-day opportunity to cure prior to any declaration of default.',
      severity: 'favorable',
      direction: 'added_protection',
      badge: '30-Day Cure Period'
    });
  }

  // 7. Warranties and Exclusive Remedy
  const srcHasAsIs = /\b(as-is|as is|without warranty)\b/.test(srcLower);
  const tgtHasWarranty = /\b(warrants that|professional standards|workmanlike)\b/.test(tgtLower);

  if (srcHasAsIs && tgtHasWarranty) {
    modifications.push({
      id: 'warranty-restoration',
      category: 'Warranty & Performance',
      label: 'Express Commercial Warranty Restored',
      detail: 'Replaces absolute "AS-IS" disclaimer with commercially standard express performance warranties.',
      severity: 'favorable',
      direction: 'added_protection',
      badge: 'Express Warranty'
    });
  }

  // Fallback generic modification if text has significant changes but no specific category matched
  if (modifications.length === 0) {
    const wordCountA = source.trim().split(/\s+/).length;
    const wordCountB = target.trim().split(/\s+/).length;
    const delta = Math.abs(wordCountA - wordCountB);
    
    if (delta > 3 || source.trim() !== target.trim()) {
      modifications.push({
        id: 'legal-language-refinement',
        category: 'Language Modernization',
        label: 'Commercial Standard Precision Wording',
        detail: 'Harmonizes phrasing, legal definitions, and covenants with ABA and Delaware commercial model standards.',
        severity: 'neutral',
        direction: 'balanced_allocation',
        badge: 'Model Standard'
      });
    }
  }

  return modifications;
}

/**
 * Computes complete diff analysis comparing source clause against target standard or previous version
 */
export function analyzeClauseDiff(
  sourceText: string,
  targetText: string,
  sourceLabel: string = 'Current Clause',
  targetLabel: string = 'Legal Standard',
  category?: string
): DiffComparisonAnalysis {
  const isSourceOmission = sourceText.includes('[OMISSION DETECTED]') || sourceText.includes('OMISSION DETECTED');
  
  if (isSourceOmission) {
    // Special handling for missing covenants/omissions
    const targetTokensList = tokenizeText(targetText);
    const addedTokens: DetailedDiffToken[] = targetTokensList.map(text => {
      const { isKey, category } = checkKeyLegalTerm(text);
      return {
        type: 'added',
        text,
        isKeyLegalTerm: isKey,
        legalCategory: category
      };
    });

    const keyMods = detectKeyLegalModifications('', targetText, category);
    if (!keyMods.some(m => m.id === 'omission-remedied')) {
      keyMods.unshift({
        id: 'omission-remedied',
        category: 'Omission Remediation',
        label: 'Missing Protective Covenant Supplied',
        detail: 'The baseline instrument entirely omitted this essential covenant; adopting this model instates required protections.',
        severity: 'favorable',
        direction: 'added_protection',
        badge: 'Omission Remedied'
      });
    }

    return {
      sourceText,
      targetText,
      sourceLabel,
      targetLabel,
      addedWordsCount: targetTokensList.filter(t => t.trim().length > 0).length,
      removedWordsCount: 0,
      unchangedWordsCount: 0,
      similarityPercentage: 0,
      inlineTokens: addedTokens,
      sourceTokens: [{ type: 'removed', text: sourceText }],
      targetTokens: addedTokens,
      keyModifications: keyMods
    };
  }

  const tokensA = tokenizeText(sourceText);
  const tokensB = tokenizeText(targetText);

  const dp = computeLCS(tokensA, tokensB);

  let i = tokensA.length;
  let j = tokensB.length;

  const inlineRev: DetailedDiffToken[] = [];
  const sourceRev: DetailedDiffToken[] = [];
  const targetRev: DetailedDiffToken[] = [];

  let addedWords = 0;
  let removedWords = 0;
  let unchangedWords = 0;

  while (i > 0 || j > 0) {
    const textA = i > 0 ? tokensA[i - 1] : '';
    const textB = j > 0 ? tokensB[j - 1] : '';
    const wordA = normalizeWord(textA);
    const wordB = normalizeWord(textB);

    if (i > 0 && j > 0 && wordA && wordB && wordA === wordB) {
      // Unchanged token
      const isWhitespace = textA.trim().length === 0;
      if (!isWhitespace) unchangedWords++;
      const { isKey, category: legCat } = checkKeyLegalTerm(textA);

      inlineRev.push({ type: 'unchanged', text: textA, isKeyLegalTerm: isKey, legalCategory: legCat });
      sourceRev.push({ type: 'unchanged', text: textA, isKeyLegalTerm: isKey, legalCategory: legCat });
      targetRev.push({ type: 'unchanged', text: textB, isKeyLegalTerm: isKey, legalCategory: legCat });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      // Token added in target
      const isWhitespace = textB.trim().length === 0;
      if (!isWhitespace) addedWords++;
      const { isKey, category: legCat } = checkKeyLegalTerm(textB);

      inlineRev.push({ type: 'added', text: textB, isKeyLegalTerm: isKey, legalCategory: legCat });
      targetRev.push({ type: 'added', text: textB, isKeyLegalTerm: isKey, legalCategory: legCat });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      // Token removed from source
      const isWhitespace = textA.trim().length === 0;
      if (!isWhitespace) removedWords++;
      const { isKey, category: legCat } = checkKeyLegalTerm(textA);

      inlineRev.push({ type: 'removed', text: textA, isKeyLegalTerm: isKey, legalCategory: legCat });
      sourceRev.push({ type: 'removed', text: textA, isKeyLegalTerm: isKey, legalCategory: legCat });
      i--;
    }
  }

  const inlineTokens = inlineRev.reverse();
  const sourceTokens = sourceRev.reverse();
  const targetTokens = targetRev.reverse();

  const totalWords = unchangedWords + removedWords + addedWords;
  const similarityPercentage = totalWords > 0 
    ? Math.round((unchangedWords / Math.max(tokensA.length, tokensB.length)) * 100)
    : 100;

  const keyModifications = detectKeyLegalModifications(sourceText, targetText, category);

  return {
    sourceText,
    targetText,
    sourceLabel,
    targetLabel,
    addedWordsCount: addedWords,
    removedWordsCount: removedWords,
    unchangedWordsCount: unchangedWords,
    similarityPercentage: Math.max(0, Math.min(100, similarityPercentage)),
    inlineTokens,
    sourceTokens,
    targetTokens,
    keyModifications
  };
}
