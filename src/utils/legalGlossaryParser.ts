import { GlossaryCategory, GlossaryTerm, GlossaryTermOccurrence } from '../types';
import { FastLRUCache } from './memoCache';

interface GlossaryDefinitionTemplate {
  id: string;
  term: string;
  canonicalTerm: string;
  category: GlossaryCategory;
  patterns: (string | RegExp)[];
  plainEnglishDefinition: string;
  whyPartiesUseIt: string;
  hiddenPitfallOrRisk: string;
  proTipsForNegotiation: string;
  riskSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export const CANONICAL_GLOSSARY_DEFINITIONS: GlossaryDefinitionTemplate[] = [
  {
    id: 'indemnify',
    term: 'Indemnification & Hold Harmless',
    canonicalTerm: 'Indemnify',
    category: 'Liability & Risk',
    patterns: [/\bindemn(?:ify|ification|ifying|ified)?\b/i, /\bhold\s+harmless\b/i, /\bdefend(?:ing|ed|s)?\b/i],
    plainEnglishDefinition: 'A promise by one party to pay for the legal fees, damages, or settlements that the other party suffers if a third party sues them.',
    whyPartiesUseIt: 'Shifts financial responsibility for legal disputes from the innocent party to the party creating or controlling the underlying risk (e.g. intellectual property infringement or negligence).',
    hiddenPitfallOrRisk: 'Uncapped or unilateral indemnity can bankrupt a company. If you agree to indemnify a counterparty without mutual reciprocity or without excluding consequential damages, you become their de facto insurance provider.',
    proTipsForNegotiation: 'Always make indemnity reciprocal. Insert explicit liability caps, limit coverage strictly to final unappealable third-party judgments, and demand sole control over the legal defense strategy.',
    riskSeverity: 'HIGH'
  },
  {
    id: 'consequential-damages',
    term: 'Consequential / Indirect Damages Waiver',
    canonicalTerm: 'Consequential Damages',
    category: 'Liability & Risk',
    patterns: [/\bconsequential\s+damages\b/i, /\bindirect\s+damages\b/i, /\bincidental\s+damages\b/i, /\blost\s+profits\b/i, /\bpunitive\s+damages\b/i, /\bspecial\s+damages\b/i],
    plainEnglishDefinition: 'Damages that do not flow directly from the contract breach itself, but result from the downstream fallout or secondary consequences (such as lost business revenue, reputational harm, or lost sales).',
    whyPartiesUseIt: 'Protects vendors from unpredictable, astronomical business claims (e.g. if software is down for 1 hour, vendor avoids paying for millions in lost customer sales).',
    hiddenPitfallOrRisk: 'If a vendor severely breaches confidentiality or loses all your data, a mutual consequential damages waiver may prevent you from recovering your actual business losses or breach notification expenses.',
    proTipsForNegotiation: 'Carve out data security breaches, confidentiality violations, and third-party indemnity from the consequential damages waiver so you can recover downstream remediation costs.',
    riskSeverity: 'HIGH'
  },
  {
    id: 'limitation-of-liability',
    term: 'Limitation of Liability (Aggregate Cap)',
    canonicalTerm: 'Limitation of Liability',
    category: 'Liability & Risk',
    patterns: [/\blimitation\s+of\s+liability\b/i, /\baggregate\s+liability\b/i, /\btotal\s+cumulative\s+liability\b/i, /\bmaximum\s+aggregate\b/i],
    plainEnglishDefinition: 'The absolute maximum dollar amount one party can ever recover from the other, regardless of how catastrophic the breach or damages may be.',
    whyPartiesUseIt: 'Allows businesses to quantify and insure their worst-case financial exposure under a contract.',
    hiddenPitfallOrRisk: 'Extremely low nominal caps (e.g. $100 or fees paid in the prior 1 month) effectively render all other contractual guarantees and representations completely toothless.',
    proTipsForNegotiation: 'Replace static nominal dollar amounts (like $100) with a multiple of trailing contract fees (e.g. 12 months fees paid or payable) plus a heightened "super-cap" (2x-3x) for data protection and indemnity.',
    riskSeverity: 'HIGH'
  },
  {
    id: 'force-majeure',
    term: 'Force Majeure ("Superior Force")',
    canonicalTerm: 'Force Majeure',
    category: 'Boilerplate & Trap',
    patterns: [/\bforce\s+majeure\b/i, /\bacts?\s+of\s+god\b/i, /\bcivil\s+strife\b/i, /\bunforeseen\s+circumstances\b/i],
    plainEnglishDefinition: 'A clause that excuses a party from performing their contractual duties when extraordinary, unforeseeable events outside their control occur (e.g. wars, natural disasters, epidemics).',
    whyPartiesUseIt: 'Prevents unfair breach penalties when performance becomes physically or legally impossible due to cataclysmic world events.',
    hiddenPitfallOrRisk: 'Often drafted broadly to excuse mundane failures like vendor server crashes, payment non-performance, or supplier supply chain delays.',
    proTipsForNegotiation: 'Ensure force majeure expressly excludes payment obligations. Add a rule stating that if the force majeure event lasts more than 30 consecutive days, the unaffected party can terminate without penalty.',
    riskSeverity: 'MEDIUM'
  },
  {
    id: 'severability',
    term: 'Severability (Blue-Pencil Doctrine)',
    canonicalTerm: 'Severability',
    category: 'Boilerplate & Trap',
    patterns: [/\bseverab(?:le|ility)\b/i, /\binvalid\s+or\s+unenforceable\b/i, /\bsevered\b/i],
    plainEnglishDefinition: 'States that if a court finds one specific clause illegal or unenforceable, the rest of the contract remains alive and fully valid.',
    whyPartiesUseIt: 'Prevents one bad or overreaching sentence from invalidating an entire multi-million dollar agreement.',
    hiddenPitfallOrRisk: 'If a core protective clause (like a non-compete or liability limit) is severed, the remaining obligations may become dangerously unbalanced against you.',
    proTipsForNegotiation: 'Ensure that if any severed provision drastically alters the fundamental economic bargain of the agreement, the parties are required to renegotiate in good faith.',
    riskSeverity: 'LOW'
  },
  {
    id: 'entire-agreement',
    term: 'Entire Agreement / Integration Clause',
    canonicalTerm: 'Entire Agreement',
    category: 'Boilerplate & Trap',
    patterns: [/\bentire\s+agreement\b/i, /\bmerger\s+clause\b/i, /\bsupersedes\s+all\s+prior\b/i, /\bsole\s+and\s+entire\s+understanding\b/i],
    plainEnglishDefinition: 'Declares that this written contract is the final and complete agreement, wiping out all prior emails, verbal promises, pitch decks, and sales demos.',
    whyPartiesUseIt: 'Creates legal certainty so neither side can point to previous email exchanges or verbal claims to contradict the contract.',
    hiddenPitfallOrRisk: 'Any promises made by the sales team during negotiations (such as "we will support this custom feature" or "we will never raise prices") are completely void unless written into the contract.',
    proTipsForNegotiation: 'Always incorporate side-letters, statements of work (SOWs), and verbal service commitments directly into exhibits or schedules attached to the master agreement.',
    riskSeverity: 'MEDIUM'
  },
  {
    id: 'attorney-fees',
    term: 'Attorney Fee Shifting',
    canonicalTerm: 'Fee Shifting',
    category: 'Remedies & Enforcement',
    patterns: [/\battorney(?:s|'s)?\s+fees\b/i, /\bprevailing\s+party\b/i, /\blegal\s+costs\b/i],
    plainEnglishDefinition: 'Requires the losing party in a legal arbitration or court dispute to pay all reasonable lawyer fees and court costs incurred by the winning party.',
    whyPartiesUseIt: 'Deters frivolous lawsuits and enables a party with a clear-cut claim to enforce their rights without having their recovery swallowed by legal bills.',
    hiddenPitfallOrRisk: 'If drafted unilaterally ("Customer shall pay Vendor\'s legal fees in any collection action"), the vendor can sue you with zero personal legal fee risk while you bear all the cost.',
    proTipsForNegotiation: 'Ensure the fee-shifting provision is strictly mutual, applies only to the "prevailing party," and is adjudicated by an independent court or arbitrator.',
    riskSeverity: 'HIGH'
  },
  {
    id: 'evergreen-renewal',
    term: 'Evergreen Clause (Automatic Renewal Trap)',
    canonicalTerm: 'Automatic Renewal',
    category: 'Administration & Notices',
    patterns: [/\bautomatic(?:ally)?\s+renew\b/i, /\bsuccessive\s+(?:term|period|renewal)\b/i, /\bevergreen\b/i],
    plainEnglishDefinition: 'The contract automatically renews for an additional term (often 12 to 36 months) unless a party provides written non-renewal notice inside a narrow window before the expiration date.',
    whyPartiesUseIt: 'Guarantees recurring enterprise revenue for vendors and ensures continuity of essential software services for buyers.',
    hiddenPitfallOrRisk: 'Vendors deliberately require 90 to 120 days advance notice via obscure methods (such as certified physical mail to headquarters). Missing the deadline by 24 hours locks you into years of unwanted payments.',
    proTipsForNegotiation: 'Cap renewal periods to month-to-month or require written affirmative opt-in. Demand that the vendor send a written reminder 30 days prior to the non-renewal deadline.',
    riskSeverity: 'HIGH'
  },
  {
    id: 'termination-convenience',
    term: 'Termination for Convenience',
    canonicalTerm: 'Termination for Convenience',
    category: 'Administration & Notices',
    patterns: [/\bterminate\s+without\s+cause\b/i, /\btermination\s+for\s+convenience\b/i, /\bat\s+any\s+time\s+without\s+cause\b/i],
    plainEnglishDefinition: 'The right to end the contract at any time for any reason (or no reason at all) by providing advance written notice, without having to prove a breach or wrongdoing.',
    whyPartiesUseIt: 'Provides strategic flexibility to walk away if corporate priorities change or budget cuts occur.',
    hiddenPitfallOrRisk: 'If unilateral (only the vendor can terminate for convenience, but the customer cannot), the vendor can abruptly ditch you while you remain locked in.',
    proTipsForNegotiation: 'Make convenience termination bilateral, or ensure that if a party terminates early, they refund any unearned prepaid subscription or service fees.',
    riskSeverity: 'HIGH'
  },
  {
    id: 'time-is-of-essence',
    term: 'Time is of the Essence',
    canonicalTerm: 'Time of the Essence',
    category: 'Remedies & Enforcement',
    patterns: [/\btime\s+is\s+of\s+the\s+essence\b/i],
    plainEnglishDefinition: 'A strict legal standard meaning that all dates and deadlines in the contract are vital material terms; being even one minute or one day late constitutes a full material breach.',
    whyPartiesUseIt: 'Prevents the other party from taking casual liberties with delivery schedules, payment dates, or notice windows.',
    hiddenPitfallOrRisk: 'Can be weaponized to terminate an entire contract or forfeit earnest money deposits over an innocent banking transfer delay.',
    proTipsForNegotiation: 'Pair this clause with an express 5- to 10-day notice and cure period before any delay can be treated as an actionable material breach.',
    riskSeverity: 'MEDIUM'
  },
  {
    id: 'survival-clause',
    term: 'Survival Clause',
    canonicalTerm: 'Survival Clause',
    category: 'Administration & Notices',
    patterns: [/\bshall\s+survive(?:\s+termination)?\b/i, /\bsurvival\b/i],
    plainEnglishDefinition: 'Specifies which rights and duties continue to bind both parties even after the contract has ended or been cancelled (e.g. confidentiality, liability caps, indemnity).',
    whyPartiesUseIt: 'Protects trade secrets and ensures that liabilities arising during the contract lifecycle can still be resolved legally after termination.',
    hiddenPitfallOrRisk: 'Broad survival of restrictive covenants (like non-solicitation or non-competes) can permanently restrain your business operations.',
    proTipsForNegotiation: 'Limit post-termination survival to a reasonable finite period (e.g. 2 to 3 years for confidentiality, excluding legitimate trade secrets).',
    riskSeverity: 'LOW'
  },
  {
    id: 'jury-waiver',
    term: 'Waiver of Jury Trial',
    canonicalTerm: 'Jury Trial Waiver',
    category: 'Remedies & Enforcement',
    patterns: [/\bwaive(?:s)?\s+(?:all\s+)?rights?\s+to\s+(?:a\s+)?trial\s+by\s+jury\b/i, /\bjury\s+trial\b/i],
    plainEnglishDefinition: 'Both parties give up their constitutional right to have a dispute decided by a citizen jury, agreeing instead that a judge or arbitrator will decide the case.',
    whyPartiesUseIt: 'Corporate entities prefer judges over juries because juries tend to sympathize with underdogs, employees, or smaller businesses and award unpredictable punitive damages.',
    hiddenPitfallOrRisk: 'Removes emotional leverage and populist defense claims in breach-of-contract disputes.',
    proTipsForNegotiation: 'Ensure jury waiver is strictly bilateral and is accompanied by a fair, neutral venue and governing law.',
    riskSeverity: 'LOW'
  },
  {
    id: 'as-is-warranty',
    term: 'As-Is / Warranty Disclaimer',
    canonicalTerm: 'Warranty Disclaimer',
    category: 'Liability & Risk',
    patterns: [/\b"as\s+is"\b/i, /\bas\s+is\b/i, /\bwith\s+all\s+faults\b/i, /\bmerchantability\b/i, /\bfitness\s+for\s+a\s+particular\s+purpose\b/i],
    plainEnglishDefinition: 'The provider disclaims all legal guarantees regarding quality, reliability, or usefulness. You take the product or service in whatever condition it happens to be, flaws included.',
    whyPartiesUseIt: 'Protects vendors from claims that their software, goods, or services failed to meet unstated expectations or standards.',
    hiddenPitfallOrRisk: 'If software is full of security vulnerabilities or doesn\'t work at all, an "As-Is" clause strips you of breach of warranty claims.',
    proTipsForNegotiation: 'Demand an express warranty that the services will conform in all material respects with documented user guides, published SLAs, and industry security benchmarks.',
    riskSeverity: 'HIGH'
  },
  {
    id: 'injunctive-relief',
    term: 'Injunctive / Equitable Relief',
    canonicalTerm: 'Injunctive Relief',
    category: 'Remedies & Enforcement',
    patterns: [/\binjunctive\s+relief\b/i, /\bequitable\s+relief\b/i, /\birreparable\s+harm\b/i],
    plainEnglishDefinition: 'A court order commanding a party to immediately stop doing something (or take a specific action), rather than just awarding money damages.',
    whyPartiesUseIt: 'Crucial for stopping the leak of trade secrets, data theft, or misuse of trademarks, where money damages cannot undo the damage.',
    hiddenPitfallOrRisk: 'Clauses that waive bond requirements make it very cheap and easy for a deep-pocketed counterparty to obtain an emergency restraining order that freezes your operations.',
    proTipsForNegotiation: 'Never stipulate that a breach "automatically causes irreparable harm"; require the moving party to actually prove harm to a judge before an injunction issues.',
    riskSeverity: 'MEDIUM'
  },
  {
    id: 'cumulative-remedies',
    term: 'Cumulative Remedies',
    canonicalTerm: 'Cumulative Remedies',
    category: 'Remedies & Enforcement',
    patterns: [/\bremedies\s+.*?\s+cumulative\b/i, /\bnot\s+exclusive\s+of\s+any\s+other\s+remedies\b/i],
    plainEnglishDefinition: 'A party can pursue every available legal penalty, lawsuit, fee, and court order simultaneously, rather than being forced to pick just one remedy.',
    whyPartiesUseIt: 'Ensures the non-breaching party doesn\'t forfeit statutory remedies by electing a contractually specified cure.',
    hiddenPitfallOrRisk: 'Allows aggressive parties to pile on damages, interest penalties, and termination actions at the same time.',
    proTipsForNegotiation: 'Ensure that specific agreed-upon clauses (like liquidated damages or service credits) are expressly designated as the "sole and exclusive remedy" for that failure.',
    riskSeverity: 'MEDIUM'
  },
  {
    id: 'liquidated-damages',
    term: 'Liquidated Damages',
    canonicalTerm: 'Liquidated Damages',
    category: 'Financial & Payment',
    patterns: [/\bliquidated\s+damages\b/i, /\bstipulated\s+sum\b/i],
    plainEnglishDefinition: 'A predetermined, fixed sum of money agreed in advance that one party must pay if they commit a specific breach (e.g. $1,000 per day of delay).',
    whyPartiesUseIt: 'Avoids costly court battles over trying to calculate and prove actual damages after a breach occurs.',
    hiddenPitfallOrRisk: 'If set disproportionately high relative to actual harm, it operates as an illegal penalty clause.',
    proTipsForNegotiation: 'Ensure liquidated damages serve as the exclusive financial remedy for that specific default event.',
    riskSeverity: 'MEDIUM'
  },
  {
    id: 'work-for-hire',
    term: 'Work Made for Hire & IP Assignment',
    canonicalTerm: 'Work Made for Hire',
    category: 'Intellectual Property',
    patterns: [/\bwork\s+made\s+for\s+hire\b/i, /\bassignment\s+of\s+inventions\b/i, /\bexclusive\s+property\b/i, /\btransfer\s+all\s+rights\b/i],
    plainEnglishDefinition: 'A legal doctrine where the hiring company automatically owns 100% of the copyright and IP created by the contractor or employee from the moment of creation.',
    whyPartiesUseIt: 'Ensures the business owns full title to its software code, designs, and content without needing secondary transfer deeds.',
    hiddenPitfallOrRisk: 'For vendors or consultants: may inadvertently assign your pre-existing core tools, libraries, or background IP to the client.',
    proTipsForNegotiation: 'Explicitly carve out "Background IP" and pre-existing code, granting the client only a perpetual license rather than outright assignment.',
    riskSeverity: 'HIGH'
  },
  {
    id: 'governing-law',
    term: 'Governing Law & Jurisdiction',
    canonicalTerm: 'Governing Law',
    category: 'Administration & Notices',
    patterns: [/\bgoverned\s+by\s+the\s+laws\b/i, /\bjurisdiction\b/i, /\bexclusive\s+venue\b/i, /\bforum\s+non\s+conveniens\b/i],
    plainEnglishDefinition: 'Specifies which state\'s laws interpret the contract and which city\'s courts have the exclusive authority to hear any legal dispute.',
    whyPartiesUseIt: 'Ensures predictability so businesses know what legal precedent applies.',
    hiddenPitfallOrRisk: 'Being forced to defend a lawsuit in a distant state or foreign country introduces crushing travel and out-of-state legal expenses.',
    proTipsForNegotiation: 'Default to your home state, or compromise on a neutral commercial jurisdiction with well-established corporate case law (like Delaware or New York).',
    riskSeverity: 'LOW'
  }
];

const glossaryParseCache = new FastLRUCache<{
  terms: GlossaryTerm[];
  totalOccurrences: number;
  highlightRegex: RegExp | null;
}>(50);

/**
 * Parses the document text, extracts occurrences of legal jargon, and returns enriched glossary terms.
 * Memoized with FastLRUCache for sub-millisecond lookups on repeated queries.
 * @complexity O(N) where N is number of lines in the document
 */
export function parseDocumentGlossary(documentText: string): {
  terms: GlossaryTerm[];
  totalOccurrences: number;
  highlightRegex: RegExp | null;
} {
  if (!documentText) {
    return { terms: [], totalOccurrences: 0, highlightRegex: null };
  }

  const cacheKey = FastLRUCache.hashKey(documentText, 'glossary');
  const cached = glossaryParseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const lines = documentText.split('\n');
  const matchedTerms: GlossaryTerm[] = [];
  let totalOccurrences = 0;
  const matchedPatterns: string[] = [];

  CANONICAL_GLOSSARY_DEFINITIONS.forEach(template => {
    const occurrences: GlossaryTermOccurrence[] = [];

    lines.forEach((line, index) => {
      const lineNo = index + 1;
      const hasMatch = template.patterns.some(pattern => {
        if (typeof pattern === 'string') {
          return line.toLowerCase().includes(pattern.toLowerCase());
        }
        return pattern.test(line);
      });

      if (hasMatch) {
        occurrences.push({
          lineNumber: lineNo,
          snippet: line.trim()
        });
      }
    });

    if (occurrences.length > 0) {
      totalOccurrences += occurrences.length;
      matchedTerms.push({
        id: template.id,
        term: template.term,
        canonicalTerm: template.canonicalTerm,
        category: template.category,
        plainEnglishDefinition: template.plainEnglishDefinition,
        whyPartiesUseIt: template.whyPartiesUseIt,
        hiddenPitfallOrRisk: template.hiddenPitfallOrRisk,
        proTipsForNegotiation: template.proTipsForNegotiation,
        occurrenceCount: occurrences.length,
        occurrences,
        riskSeverity: template.riskSeverity
      });

      // Collect keyword stems for global highlight regex
      matchedPatterns.push(template.canonicalTerm);
    }
  });

  // Sort matched terms by occurrence count descending, then risk severity
  matchedTerms.sort((a, b) => {
    if (b.riskSeverity === 'HIGH' && a.riskSeverity !== 'HIGH') return 1;
    if (a.riskSeverity === 'HIGH' && b.riskSeverity !== 'HIGH') return -1;
    return b.occurrenceCount - a.occurrenceCount;
  });

  // Build combined highlight regex
  let highlightRegex: RegExp | null = null;
  if (matchedPatterns.length > 0) {
    try {
      const escaped = matchedPatterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      highlightRegex = new RegExp(`\\b(${escaped})\\b`, 'gi');
    } catch {
      highlightRegex = null;
    }
  }

  const result = {
    terms: matchedTerms,
    totalOccurrences,
    highlightRegex
  };

  glossaryParseCache.set(cacheKey, result);
  return result;
}
