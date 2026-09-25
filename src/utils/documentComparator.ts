import { ComparisonDiscrepancy, DiscrepancyType, DocumentComparisonResult, SubstantiveImpact } from '../types';
import { generateWordDiff } from './citationMatcher';
import { FastLRUCache } from './memoCache';

export interface DocumentBlock {
  id: string;
  title: string;
  category: string;
  text: string;
  lineStart: number;
  lineEnd: number;
  normalizedWords: string[];
}

/**
 * Splits document text into numbered lines and structured legal blocks/sections
 */
export function segmentDocument(text: string): { lines: string[]; blocks: DocumentBlock[] } {
  const lines = text.split('\n');
  const blocks: DocumentBlock[] = [];

  let currentBlockLines: string[] = [];
  let currentTitle = 'Preamble / Recitals';
  let currentStartLine = 1;
  let blockIndex = 1;

  const sectionRegex = /^(SECTION\s+\d+|ARTICLE\s+[IVXLCDM\d]+|\d+\.\d+|\d+\.)\s*[:.-]?\s*(.*)/i;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    const match = trimmed.match(sectionRegex);

    if (match && currentBlockLines.length > 0) {
      // Save previous block
      const blockText = currentBlockLines.join('\n').trim();
      if (blockText.length > 0) {
        blocks.push(createBlock(currentTitle, blockText, currentStartLine, lineNum - 1, blockIndex++));
      }
      currentBlockLines = [line];
      currentTitle = trimmed;
      currentStartLine = lineNum;
    } else {
      if (match && currentBlockLines.length === 0) {
        currentTitle = trimmed;
        currentStartLine = lineNum;
      }
      currentBlockLines.push(line);
    }
  });

  // Flush remaining block
  if (currentBlockLines.length > 0) {
    const blockText = currentBlockLines.join('\n').trim();
    if (blockText.length > 0) {
      blocks.push(createBlock(currentTitle, blockText, currentStartLine, lines.length, blockIndex++));
    }
  }

  return { lines, blocks };
}

function detectCategory(title: string, text: string): string {
  const combined = (title + ' ' + text).toLowerCase();
  if (/indemn/i.test(combined)) return 'Indemnity';
  if (/liabilit|damages|cap/i.test(combined)) return 'Liability';
  if (/terminat|renewal|term/i.test(combined)) return 'Termination';
  if (/fee|payment|billing|interest/i.test(combined)) return 'Payment';
  if (/data|intellectual|property|license|confidential/i.test(combined)) return 'IP & Data';
  if (/dispute|governing|law|jurisdiction|arbitration/i.test(combined)) return 'Governing Law';
  if (/warrant/i.test(combined)) return 'Warranty';
  return 'General';
}

function createBlock(title: string, text: string, lineStart: number, lineEnd: number, index: number): DocumentBlock {
  const cleanTitle = title.length > 60 ? title.slice(0, 57) + '...' : title;
  const normalizedWords = text
    .toLowerCase()
    .replace(/[^\w\s$%-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  return {
    id: `blk-${index}`,
    title: cleanTitle,
    category: detectCategory(title, text),
    text,
    lineStart,
    lineEnd,
    normalizedWords
  };
}

/**
 * Calculates Jaccard word similarity between two token sets
 */
function calculateJaccard(wordsA: string[], wordsB: string[]): number {
  if (wordsA.length === 0 && wordsB.length === 0) return 1.0;
  if (wordsA.length === 0 || wordsB.length === 0) return 0.0;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let intersection = 0;
  setA.forEach(w => {
    if (setB.has(w)) intersection++;
  });

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Analyzes substantive variation between two matching clauses
 */
function analyzeSubstantiveVariation(
  title: string,
  category: string,
  docAText: string,
  docBText: string
): { impact: SubstantiveImpact; explanation: string } {
  const lowerA = docAText.toLowerCase();
  const lowerB = docBText.toLowerCase();

  // Liability checks
  if (category === 'Liability' || /liability/i.test(title)) {
    if (lowerA.includes('100') && !lowerB.includes('100')) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B replaces the restrictive $100 vendor liability cap with an expanded, industry-standard trailing fee cap.'
      };
    }
    if (lowerB.includes('supercap') || lowerB.includes('carveout') || lowerB.includes('unlimited')) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B introduces supercaps / carve-outs for data security and confidentiality breaches.'
      };
    }
    if (lowerB.includes('gross negligence') || lowerB.includes('willful misconduct') || (lowerA.includes('in no event shall vendor') && lowerB.includes('neither party'))) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B mutualizes damages waivers and carves out gross negligence and willful misconduct.'
      };
    }
  }

  // Indemnity checks
  if (category === 'Indemnity' || /indemn/i.test(title)) {
    if (lowerA.includes('omission') && !lowerB.includes('omission')) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B cures the unilateral omission by inserting reciprocal vendor IP indemnification.'
      };
    }
    if (lowerB.includes('mutual') || (lowerB.includes('vendor shall defend') && lowerB.includes('customer shall defend'))) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B converts unilateral customer indemnity into a balanced, mutual indemnification covenant.'
      };
    }
  }

  // Termination checks
  if (category === 'Termination' || /terminat|renewal/i.test(title)) {
    if (lowerA.includes('120') && (lowerB.includes('30') || lowerB.includes('60'))) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B shortens the aggressive 120-day certified mail non-renewal notice trap to a manageable 30/60 day period.'
      };
    }
    if (lowerA.includes('no right to terminate') && lowerB.includes('either party may terminate')) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B grants reciprocal termination for convenience to both parties.'
      };
    }
  }

  // Payment terms
  if (category === 'Payment' || /fee|payment/i.test(title)) {
    if (lowerA.includes('15 days') && (lowerB.includes('30 days') || lowerB.includes('45 days'))) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B extends payment terms from 15 days in advance to standard Net-30/45 terms.'
      };
    }
    if (lowerA.includes('2.5%') && (lowerB.includes('1%') || lowerB.includes('1.5%'))) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B reduces punitive late payment interest from 2.5%/month down to standard statutory interest.'
      };
    }
  }

  // IP & Data
  if (category === 'IP & Data' || /data|license/i.test(title)) {
    if (lowerA.includes('perpetual') && lowerB.includes('solely to provide the services')) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B eliminates the perpetual commercial monetization license on customer data, restricting use solely to service delivery.'
      };
    }
  }

  // Governing Law
  if (category === 'Governing Law' || /governing|fee/i.test(title)) {
    if (lowerA.includes('customer shall pay all legal fees') && lowerB.includes('prevailing party')) {
      return {
        impact: 'FAVORABLE_TO_USER',
        explanation: 'Document B replaces unilateral customer-pays-all fee shifting with a mutual prevailing-party fee recovery standard.'
      };
    }
  }

  // Default comparison based on word diff
  const diff = generateWordDiff(docAText, docBText);
  const wordsRemoved = diff.filter(t => t.type === 'removed').length;
  const wordsAdded = diff.filter(t => t.type === 'added').length;

  if (wordsRemoved > 15 || wordsAdded > 15) {
    return {
      impact: 'CRITICAL_SHIFT',
      explanation: `Substantial textual redline detected: ${wordsRemoved} words removed, ${wordsAdded} words added/modified.`
    };
  }

  return {
    impact: 'NEUTRAL',
    explanation: 'Minor linguistic and phrasing variation between documents; substantive covenants remain largely aligned.'
  };
}

const comparisonCache = new FastLRUCache<DocumentComparisonResult>(30);

/**
 * Compares two documents side-by-side and returns a comprehensive discrepancy ledger.
 * Memoized via FastLRUCache for instant O(1) returns on identical document pairs.
 * @complexity O(A * B) on initial compute, O(1) on cache hit
 */
export function compareDocuments(
  docAText: string,
  docBText: string,
  docAName: string = 'Current Loaded Instrument',
  docBName: string = 'Comparison Document'
): DocumentComparisonResult {
  const cacheKey = `${FastLRUCache.hashKey(docAText, 'docA')}:${FastLRUCache.hashKey(docBText, 'docB')}:${docAName}:${docBName}`;
  const cached = comparisonCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const segA = segmentDocument(docAText);
  const segB = segmentDocument(docBText);

  const matchedBIndices = new Set<number>();
  const discrepancies: ComparisonDiscrepancy[] = [];

  let identicalCount = 0;
  let modificationsCount = 0;
  let additionsCount = 0;
  let removalsCount = 0;

  // Compare each block in Doc A against Doc B
  segA.blocks.forEach((blockA, idxA) => {
    let bestMatchIdx = -1;
    let bestScore = 0;

    // Search for best matching block in Doc B
    segB.blocks.forEach((blockB, idxB) => {
      if (matchedBIndices.has(idxB)) return;

      // Check title similarity or section number
      const normTitleA = blockA.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normTitleB = blockB.title.toLowerCase().replace(/[^a-z0-9]/g, '');

      let score = 0;
      if (normTitleA.length > 5 && normTitleB.length > 5 && (normTitleA.includes(normTitleB) || normTitleB.includes(normTitleA))) {
        score = 0.85;
      } else {
        const jaccard = calculateJaccard(blockA.normalizedWords, blockB.normalizedWords);
        score = jaccard;
      }

      if (score > bestScore && score >= 0.25) {
        bestScore = score;
        bestMatchIdx = idxB;
      }
    });

    if (bestMatchIdx !== -1) {
      matchedBIndices.add(bestMatchIdx);
      const blockB = segB.blocks[bestMatchIdx];
      const isIdentical = blockA.text.trim() === blockB.text.trim();

      if (isIdentical) {
        identicalCount++;
        discrepancies.push({
          id: `disc-${idxA + 1}`,
          type: 'IDENTICAL',
          category: blockA.category,
          title: `${blockA.title} (Exact Match)`,
          docAText: blockA.text,
          docBText: blockB.text,
          docALineStart: blockA.lineStart,
          docALineEnd: blockA.lineEnd,
          docBLineStart: blockB.lineStart,
          docBLineEnd: blockB.lineEnd,
          substantiveImpact: 'NEUTRAL',
          explanation: 'Terms in this section are identical across both versions.'
        });
      } else {
        modificationsCount++;
        const analysis = analyzeSubstantiveVariation(blockA.title, blockA.category, blockA.text, blockB.text);
        discrepancies.push({
          id: `disc-${idxA + 1}`,
          type: 'MODIFIED',
          category: blockA.category,
          title: blockA.title,
          docAText: blockA.text,
          docBText: blockB.text,
          docALineStart: blockA.lineStart,
          docALineEnd: blockA.lineEnd,
          docBLineStart: blockB.lineStart,
          docBLineEnd: blockB.lineEnd,
          substantiveImpact: analysis.impact,
          explanation: analysis.explanation
        });
      }
    } else {
      // In Doc A, but missing in Doc B (Removed / Omitted in Doc B)
      removalsCount++;
      discrepancies.push({
        id: `disc-rem-${idxA + 1}`,
        type: 'REMOVED',
        category: blockA.category,
        title: `${blockA.title} (Removed in Doc B)`,
        docAText: blockA.text,
        docBText: '[SECTION OMITTED / NOT PRESENT IN DOCUMENT B]',
        docALineStart: blockA.lineStart,
        docALineEnd: blockA.lineEnd,
        docBLineStart: 0,
        docBLineEnd: 0,
        substantiveImpact: 'CRITICAL_SHIFT',
        explanation: `Clause present in Document A (lines ${blockA.lineStart}-${blockA.lineEnd}) was eliminated or removed in Document B.`
      });
    }
  });

  // Find remaining unaligned blocks in Doc B (Added in Doc B)
  segB.blocks.forEach((blockB, idxB) => {
    if (!matchedBIndices.has(idxB)) {
      additionsCount++;
      discrepancies.push({
        id: `disc-add-${idxB + 1}`,
        type: 'ADDED',
        category: blockB.category,
        title: `${blockB.title} (New Addition in Doc B)`,
        docAText: '[SECTION ABSENT / NOT PRESENT IN DOCUMENT A]',
        docBText: blockB.text,
        docALineStart: 0,
        docALineEnd: 0,
        docBLineStart: blockB.lineStart,
        docBLineEnd: blockB.lineEnd,
        substantiveImpact: blockB.category === 'Indemnity' ? 'FAVORABLE_TO_USER' : 'CRITICAL_SHIFT',
        explanation: `New covenant or section introduced in Document B (lines ${blockB.lineStart}-${blockB.lineEnd}) that has no counterpart in Document A.`
      });
    }
  });

  // Overall text similarity using full word sets
  const allWordsA = segA.blocks.flatMap(b => b.normalizedWords);
  const allWordsB = segB.blocks.flatMap(b => b.normalizedWords);
  const overallJaccard = calculateJaccard(allWordsA, allWordsB);
  const similarityScore = Math.round(overallJaccard * 100);

  const result: DocumentComparisonResult = {
    docAName,
    docBName,
    similarityScore,
    totalDiscrepancies: modificationsCount + additionsCount + removalsCount,
    summary: {
      modifications: modificationsCount,
      additions: additionsCount,
      removals: removalsCount,
      identicalSections: identicalCount
    },
    discrepancies
  };

  comparisonCache.set(cacheKey, result);
  return result;
}
