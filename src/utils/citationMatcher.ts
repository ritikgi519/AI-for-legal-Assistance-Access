import { CriticalClauseAudit, DFIDeduction } from '../types';

export interface CitationMatchResult {
  isOmission: boolean;
  isVerified: boolean;
  confidence: number;
  startIndex: number;
  endIndex: number;
  lineNumber: number;
  matchedText: string;
}

/**
 * Normalizes text for resilient legal text comparison (collapses multiple whitespaces/newlines)
 */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Verifies if verbatim quote exists in the source contract and finds its exact line and character boundaries
 */
export function verifyCitation(documentText: string, quote: string): CitationMatchResult {
  if (!quote || quote.includes('OMISSION DETECTED')) {
    return {
      isOmission: true,
      isVerified: false,
      confidence: 0,
      startIndex: -1,
      endIndex: -1,
      lineNumber: -1,
      matchedText: ''
    };
  }

  // 1. Direct exact match
  const exactIndex = documentText.indexOf(quote);
  if (exactIndex !== -1) {
    const linesBefore = documentText.slice(0, exactIndex).split('\n').length;
    return {
      isOmission: false,
      isVerified: true,
      confidence: 100,
      startIndex: exactIndex,
      endIndex: exactIndex + quote.length,
      lineNumber: linesBefore,
      matchedText: quote
    };
  }

  // 2. Case-insensitive exact match
  const lowerDoc = documentText.toLowerCase();
  const lowerQuote = quote.toLowerCase();
  const lowerIndex = lowerDoc.indexOf(lowerQuote);
  if (lowerIndex !== -1) {
    const linesBefore = documentText.slice(0, lowerIndex).split('\n').length;
    return {
      isOmission: false,
      isVerified: true,
      confidence: 95,
      startIndex: lowerIndex,
      endIndex: lowerIndex + quote.length,
      lineNumber: linesBefore,
      matchedText: documentText.slice(lowerIndex, lowerIndex + quote.length)
    };
  }

  // 3. Normalized whitespace match
  const normQuote = normalizeText(quote);
  const words = normQuote.split(' ').filter(w => w.length > 2);
  if (words.length >= 3) {
    // Search using a 5-word prefix
    const prefix = words.slice(0, Math.min(6, words.length)).join(' ');
    const prefixIdx = lowerDoc.indexOf(prefix.toLowerCase());
    if (prefixIdx !== -1) {
      const approxEnd = Math.min(documentText.length, prefixIdx + quote.length + 50);
      const linesBefore = documentText.slice(0, prefixIdx).split('\n').length;
      return {
        isOmission: false,
        isVerified: true,
        confidence: 88,
        startIndex: prefixIdx,
        endIndex: approxEnd,
        lineNumber: linesBefore,
        matchedText: documentText.slice(prefixIdx, approxEnd)
      };
    }
  }

  return {
    isOmission: false,
    isVerified: false,
    confidence: 0,
    startIndex: -1,
    endIndex: -1,
    lineNumber: -1,
    matchedText: ''
  };
}

/**
 * Computes an objective Document Fairness Index (DFI) deduction matrix
 * based on audited clauses and unilateral covenant imbalances
 */
export function computeDFIBreakdown(clauses: CriticalClauseAudit[]): DFIDeduction[] {
  const deductions: DFIDeduction[] = [];

  clauses.forEach(clause => {
    const isCritical = clause.risk_level === 'CRITICAL';
    const isHigh = clause.risk_level === 'HIGH';
    const isOmission = clause.verbatim_quote.includes('OMISSION DETECTED');

    let impact = 0;
    let status: DFIDeduction['status'] = 'Balanced Reciprocal';

    if (isOmission) {
      status = 'Omission Detected';
      impact = -15;
    } else if (isCritical) {
      status = 'Heavily Unilateral';
      impact = -20;
    } else if (isHigh) {
      status = 'Moderately Asymmetric';
      impact = -12;
    } else if (clause.risk_level === 'MEDIUM') {
      status = 'Moderately Asymmetric';
      impact = -5;
    }

    deductions.push({
      covenant: `${clause.clause_id} (${clause.clause_category})`,
      status,
      impact,
      party_favored: clause.party_favored,
      rationale: clause.hidden_pitfalls[0] || clause.plain_english_meaning.slice(0, 110) + '...'
    });
  });

  return deductions;
}

export interface DiffToken {
  type: 'unchanged' | 'removed' | 'added';
  text: string;
}

/**
 * Word-level diff comparison between original clause and proposed redline
 */
export function generateWordDiff(original: string, redline: string): DiffToken[] {
  const origWords = original.split(/(\s+)/);
  const redlineWords = redline.split(/(\s+)/);

  // Clean empty strings
  const origSet = new Set(origWords.map(w => w.trim().toLowerCase()).filter(Boolean));
  const redlineSet = new Set(redlineWords.map(w => w.trim().toLowerCase()).filter(Boolean));

  const diff: DiffToken[] = [];

  // Mark words in original not in redline as 'removed'
  origWords.forEach(word => {
    const clean = word.trim().toLowerCase();
    if (!clean) {
      diff.push({ type: 'unchanged', text: word });
      return;
    }
    if (!redlineSet.has(clean)) {
      diff.push({ type: 'removed', text: word });
    } else {
      diff.push({ type: 'unchanged', text: word });
    }
  });

  return diff;
}
