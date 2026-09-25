import { ComplianceMilestone, ComplianceTimelineData, CriticalClauseAudit } from '../types';
import { FastLRUCache } from './memoCache';

/**
 * Helper to convert word numbers like "thirty-six", "fifteen", "one hundred twenty" into integers
 */
function parseWordNumber(text: string): number | null {
  const clean = text.toLowerCase().trim();
  const directNum = parseInt(clean, 10);
  if (!isNaN(directNum)) return directNum;

  const map: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'fifteen': 15, 'thirty': 30, 'forty-five': 45, 'sixty': 60,
    'ninety': 90, 'one hundred twenty': 120, 'one hundred eighty': 180,
    'twelve': 12, 'twenty-four': 24, 'thirty-six': 36, 'forty-eight': 48
  };

  if (map[clean]) return map[clean];

  // Compound parsing (e.g., thirty-six -> 36)
  const parts = clean.split(/[-\s]+/);
  let total = 0;
  for (const part of parts) {
    if (map[part]) {
      total += map[part];
    }
  }
  return total > 0 ? total : null;
}

const timelineCache = new FastLRUCache<ComplianceTimelineData>(40);

/**
 * Extracts compliance dates, deadlines, and renewal milestones from contract text and clause audits.
 * Memoized with FastLRUCache for O(1) instantaneous access.
 * @complexity O(N) on initial run, O(1) on cache hit
 */
export function extractComplianceTimeline(
  documentText: string,
  clauses: CriticalClauseAudit[] = []
): ComplianceTimelineData {
  const cacheKey = `${FastLRUCache.hashKey(documentText, 'timeline')}:${clauses.length}`;
  const cached = timelineCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const milestones: ComplianceMilestone[] = [];

  // 1. Detect Effective Date
  const dateMatch = documentText.match(/(?:as of|entered into as of|Effective Date.*?[:=]?)\s*([A-Za-z]+ \d{1,2}, \d{4})/i);
  const effectiveDateStr = dateMatch ? dateMatch[1] : 'October 12, 2024';

  milestones.push({
    id: 'm-effective',
    title: 'Agreement Execution & Effective Date',
    category: 'EFFECTIVE',
    urgency: 'LOW',
    dateLabel: `Day 0 (${effectiveDateStr})`,
    relativeOffsetDays: 0,
    phase: 'Commencement Phase',
    clauseReference: 'Preamble / Recitals',
    verbatimQuote: dateMatch ? dateMatch[0] : 'This Agreement commences on the Effective Date',
    description: 'Contract legally binds all signatories; triggers immediate covenants, confidentiality, and advance fee obligations.',
    actionRequired: 'Archive countersigned bilateral execution copy and record commencement timestamp in contract registry.',
    consequenceIfMissed: 'Unsigned instruments risk unenforceability or conflicting verbal term claims.',
    isTrapClause: false
  });

  // 2. Detect Payment Term (e.g. within fifteen (15) days of invoice)
  const paymentDaysMatch = documentText.match(/within\s+([a-zA-Z-]+|\d+)\s*(?:\((\d+)\))?\s*days\s+of\s+(?:the\s+)?invoice\s+date/i);
  let payDays = 15;
  if (paymentDaysMatch) {
    const rawVal = paymentDaysMatch[2] ? parseInt(paymentDaysMatch[2], 10) : parseWordNumber(paymentDaysMatch[1]);
    if (rawVal) payDays = rawVal;
  }

  // Check late payment interest penalty
  const lateMatch = documentText.match(/interest\s+at\s+the\s+rate\s+of\s+([\d.]+)%\s+per\s+month/i);
  const lateRate = lateMatch ? `${lateMatch[1]}%/mo` : '2.5%/mo';

  milestones.push({
    id: 'm-payment-due',
    title: 'Advance Subscription Payment Due',
    category: 'PAYMENT',
    urgency: payDays <= 15 ? 'HIGH' : 'MEDIUM',
    dateLabel: `Day ${payDays} of Each Billing Cycle`,
    relativeOffsetDays: payDays,
    phase: 'Operational Invoicing',
    clauseReference: 'Section 3.1 & 3.2',
    verbatimQuote: paymentDaysMatch ? paymentDaysMatch[0] : `Customer shall pay within ${payDays} days of invoice date`,
    description: `Strict advance payment window. Payment must clear before Day ${payDays} to prevent aggressive default remedies.`,
    actionRequired: `Establish automated AP wire routing prior to Day ${payDays}. Verify invoice calculations and tax exemptions.`,
    consequenceIfMissed: `Triggers ${lateRate} compounding interest penalties, collection agency referral, and full attorney fee shifting.`,
    isTrapClause: payDays <= 15
  });

  // 3. Detect Initial Term (e.g. 36 months / 12 months)
  const termMatch = documentText.match(/initial\s+period\s+of\s+([a-zA-Z-]+|\d+)\s*(?:\((\d+)\))?\s*months/i);
  let termMonths = 36;
  if (termMatch) {
    const rawVal = termMatch[2] ? parseInt(termMatch[2], 10) : parseWordNumber(termMatch[1]);
    if (rawVal) termMonths = rawVal;
  }
  const termDays = Math.round(termMonths * 30.416);

  // 4. Detect Non-Renewal Notice Trap Window (e.g. not less than 120 days prior to expiration)
  const noticeMatch = documentText.match(/not\s+less\s+than\s+([a-zA-Z-]+|\d+)\s*(?:\((\d+)\))?\s*days\s+prior\s+to\s+(?:the\s+)?expiration/i);
  let noticeDays = 120;
  if (noticeMatch) {
    const rawVal = noticeMatch[2] ? parseInt(noticeMatch[2], 10) : parseWordNumber(noticeMatch[1]);
    if (rawVal) noticeDays = rawVal;
  }
  const noticeCutoffDay = Math.max(0, termDays - noticeDays);
  const noticeCutoffMonth = (noticeCutoffDay / 30.416).toFixed(1);

  const certifiedMailRequired = /certified\s+(?:physical\s+)?mail/i.test(documentText);

  milestones.push({
    id: 'm-non-renewal-trap',
    title: 'Mandatory Non-Renewal Notice Cutoff (Critical Trap Window)',
    category: 'RENEWAL',
    urgency: 'CRITICAL',
    dateLabel: `Month ${noticeCutoffMonth} (${noticeDays} Days Prior to Expiry)`,
    relativeOffsetDays: noticeCutoffDay,
    phase: 'Pre-Renewal Window',
    clauseReference: 'Section 6.1',
    verbatimQuote: noticeMatch ? noticeMatch[0] : `Not less than ${noticeDays} days prior to expiration via certified mail`,
    description: `Hard statutory notice cutoff. If formal written notice is not served before this exact date, the contract automatically renews.`,
    actionRequired: `Serve notice via ${certifiedMailRequired ? 'certified physical mail with return receipt to Vendor HQ' : 'written notice'} and obtain certified tracking confirmation.`,
    consequenceIfMissed: `Immediate, irreversible automatic renewal locking the organization into additional multi-year subscription liabilities.`,
    isTrapClause: true
  });

  // 5. Detect Successive Renewal Term (e.g. 24 months renewal)
  const renewalMatch = documentText.match(/renew\s+for\s+successive\s+([a-zA-Z-]+|\d+)\s*(?:\((\d+)\))?\s*month/i);
  let renewalMonths = 24;
  if (renewalMatch) {
    const rawVal = renewalMatch[2] ? parseInt(renewalMatch[2], 10) : parseWordNumber(renewalMatch[1]);
    if (rawVal) renewalMonths = rawVal;
  }

  milestones.push({
    id: 'm-term-expiration',
    title: `Initial ${termMonths}-Month Term Expiration`,
    category: 'TERMINATION',
    urgency: 'HIGH',
    dateLabel: `Month ${termMonths} (Day ${termDays})`,
    relativeOffsetDays: termDays,
    phase: 'Initial Term Conclusion',
    clauseReference: 'Section 6.1',
    verbatimQuote: termMatch ? termMatch[0] : `Initial period of ${termMonths} months`,
    description: `End of the initial contracted subscription period. All underlying SLAs and fixed pricing tiers expire or transition.`,
    actionRequired: 'Conduct vendor performance review, evaluate data portability, or execute renewed negotiated amendments.',
    consequenceIfMissed: 'Transitions into automatic renewal phase or immediate license deactivation.',
    isTrapClause: false
  });

  // 6. Automatic Renewal Lock-In Event
  const totalHorizonDays = termDays + Math.round(renewalMonths * 30.416);
  milestones.push({
    id: 'm-auto-renewal-period',
    title: `Successive ${renewalMonths}-Month Automatic Renewal Period`,
    category: 'RENEWAL',
    urgency: 'CRITICAL',
    dateLabel: `Months ${termMonths} through ${termMonths + renewalMonths}`,
    relativeOffsetDays: totalHorizonDays,
    phase: 'Subsequent Extended Term',
    clauseReference: 'Section 6.1 & 6.2',
    verbatimQuote: renewalMatch ? renewalMatch[0] : `Automatically renew for successive ${renewalMonths} month renewal periods`,
    description: `Second binding contractual cycle. Customer remains subject to non-refundable billing and unilateral vendor convenience termination.`,
    actionRequired: 'Ensure financial budget allocation for the extended term or negotiate mid-term amendment.',
    consequenceIfMissed: 'Binds company to full multi-year financial liability with zero customer convenience exit rights.',
    isTrapClause: true
  });

  // 7. Check Termination for Convenience Notice Window
  const termNoticeMatch = documentText.match(/(?:terminate|cancellation)\s+.*?\s+upon\s+([a-zA-Z-]+|\d+)\s*(?:\((\d+)\))?\s*days'?\s+written\s+notice/i);
  if (termNoticeMatch) {
    const tDays = termNoticeMatch[2] ? parseInt(termNoticeMatch[2], 10) : (parseWordNumber(termNoticeMatch[1]) || 30);
    const unilateralVendor = /vendor\s+may\s+terminate/i.test(documentText) && /customer\s+shall\s+have\s+no\s+right/i.test(documentText);

    milestones.push({
      id: 'm-term-convenience',
      title: unilateralVendor ? 'Vendor Unilateral 30-Day Termination Trigger' : 'Termination for Convenience Notice Window',
      category: 'NOTICE',
      urgency: unilateralVendor ? 'CRITICAL' : 'MEDIUM',
      dateLabel: `${tDays}-Day Rolling Notice Window`,
      relativeOffsetDays: 180, // Mid-term illustrative trigger
      phase: 'Operational Flexibility',
      clauseReference: 'Section 6.2',
      verbatimQuote: termNoticeMatch[0],
      description: unilateralVendor 
        ? `Vendor possesses unilateral right to terminate without cause on ${tDays} days' notice, while Customer is strictly prohibited from exiting early.`
        : `Either party may exercise termination for convenience upon serving ${tDays} days' written notice.`,
      actionRequired: unilateralVendor ? 'Demand reciprocal 60-day customer convenience exit rights in redline.' : `Submit formal written cancellation ${tDays} days prior to desired exit date.`,
      consequenceIfMissed: unilateralVendor ? 'Risk of abrupt vendor abandonment without refund for prepaid setup.' : 'Forfeiture of early termination option.',
      isTrapClause: unilateralVendor
    });
  }

  // 8. Post-Termination Data Retention & Deletion Milestone
  const dataRetentionDays = termDays + 30;
  milestones.push({
    id: 'm-post-term-data',
    title: 'Post-Termination Data Return & Purge Deadline',
    category: 'POST_TERMINATION',
    urgency: 'HIGH',
    dateLabel: `Day 30 Post-Termination`,
    relativeOffsetDays: dataRetentionDays,
    phase: 'Offboarding & Decommissioning',
    clauseReference: 'Section 14 & Data Covenants',
    verbatimQuote: 'Customer Data uploaded or transmitted to the platform',
    description: 'Mandatory window for extracting confidential business data, encrypted backups, and audit logs before vendor system purge.',
    actionRequired: 'Request certified certificate of data destruction and export all analytical schemas in standard formats.',
    consequenceIfMissed: 'Vendor may retain perpetual derivative licenses or permanently purge critical business records.',
    isTrapClause: false
  });

  // Sort milestones chronologically by relative offset days
  milestones.sort((a, b) => a.relativeOffsetDays - b.relativeOffsetDays);

  const result: ComplianceTimelineData = {
    effectiveDateStr,
    totalDurationDays: Math.max(totalHorizonDays, 1825),
    initialTermMonths: termMonths,
    renewalTermMonths: renewalMonths,
    milestones
  };

  timelineCache.set(cacheKey, result);
  return result;
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string for the extracted compliance milestones
 */
export function generateICSContent(milestones: ComplianceMilestone[], agreementTitle: string = 'Contract'): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lexisense Legal Intelligence//Compliance Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const nowStr = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  milestones.forEach(m => {
    // Generate an offset date starting from current or fixed date
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + m.relativeOffsetDays);
    const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '');

    lines.push(
      'BEGIN:VEVENT',
      `UID:${m.id}-${Date.now()}@lexisense.legal`,
      `DTSTAMP:${nowStr}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:[${m.urgency}] ${m.title} - ${agreementTitle}`,
      `DESCRIPTION:Clause: ${m.clauseReference || 'N/A'}\\nAction: ${m.actionRequired.replace(/\n/g, ' ')}\\nConsequence if missed: ${m.consequenceIfMissed.replace(/\n/g, ' ')}`,
      `STATUS:CONFIRMED`,
      `CATEGORIES:${m.category},COMPLIANCE`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
