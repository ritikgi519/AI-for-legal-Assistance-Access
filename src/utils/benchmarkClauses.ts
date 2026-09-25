/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CriticalClauseAudit, RiskLevel } from '../types';

export interface BenchmarkStanceOption {
  stance: 'BALANCED' | 'PRO_CUSTOMER' | 'PRO_VENDOR';
  label: string;
  badge: string;
  boilerplateText: string;
  summary: string;
}

export interface IndustryBenchmarkClause {
  categoryKey: string;
  categoryName: string;
  title: string;
  governingStandard: string;
  marketPrevalence: string;
  defaultBoilerplate: string;
  standardProtections: string[];
  commonDefectsToLookFor: string[];
  attorneyRationale: string;
  stances: BenchmarkStanceOption[];
}

export interface BenchmarkComparisonAnalysis {
  clauseCategory: string;
  isCustomCategory: boolean;
  benchmarkTitle: string;
  governingStandard: string;
  mutualityStatus: {
    current: string;
    benchmark: string;
    isAligned: boolean;
  };
  riskRating: RiskLevel;
  keyGaps: string[];
  alignmentScore: number; // 0 to 100%
  strategicTakeaway: string;
}

/**
 * Standard industry benchmark clauses curated from ABA, NVCA, IACCM/WorldCC, and Delaware commercial standards
 */
export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmarkClause> = {
  liability: {
    categoryKey: 'liability',
    categoryName: 'Liability & Damages',
    title: 'Mutual Consequential Damages Waiver & 12-Month Aggregate Fee Cap',
    governingStandard: 'ABA Model Commercial Terms / NVCA Standard MSA',
    marketPrevalence: '88% adoption in Enterprise Software & Master Services Agreements',
    defaultBoilerplate: `EXCEPT FOR: (A) EITHER PARTY'S BREACH OF ITS CONFIDENTIALITY OBLIGATIONS UNDER SECTION [CONFIDENTIALITY]; (B) EITHER PARTY'S INDEMNIFICATION OBLIGATIONS UNDER SECTION [INDEMNIFICATION]; OR (C) EITHER PARTY'S GROSS NEGLIGENCE OR WILLFUL MISCONDUCT:

(I) NEITHER PARTY NOR ITS AFFILIATES SHALL BE LIABLE TO THE OTHER PARTY FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING LOSS OF PROFITS, BUSINESS INTERRUPTION, LOSS OF REPUTATION, OR LOSS OF DATA, ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, REGARDLESS OF THE CAUSE OF ACTION (WHETHER IN CONTRACT, TORT, OR OTHERWISE), EVEN IF ADVISED IN ADVANCE OF THE POSSIBILITY OF SUCH DAMAGES; AND

(II) EACH PARTY'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT, REGARDLESS OF THE FORUM AND REGARDLESS OF WHETHER ANY ACTION OR CLAIM IS BASED ON CONTRACT, TORT, OR OTHERWISE, SHALL IN NO EVENT EXCEED THE TOTAL AMOUNTS ACTUALLY PAID OR PAYABLE BY CUSTOMER TO PROVIDER UNDER THE APPLICABLE ORDER FORM IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO LIABILITY.`,
    standardProtections: [
      'Strictly mutual & reciprocal waiver of consequential, indirect, and punitive damages',
      'Liability capped to actual fees paid/payable in prior 12 months (or reasonable contract multiplier)',
      'Narrowly tailored carve-outs limited to intentional misconduct, confidentiality breach, and third-party indemnity',
      'Absence of nominal, uncommercial token caps ($100, $500, or arbitrary flat limits)'
    ],
    commonDefectsToLookFor: [
      'Unilateral liability cap shielding only the vendor while customer remains uncapped',
      'Consequential damages waiver carved out solely for customer payment liabilities',
      'Artificial token caps ($100 cap for multi-thousand dollar contracts)',
      'Uncapped exposure for data security or privacy incidents without an agreed super-cap'
    ],
    attorneyRationale: 'Standard commercial practice dictates bilateral risk allocation. Both parties forego speculative consequential damages while capping direct damages to the economic value of the contract over the preceding year.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (Reciprocal)',
        badge: 'Reciprocal 12-Month Cap',
        summary: 'Standard 12-month trailing fees paid cap with mutual consequential damages waiver and standard carve-outs.',
        boilerplateText: `EXCEPT FOR EITHER PARTY'S BREACH OF CONFIDENTIALITY, THIRD-PARTY INDEMNIFICATION OBLIGATIONS, OR GROSS NEGLIGENCE OR WILLFUL MISCONDUCT: (A) NEITHER PARTY SHALL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF PROFITS OR DATA); AND (B) EACH PARTY'S AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL NOT EXCEED THE TOTAL FEES PAID OR PAYABLE BY CUSTOMER TO PROVIDER IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (2x Supercap on Data Breach/SLA)',
        badge: 'Enhanced Customer Guardrails',
        summary: 'Incorporates a 2x-3x Supercap for data protection, confidentiality, and critical SLA defaults, plus reciprocal fee caps.',
        boilerplateText: `EXCEPT FOR EITHER PARTY'S INDEMNIFICATION OBLIGATIONS OR GROSS NEGLIGENCE, WHICH SHALL BE UNCAPPED: (A) NEITHER PARTY SHALL BE LIABLE FOR INDIRECT OR CONSEQUENTIAL DAMAGES; (B) EACH PARTY'S GENERAL AGGREGATE LIABILITY SHALL BE LIMITED TO THE TOTAL FEES PAID IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM; AND (C) NOTWITHSTANDING THE FOREGOING, LIABILITY FOR BREACHES OF DATA PRIVACY, SECURITY, OR CONFIDENTIALITY SHALL BE SUBJECT TO A SEPARATE SUPERCAP EQUAL TO TWO TIMES (2X) TOTAL CONTRACT FEES.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (6-Month Cap / Direct Damages Sole Remedy)',
        badge: 'Vendor Risk Shield',
        summary: 'Caps vendor exposure to 6 months of fees paid, excludes lost revenue, and specifies exclusive repair/credit remedies.',
        boilerplateText: `PROVIDER'S MAXIMUM AGGREGATE LIABILITY UNDER THIS AGREEMENT FOR ALL CLAIMS ARISING IN CONNECTION HEREWITH SHALL BE STRICTLY LIMITED TO FEES ACTUALLY RECEIVED BY PROVIDER IN THE SIX (6) MONTHS PRECEDING THE CLAIM. IN NO EVENT SHALL PROVIDER BE LIABLE FOR INDIRECT, INCIDENTAL, OR PUNITIVE DAMAGES, NOR LOSS OF BUSINESS REVENUE OR DATA.`
      }
    ]
  },

  indemnity: {
    categoryKey: 'indemnity',
    categoryName: 'Indemnification & Defense',
    title: 'Mutual Third-Party IP Infringement & Operational Defense Indemnity',
    governingStandard: 'IACCM / WorldCC Commercial Contracting Model Terms',
    marketPrevalence: '92% adoption in Commercial & Technology Contracts',
    defaultBoilerplate: `PROVIDER SHALL DEFEND, INDEMNIFY, AND HOLD HARMLESS CUSTOMER, ITS AFFILIATES, AND THEIR RESPECTIVE OFFICERS, DIRECTORS, AND EMPLOYEES FROM AND AGAINST ANY AND ALL THIRD-PARTY CLAIMS, SUITS, ACTIONS, DAMAGES, LIABILITIES, LOSSES, AND EXPENSES (INCLUDING REASONABLE ATTORNEYS' FEES) ARISING OUT OF OR ALLEGING THAT CUSTOMER'S AUTHORIZED USE OF THE SERVICES OR DELIVERABLES INFRINGES OR MISAPPROPRIATES ANY THIRD PARTY'S INTELLECTUAL PROPERTY RIGHTS.

CUSTOMER SHALL DEFEND, INDEMNIFY, AND HOLD HARMLESS PROVIDER FROM AND AGAINST ANY THIRD-PARTY CLAIMS ARISING OUT OF: (A) CUSTOMER'S GROSS NEGLIGENCE OR WILLFUL MISCONDUCT; OR (B) CUSTOMER DATA INFRINGING A THIRD PARTY'S RIGHTS WHEN USED IN STRICT COMPLIANCE WITH THIS AGREEMENT.

THE INDEMNIFIED PARTY SHALL: (I) PROVIDE PROMPT WRITTEN NOTICE OF ANY CLAIM TO THE INDEMNIFYING PARTY (PROVIDED DELAY SHALL NOT RELIEVE INDEMNIFYING PARTY EXCEPT TO THE EXTENT MATERIALLY PREJUDICED); (II) GRANT SOLE CONTROL OF THE DEFENSE AND SETTLEMENT, PROVIDED NO SETTLEMENT IMPOSES MONETARY LIABILITY, ADMISSION OF FAULT, OR INJUNCTION WITHOUT THE INDEMNIFIED PARTY'S PRIOR WRITTEN CONSENT; AND (III) PROVIDE REASONABLE COOPERATION AT THE INDEMNIFYING PARTY'S EXPENSE.`,
    standardProtections: [
      'Comprehensive IP indemnity defending customer against third-party patent/copyright/trademark suits',
      'Bilateral procedural safeguards (prompt notice, defense control, reasonable cooperation)',
      'Strict prohibition against settlements that concede liability or impose financial burdens without consent',
      'No one-sided catch-all indemnity for routine breaches of contract'
    ],
    commonDefectsToLookFor: [
      'Unilateral indemnity where customer indemnifies vendor for virtually all losses with zero reciprocal IP coverage',
      'Absence of third-party IP defense and replacement/workaround remedy obligations',
      'Failure to require written consent for settlements admitting fault or injunctive terms',
      'Requirement that customer indemnify vendor for vendor\'s own negligence or product defects'
    ],
    attorneyRationale: 'Indemnification is intended to shift third-party liabilities arising from risks the indemnifying party controls (e.g. the software code the vendor authored). It should never be used as a backdoor method to bypass liability caps for ordinary contract breaches.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (Reciprocal IP & Data)',
        badge: 'Reciprocal Defense',
        summary: 'Vendor indemnifies for IP infringement and deliverable defects; Customer indemnifies for customer data and unlawful use.',
        boilerplateText: `Each party ('Indemnifying Party') shall defend, indemnify, and hold harmless the other party ('Indemnified Party') from third-party claims arising from: (a) infringement of intellectual property by Indemnifying Party's deliverables or materials; (b) gross negligence or willful misconduct; or (c) material breach of confidentiality, subject to prompt notice and right to control defense without admitting fault without written consent.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (Broad IP & Regulatory Coverage)',
        badge: 'Max Protection for Buyer',
        summary: 'Expands vendor indemnity to include data breaches, privacy regulatory penalties, and explicit replacement/mitigation covenants.',
        boilerplateText: `Provider shall defend, indemnify, and hold harmless Customer from any claims, regulatory fines, and legal fees arising from: (i) infringement of third-party IP; (ii) breach of data privacy obligations or security incidents; and (iii) violation of applicable export and trade laws. If Services are enjoined, Provider shall promptly procure the right to continue or replace with non-infringing equivalents.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (Narrow IP Defense Sole Remedy)',
        badge: 'Strict IP Boundary',
        summary: 'Limits indemnification strictly to final adjudicated patent/copyright infringement with exclusions for modifications.',
        boilerplateText: `Provider shall defend Customer against third-party claims alleging direct infringement of a valid US patent or copyright by the unmodified Services. Provider's total liability under this Section is conditioned upon prompt written notice and shall be Customer's sole and exclusive remedy for any intellectual property infringement.`
      }
    ]
  },

  termination: {
    categoryKey: 'termination',
    categoryName: 'Termination & Non-Renewal',
    title: 'Bilateral Termination for Cause (30-Day Cure), Convenience & Data Return',
    governingStandard: 'Delaware Chancery Corporate Commercial Standard',
    marketPrevalence: '95% adoption across Commercial Agreements',
    defaultBoilerplate: `EITHER PARTY MAY TERMINATE THIS AGREEMENT OR ANY APPLICABLE ORDER FORM IMMEDIATELY UPON WRITTEN NOTICE:
(A) IF THE OTHER PARTY COMMITS A MATERIAL BREACH OF THIS AGREEMENT AND FAILS TO CURE SUCH MATERIAL BREACH WITHIN THIRTY (30) CALENDAR DAYS FOLLOWING RECEIPT OF DETAILED WRITTEN NOTICE SPECIFYING THE NATURE OF THE BREACH; OR
(B) IF THE OTHER PARTY BECOMES THE SUBJECT OF A PETITION IN BANKRUPTCY OR ANY OTHER PROCEEDING RELATING TO INSOLVENCY, RECEIVERSHIP, LIQUIDATION, OR ASSIGNMENT FOR THE BENEFIT OF CREDITORS.

CUSTOMER MAY TERMINATE THIS AGREEMENT OR ANY ORDER FORM FOR CONVENIENCE UPON SIXTY (60) DAYS' PRIOR WRITTEN NOTICE TO PROVIDER.

UPON EXPIRATION OR TERMINATION:
(I) CUSTOMER SHALL PAY FOR SERVICES SATISFACTORILY PERFORMED UP TO THE EFFECTIVE DATE OF TERMINATION;
(II) PROVIDER SHALL PROMPTLY REFUND TO CUSTOMER ANY PREPAID, UNEARNED FEES APPORTIONED ON A PRO-RATA BASIS COVERING THE REMAINDER OF THE APPLICABLE SUBSCRIPTION TERM; AND
(III) PROVIDER SHALL, WITHIN THIRTY (30) DAYS FOLLOWING THE EFFECTIVE DATE OF TERMINATION, EXPORT AND SECURELY RETURN ALL CUSTOMER DATA IN AN INDUSTRY-STANDARD FORMAT AND PERMANENTLY DESTROY RESIDUAL COPIES IN ACCORDANCE WITH RECOGNIZED DATA RETENTION PROTOCOLS.`,
    standardProtections: [
      'Mandatory thirty (30) day written notice and cure window prior to any cause-based termination',
      'Pro-rata refund of unearned prepaid subscription or service fees upon customer termination',
      'Clear, enforceable transition and customer data export window (30 days)',
      'Bilateral insolvency and bankruptcy termination rights'
    ],
    commonDefectsToLookFor: [
      'Unilateral termination rights where only one party may exit for convenience or cause',
      'Abbreviated or non-existent cure periods (e.g. immediate termination without opportunity to rectify)',
      'Forfeiture of all prepaid fees with no pro-rata refund upon vendor default or force majeure',
      'Auto-renewal traps that require 90+ day notice with no renewal reminder mechanism'
    ],
    attorneyRationale: 'Commercial fairness requires that neither party be subject to snap termination without a reasonable 30-day opportunity to cure an alleged breach, and that prepaid capital for undelivered services be returned upon contract cessation.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (30-Day Cure & Pro-Rata Refund)',
        badge: 'Reciprocal 30-Day Cure',
        summary: 'Standard bilateral termination for material breach with 30-day cure period and pro-rata unearned fee refund.',
        boilerplateText: `Either party may terminate upon written notice if the other party materially breaches this Agreement and fails to cure within thirty (30) days of written notice. Upon termination by Customer for Provider's uncured breach, Provider shall refund any unearned prepaid fees on a pro-rata basis, and return all Customer Data within 30 days.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (Convenience Exit & Immediate Data Return)',
        badge: 'Buyer Exit Flexibility',
        summary: 'Enables customer termination for convenience on 30 days notice with full refund of unutilized funds and transition assistance.',
        boilerplateText: `Customer may terminate this Agreement at any time for convenience upon thirty (30) days' written notice. In such event, Customer shall be entitled to an immediate pro-rata refund of all prepaid fees for the remaining term, and Provider shall provide up to 60 days of transition assistance at prevailing rates.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (Strict Term Commitment / Non-Refundable)',
        badge: 'Committed Contract Term',
        summary: 'Enforces fixed subscription terms with no termination for convenience and strict non-refundable fee commitments.',
        boilerplateText: `This Agreement is non-cancelable during the Initial Term. Either party may terminate solely for material breach uncured after 45 days written notice. All fees paid are non-refundable, and Customer remains obligated for all unpaid fees through the conclusion of the committed term.`
      }
    ]
  },

  payment: {
    categoryKey: 'payment',
    categoryName: 'Billing & Invoicing',
    title: 'Net 30 Invoicing with Good-Faith Dispute Carve-Out & Reasonable Late Interest',
    governingStandard: 'WorldCC / IACCM Fair Commercial Invoicing Standards',
    marketPrevalence: '85% standard commercial norm in B2B transactions',
    defaultBoilerplate: `PROVIDER SHALL INVOICE CUSTOMER IN ACCORDANCE WITH THE FEES SPECIFIED IN THE APPLICABLE ORDER FORM. ALL UNDISPUTED AMOUNTS SHALL BE PAYABLE WITHIN THIRTY (30) CALENDAR DAYS FOLLOWING RECEIPT OF A DETAILED, ITEM-LEVEL INVOICE ("NET 30").

CUSTOMER MAY WITHHOLD PAYMENT OF ANY SPECIFIC INVOICED CHARGES THAT ARE DISPUTED IN GOOD FAITH, PROVIDED THAT:
(A) CUSTOMER NOTIFIES PROVIDER IN WRITING DESCRIBING THE GROUNDS FOR DISPUTE PRIOR TO THE PAYMENT DUE DATE;
(B) CUSTOMER TIMELY REMITS ALL UNDISPUTED PORTIONS OF THE INVOICE; AND
(C) BOTH PARTIES ENGAGE IN GOOD-FAITH NEGOTIATIONS TO EXPEDITIOUSLY RESOLVE THE DISPUTED AMOUNTS.

WITHHOLDING DISPUTED AMOUNTS PURSUANT TO THIS SECTION SHALL NOT CONSTITUTE A DEFAULT, BREACH, OR GROUNDS FOR ACCELERATION OR SUSPENSION OF SERVICES.

UNDISPUTED OVERDUE AMOUNTS SHALL ACCRUE INTEREST AT THE RATE OF ONE PERCENT (1.0%) PER MONTH, OR THE MAXIMUM STATUTORY INTEREST RATE PERMITTED BY APPLICABLE LAW, WHICHEVER IS LESS, CALCULATED FROM THE DUE DATE UNTIL FULLY PAID.`,
    standardProtections: [
      'Standard Net 30 payment timeline (standard commercial working capital baseline)',
      'Explicit safe harbor to withhold good-faith disputed amounts without default or service suspension',
      'Prohibition against immediate service disruption for billing discrepancies',
      'Reasonable, capped late fee interest (1% per month), avoiding usurious or compound penal charges'
    ],
    commonDefectsToLookFor: [
      'Unilateral clause permitting vendor to immediately shut off production systems upon 1-day late payment',
      'Accelerated Net 10 or immediate debit without invoice receipt verification',
      'Exorbitant compounding interest or arbitrary late administration fines',
      'Clause declaring that any invoice not disputed within 3 days is irrevocably accepted and non-refundable'
    ],
    attorneyRationale: 'Businesses require adequate operational time to reconcile invoices against purchase orders. Crucially, withholding disputed line items while paying undisputed charges is an essential protection against erroneous billing.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (Net 30 & Dispute Safe Harbor)',
        badge: 'Net 30 Days',
        summary: '30-day payment terms, formal written dispute procedure, and 1% monthly late fee cap.',
        boilerplateText: `Invoices are payable within thirty (30) days of receipt (Net 30). Customer may dispute invoice items in good faith by written notice prior to due date while paying undisputed portions. Late payments accrue interest at 1.0% per month or maximum legal rate.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (Net 45 / Acceptance Milestone Verification)',
        badge: 'Net 45 Verification',
        summary: 'Extended Net 45 terms with formal milestone sign-off and 60-day dispute window.',
        boilerplateText: `Invoices shall be payable within forty-five (45) days of delivery of accepted deliverables (Net 45). Customer may dispute any invoice within sixty (60) days of receipt. No late interest shall accrue on any disputed amounts until final resolution.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (Net 15 / Auto-Debit / Short Dispute Window)',
        badge: 'Net 15 Strict Invoicing',
        summary: 'Net 15 payment terms with automatic suspension rights upon 10 days notice and 7-day dispute cutoff.',
        boilerplateText: `All invoices are due Net 15 days from invoice date. Invoices not disputed in writing within ten (10) days shall be deemed conclusively accepted. Provider reserves the right to suspend Services upon five (5) days notice for non-payment.`
      }
    ]
  },

  ip: {
    categoryKey: 'ip',
    categoryName: 'Intellectual Property Ownership',
    title: 'Customer Deliverable Ownership & Perpetual Embedded Pre-Existing IP License',
    governingStandard: 'ABA Model Software & Services Commercial Guidelines',
    marketPrevalence: '89% adoption in Professional & Technology Services',
    defaultBoilerplate: `AS BETWEEN THE PARTIES:
(A) CUSTOMER EXCLUSIVELY OWNS ALL RIGHT, TITLE, AND INTEREST, INCLUDING ALL WORLDWIDE INTELLECTUAL PROPERTY RIGHTS, IN AND TO: (I) ALL CUSTOMER DATA; AND (II) ALL CUSTOM DELIVERABLES, WORK PRODUCT, SPECIFICATIONS, AND REPORTS CREATED SPECIFICALLY FOR CUSTOMER UNDER THIS AGREEMENT, ALL OF WHICH SHALL CONSTITUTE "WORKS MADE FOR HIRE" UNDER U.S. COPYRIGHT LAW.

(B) PROVIDER RETAINS ALL RIGHT, TITLE, AND INTEREST IN AND TO ITS PRE-EXISTING SOFTWARE, ARCHITECTURES, CORE ALGORITHMS, METHODOLOGIES, AND GENERAL PROPRIETARY TOOLS ("PROVIDER PRE-EXISTING IP").

(C) TO THE EXTENT ANY PROVIDER PRE-EXISTING IP IS INCORPORATED OR EMBEDDED WITHIN ANY DELIVERABLES, PROVIDER HEREBY GRANTS TO CUSTOMER A PERPETUAL, IRREVOCABLE, WORLDWIDE, FULLY PAID-UP, ROYALTY-FREE, NON-EXCLUSIVE LICENSE TO USE, EXECUTE, DISPLAY, REPRODUCE, MODIFY, AND CREATE DERIVATIVE WORKS OF SUCH EMBEDDED IP SOLELY AS PART OF, AND FOR THE FULL BENEFICIAL USE OF, THE DELIVERABLES FOR CUSTOMER'S BUSINESS OPERATIONS.`,
    standardProtections: [
      'Express "work made for hire" vesting customer with sole ownership of custom deliverables and data',
      'Clear demarcation between vendor pre-existing background IP and bespoke work product',
      'Irrevocable, perpetual license for customer to use any background tools embedded within the deliverables',
      'Protection guaranteeing customer data remains 100% customer property without vendor retention'
    ],
    commonDefectsToLookFor: [
      'Vendor retaining full ownership of bespoke systems customer paid to have developed from scratch',
      'Revocable licenses to customer-facing work product upon contract conclusion',
      'Broad clauses granting the vendor ownership of customer trade secrets, prompts, or proprietary data',
      'Ambiguity over whether derivative works revert to the vendor'
    ],
    attorneyRationale: 'When a customer commissions and pays for custom software or deliverables, market standard requires assignment of that work product to the customer, while protecting the vendor\'s foundational reusable tools through an embedded license.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (Customer Work Product + Vendor Tool License)',
        badge: 'Work Made for Hire',
        summary: 'Customer owns custom deliverables and customer data; Vendor retains background IP and grants perpetual embedded license.',
        boilerplateText: `Customer owns all Deliverables created under this Agreement as works made for hire. Provider retains ownership of its background tools and pre-existing IP, and grants Customer a perpetual, royalty-free, worldwide license to use any background IP embedded in Deliverables.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (Full IP Assignment & Source Code Escrow)',
        badge: 'Full Ownership Assignment',
        summary: 'Complete assignment of all inventions, source code, and related patents with no vendor reversion rights.',
        boilerplateText: `Provider hereby irrevocably transfers and assigns to Customer all right, title, and interest in all Deliverables, including all patent, copyright, and trade secret rights. Provider shall deliver complete source code and technical documentation upon completion.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (SaaS Subscription License Only)',
        badge: 'Subscription License Only',
        summary: 'Vendor retains 100% of all intellectual property; Customer receives a limited revocable non-exclusive term license.',
        boilerplateText: `Provider and its licensors retain all right, title, and interest in and to the Services, software, modifications, and suggestions. Customer is granted solely a non-exclusive, non-transferable right to access the Services during the subscription term.`
      }
    ]
  },

  noncompete: {
    categoryKey: 'noncompete',
    categoryName: 'Restrictive Covenants & Non-Compete',
    title: 'Reciprocal Non-Solicitation with General Public Job Advertisement Carve-Out',
    governingStandard: 'Uniform Trade Secrets & ABA Commercial Covenant Benchmark',
    marketPrevalence: '82% adoption in B2B Consulting & Services',
    defaultBoilerplate: `DURING THE TERM OF THIS AGREEMENT AND FOR A PERIOD OF TWELVE (12) MONTHS FOLLOWING ITS TERMINATION OR EXPIRATION, NEITHER PARTY SHALL DIRECTLY SOLICIT FOR EMPLOYMENT ANY EMPLOYEE OR CONTRACTOR OF THE OTHER PARTY WHO WAS MATERIALLY INVOLVED IN THE DIRECT PERFORMANCE OR OVERSIGHT OF THE SERVICES.

NOTWITHSTANDING THE FOREGOING, THIS RESTRICTION SHALL NOT PROHIBIT OR RESTRICT EITHER PARTY FROM:
(A) CONDUCTING GENERAL PUBLIC SOLICITATIONS, RECRUITMENT CAMPAIGNS, OR JOB POSTINGS NOT SPECIFICALLY TARGETED AT EMPLOYEES OF THE OTHER PARTY;
(B) ENGAGING BONA FIDE THIRD-PARTY RECRUITMENT FIRMS WHOSE ACTIONS DO NOT SPECIFICALLY TARGET EMPLOYEES OF THE OTHER PARTY; OR
(C) HIRING ANY INDIVIDUAL WHO INDEPENDENTLY RESPONDS TO A GENERAL ADVERTISEMENT OR INITIATES CONTACT WITHOUT DIRECT SOLICITATION.

UNDER NO CIRCUMSTANCES SHALL THIS AGREEMENT BE CONSTRUED TO RESTRICT EITHER PARTY FROM COMPETING IN ANY GEOGRAPHIC REGION, INDUSTRY, OR LINE OF BUSINESS.`,
    standardProtections: [
      'Narrowly tailored non-solicitation (strictly 12 months, applying only to staff materially involved in services)',
      'Robust safe-harbor carve-outs for general job boards, LinkedIn ads, and public postings',
      'Explicit clause barring non-compete restraints that prevent either party from conducting trade or business',
      'Strict bilateral mutuality'
    ],
    commonDefectsToLookFor: [
      'Broad non-compete clauses prohibiting a party from offering services to competitors or operating in an entire industry',
      'Exorbitant liquidated damages penalties for hiring (e.g. 200% of annual salary)',
      'Vague restrictions applying to all company employees worldwide rather than project personnel',
      'Multi-year restrictions exceeding standard 12-month post-termination windows'
    ],
    attorneyRationale: 'Courts and modern regulatory agencies (including FTC directives) disfavor blanket non-competes. A balanced 1-year non-solicitation with explicit carve-outs for open public job advertisements is the recognized legal standard.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (12-Month Non-Solicit with Public Ad Safe Harbor)',
        badge: 'Reciprocal 12-Mo Non-Solicit',
        summary: 'Reciprocal 12-month non-solicitation of key project personnel with safe-harbor for general recruitment.',
        boilerplateText: `Neither party shall directly solicit for employment key project personnel of the other party for twelve (12) months after termination. This restriction excludes general public job advertisements and individuals who initiate contact independently.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (Zero Non-Solicit Restrictions)',
        badge: 'Unrestricted Freedom to Hire',
        summary: 'Eliminates all hiring restrictions, relying solely on trade secret and confidentiality protections.',
        boilerplateText: `Neither party shall be subject to any covenant not to compete or non-solicitation restriction. Each party remains free to recruit and hire personnel subject only to confidentiality obligations.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (Liquidated Damages / 100% Salary Placement Fee)',
        badge: 'Staffing Placement Penalty',
        summary: 'Imposes mandatory placement fee equal to one year salary if customer hires vendor engineer.',
        boilerplateText: `Customer agrees not to solicit or hire Provider personnel for 24 months. If Customer hires any Provider personnel, Customer shall pay Provider a recruitment liquidated fee equal to 100% of the employee's annualized compensation.`
      }
    ]
  },

  dispute: {
    categoryKey: 'dispute',
    categoryName: 'Dispute Resolution & Governing Law',
    title: 'Neutral Delaware Venue, Mandatory Executive Escalation & AAA Arbitration',
    governingStandard: 'AAA / JAMS Commercial Dispute Resolution Standard',
    marketPrevalence: '91% adoption in Enterprise Contracts',
    defaultBoilerplate: `THIS AGREEMENT SHALL BE GOVERNED BY AND CONSTRUED IN ACCORDANCE WITH THE LAWS OF THE STATE OF DELAWARE, WITHOUT GIVING EFFECT TO ANY CHOICE OF LAW OR CONFLICT OF LAW PROVISIONS.

IN THE EVENT OF ANY CONTROVERSY OR CLAIM ARISING OUT OF OR RELATING TO THIS AGREEMENT, THE PARTIES AGREE FIRST TO PURSUE AMICABLE RESOLUTION:
(A) THE DISPUTING PARTY SHALL SERVE WRITTEN NOTICE DETAILING THE DISPUTE;
(B) WITHIN FIFTEEN (15) CALENDAR DAYS FOLLOWING RECEIPT, SENIOR EXECUTIVE OFFICERS WITH SETTLEMENT AUTHORITY SHALL MEET IN PERSON OR VIA SECURE VIDEO CONFERENCE TO NEGOTIATE IN GOOD FAITH.

IF UNRESOLVED WITHIN THIRTY (30) DAYS FOLLOWING THE EXECUTIVE MEETING, DISPUTES SHALL BE FINAL AND CONCLUSIVELY SETTLED BY CONFIDENTIAL ARBITRATION ADMINISTERED BY THE AMERICAN ARBITRATION ASSOCIATION (AAA) IN ACCORDANCE WITH ITS COMMERCIAL ARBITRATION RULES BY A SINGLE NEUTRAL ARBITRATOR. THE SEAT OF ARBITRATION SHALL BE WILMINGTON, DELAWARE.

NOTWITHSTANDING THE FOREGOING, EITHER PARTY MAY SEEK IMMEDIATE INJUNCTIVE OR EQUITABLE RELIEF IN ANY COURT OF COMPETENT JURISDICTION TO PREVENT IRREPARABLE HARM REGARDING INTELLECTUAL PROPERTY OR CONFIDENTIALITY INFRINGEMENTS.`,
    standardProtections: [
      'Neutral, sophisticated business forum (Delaware) with predictable commercial legal precedent',
      'Mandatory good-faith executive escalation meeting before costly adversarial filings',
      'Confidential binding arbitration preventing public reputational exposure',
      'Carve-out allowing preliminary injunctive relief for IP theft and trade secret breaches'
    ],
    commonDefectsToLookFor: [
      'Onerous, one-sided jurisdiction forcing litigation across foreign borders or in vendor\'s remote hometown',
      'Unilateral attorney\'s fees clause allowing only the vendor to recover legal costs',
      'Immediate litigation without mandatory pre-suit executive negotiation',
      'Waiver of procedural rights or statutory claims'
    ],
    attorneyRationale: 'Designating a neutral corporate venue such as Delaware and providing for mandatory executive escalation before arbitration minimizes runaway legal expenses and promotes commercial settlements.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (Delaware Law / 15-Day Executive Escalation)',
        badge: 'Delaware / AAA Arbitration',
        summary: 'Governed by Delaware law, with mandatory 15-day executive meeting prior to confidential AAA arbitration.',
        boilerplateText: `Governed by Delaware law. The parties shall submit disputes to executive escalation for 30 days prior to initiating confidential binding arbitration under AAA Commercial Rules in Wilmington, Delaware. Injunctions for IP or NDA breaches permitted in court.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (Customer Local Venue / Mutual Fee-Shifting)',
        badge: 'Customer State Jurisdiction',
        summary: 'Governed by customer\'s home state laws with prevailing party attorney fee recovery.',
        boilerplateText: `Governed by the laws of Customer's principal place of business. The prevailing party in any litigation or arbitration shall be entitled to recover reasonable attorneys' fees and court costs from the non-prevailing party.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (Vendor Home Forum / Jury Waiver / Short Limitation)',
        badge: 'Vendor Exclusive Court',
        summary: 'Exclusive jurisdiction in vendor\'s headquarters with strict 1-year statute of limitations on claims.',
        boilerplateText: `Exclusive jurisdiction in state and federal courts located in Provider's home county. Customer irrevocably waives trial by jury. Any claim by Customer must be brought within one (1) year of the event giving rise to the claim or be forever barred.`
      }
    ]
  },

  confidentiality: {
    categoryKey: 'confidentiality',
    categoryName: 'Confidentiality & Non-Disclosure',
    title: 'Mutual Reciprocal Confidentiality with Standard 4-Prong Exclusions',
    governingStandard: 'NVCA / ABA Model Bilateral Non-Disclosure Standards',
    marketPrevalence: '96% adoption in Commercial Agreements',
    defaultBoilerplate: `EACH PARTY ("RECEIVING PARTY") AGREES THAT ALL CODE, INVENTIONS, BUSINESS PLANS, FINANCIAL DATA, SPECIFICATIONS, AND PROPRIETARY INFORMATION DISCLOSED TO IT BY THE OTHER PARTY ("DISCLOSING PARTY") CONSTITUTES CONFIDENTIAL INFORMATION.

RECEIVING PARTY SHALL:
(A) HOLD DISCLOSING PARTY'S CONFIDENTIAL INFORMATION IN STRICT CONFIDENCE USING AT LEAST THE DEGREE OF CARE IT USES FOR ITS OWN CONFIDENTIAL INFORMATION OF LIKE NATURE, BUT NOT LESS THAN A REASONABLE DEGREE OF CARE;
(B) NOT DISCLOSE CONFIDENTIAL INFORMATION TO ANY THIRD PARTY EXCEPT TO ITS EMPLOYEES, ADVISORS, AND SUBCONTRACTORS WHO HAVE A LEGITIMATE NEED TO KNOW AND ARE BOUND BY WRITTEN CONFIDENTIALITY OBLIGATIONS AT LEAST AS PROTECTIVE AS THIS AGREEMENT; AND
(C) NOT USE CONFIDENTIAL INFORMATION FOR ANY PURPOSE OUTSIDE THE PERFORMANCE OF THIS AGREEMENT.

CONFIDENTIAL INFORMATION DOES NOT INCLUDE INFORMATION THAT: (I) IS OR BECOMES GENERALLY AVAILABLE TO THE PUBLIC WITHOUT BREACH; (II) WAS KNOWN TO RECEIVING PARTY PRIOR TO DISCLOSURE WITHOUT CONFIDENTIALITY RESTRICTIONS; (III) IS INDEPENDENTLY DEVELOPED WITHOUT REFERENCE TO DISCLOSING PARTY'S INFORMATION; OR (IV) IS RIGHTFULLY OBTAINED FROM A THIRD PARTY WITHOUT OBLIGATION OF CONFIDENTIALITY.`,
    standardProtections: [
      'Strictly mutual and bilateral confidentiality protections',
      'Reasonable care standard aligned with commercial enterprise norms',
      'Classic 4-part legal exclusion safe harbor (public domain, prior knowledge, independent creation, third-party source)',
      'Subcontractor and employee flow-down requirements'
    ],
    commonDefectsToLookFor: [
      'One-way non-disclosure shielding only the vendor while customer disclosures remain unprotected',
      'Omission of standard safe-harbor exclusions (e.g. demanding confidentiality for public facts)',
      'Unreasonable confidentiality survival periods (e.g. perpetual for ordinary business summaries)',
      'Failure to permit legally mandated disclosures under subpoena with prior notice'
    ],
    attorneyRationale: 'Reciprocal confidentiality ensures that both parties can freely exchange specifications, business metrics, and trade secrets with equal protection under well-tested legal exclusion standards.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (Reciprocal 3-Year Protection & Trade Secrets)',
        badge: 'Reciprocal Standard NDA',
        summary: 'Standard bilateral non-disclosure with 3-year term and perpetual protection for trade secrets.',
        boilerplateText: `Each party shall protect the other's confidential information with reasonable care for three (3) years (perpetually for trade secrets). Standard exclusions apply for public domain, prior knowledge, independent development, and legal compulsion upon notice.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (Strict Data Security / Immediate Return)',
        badge: 'Enterprise Security Guardrails',
        summary: 'Strict SOC2 compliance covenants, immediate data destruction certification, and unannounced audit rights.',
        boilerplateText: `Provider shall adhere to ISO 27001 / SOC 2 Type II controls. Upon termination, Provider shall certify permanent destruction of all Customer Data within 14 days and submit to independent third-party verification.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (Marking Requirement / 1-Year Survival)',
        badge: 'Strict Marking Rule',
        summary: 'Requires confidential materials to be explicitly stamped "CONFIDENTIAL" within 10 days of verbal disclosure.',
        boilerplateText: `Confidential Information is limited to materials conspicuously marked "CONFIDENTIAL" in writing. Verbal disclosures must be reduced to writing within ten (10) days. Obligations expire twelve (12) months after disclosure.`
      }
    ]
  },

  warranty: {
    categoryKey: 'warranty',
    categoryName: 'Warranties & Quality Standards',
    title: 'Express 90-Day Conformity Warranty & Professional Workmanship Standard',
    governingStandard: 'ABA Commercial Computer Software & Services Standard',
    marketPrevalence: '84% adoption in Technology Agreements',
    defaultBoilerplate: `PROVIDER REPRESENTS AND WARRANTS THAT:
(A) THE SERVICES AND DELIVERABLES WILL PERFORM IN ALL MATERIAL RESPECTS IN ACCORDANCE WITH THE APPLICABLE SPECIFICATIONS, DOCUMENTATION, AND STATEMENTS OF WORK FOR A PERIOD OF NINETY (90) DAYS FOLLOWING DELIVERY;
(B) SERVICES WILL BE PERFORMED IN A TIMELY, PROFESSIONAL, AND WORKMANLIKE MANNER CONFORMING TO GENERALLY RECOGNIZED INDUSTRY STANDARDS BY QUALIFIED PERSONNEL;
(C) THE SERVICES DO NOT AND WILL NOT CONTAIN ANY MALICIOUS CODE, TROJAN HORSES, WORMS, OR DISABLING CODE DESIGNED TO DISRUPT CUSTOMER'S SYSTEMS; AND
(D) IT MAINTAINS ALL NECESSARY CORPORATE RIGHTS, LICENSES, AND PERMITS TO ENTER INTO AND PERFORM THIS AGREEMENT.

IN THE EVENT OF ANY WARRANTY BREACH, PROVIDER SHALL, AT ITS SOLE EXPENSE, PROMPTLY RE-PERFORM, REPAIR, OR REPLACE THE NON-CONFORMING SERVICE WITHIN THIRTY (30) DAYS OF NOTICE. IF PROVIDER CANNOT REMEDY THE DEFECT, CUSTOMER MAY TERMINATE THE ORDER FORM AND RECEIVE A FULL REFUND OF FEES PAID FOR THE DEFECTIVE SERVICES.`,
    standardProtections: [
      'Express 90-day warranty of material conformity to documentation and specifications',
      'Professional workmanship standard adhering to prevailing commercial norms',
      'Malicious code and virus-free warranty',
      'Right to receive a full refund and terminate if vendor fails to rectify non-conformance'
    ],
    commonDefectsToLookFor: [
      'Complete disclaimer of all warranties ("AS-IS", "WITH ALL FAULTS") with zero performance commitment',
      'Abbreviated 7-day or 14-day warranty claim windows',
      'Limitation of remedy solely to repair with no right to refund if vendor fails repeatedly',
      'Absence of anti-malware and system security representations'
    ],
    attorneyRationale: 'A commercial buyer cannot pay substantial fees for an "AS-IS" service without warranty. An express 90-day conformity warranty backed by re-performance and refund rights is the standard expectation.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (90-Day Conformity & Refund Right)',
        badge: '90-Day Conformity',
        summary: '90-day warranty of conformity to specs, professional performance, anti-virus, and refund remedy.',
        boilerplateText: `Provider warrants that Services will conform in all material respects to specifications for 90 days following delivery and be performed in a professional manner. If uncured within 30 days of notice, Customer may terminate and receive a pro-rata refund.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (1-Year Warranty & Service Level Guarantees)',
        badge: '1-Year Full Warranty',
        summary: 'One-year warranty period with financial SLA credits and express fitness for particular purpose.',
        boilerplateText: `Provider warrants for one (1) year that Services shall operate flawlessly in accordance with all Documentation and requirements. Any downtime breaches SLA commitments requiring automatic financial service credits.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (As-Is Disclaimer / Exclusive Repair Remedy)',
        badge: 'AS-IS Disclaimer',
        summary: 'Comprehensive disclaimer of all warranties, including merchantability, with exclusive repair remedy.',
        boilerplateText: `EXCEPT AS EXPRESSLY SET FORTH HEREIN, ALL SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. PROVIDER EXPRESSLY DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.`
      }
    ]
  },

  force_majeure: {
    categoryKey: 'force_majeure',
    categoryName: 'Force Majeure & Unforeseen Events',
    title: 'Mutual Force Majeure with Duty to Mitigate & 30-Day Termination Right',
    governingStandard: 'ICC International Chamber of Commerce Force Majeure Model',
    marketPrevalence: '94% adoption across Enterprise Contracts',
    defaultBoilerplate: `NEITHER PARTY SHALL BE LIABLE FOR DELAY OR FAILURE IN PERFORMING ITS OBLIGATIONS UNDER THIS AGREEMENT (EXCEPT FOR OBLIGATIONS TO PAY SUMS DUE FOR SERVICES ALREADY RENDERED) IF SUCH DELAY OR FAILURE ARISES FROM AN EVENT BEYOND ITS REASONABLE CONTROL, INCLUDING ACTS OF GOD, WAR, TERRORISM, RIOTS, EPIDEMICS, EMBARGOES, NATURAL DISASTERS, STRIKES, OR UTILITY FAILURES ("FORCE MAJEURE EVENT").

THE AFFECTED PARTY SHALL:
(A) PROMPTLY NOTIFY THE OTHER PARTY IN WRITING SPECIFYING THE NATURE AND EXPECTED DURATION OF THE DELAY; AND
(B) USE COMMERCIALLY REASONABLE EFFORTS TO RESUME PERFORMANCE AND MITIGATE THE CONSEQUENCES OF THE EVENT.

IF A FORCE MAJEURE EVENT PREVENTS PERFORMANCE FOR MORE THAN THIRTY (30) CONSECUTIVE CALENDAR DAYS, THE NON-AFFECTED PARTY MAY TERMINATE THIS AGREEMENT IMMEDIATELY UPON WRITTEN NOTICE WITHOUT PENALTY OR LIABILITY, AND RECEIVE A PRO-RATA REFUND OF UNEARNED PREPAID FEES.`,
    standardProtections: [
      'Affirmative requirement of prompt written notice and commercially reasonable duty to mitigate',
      'Clear 30-day outer ceiling after which non-affected party may walk away without penalty',
      'Pro-rata refund of prepaid fees for undelivered services during prolonged disruption',
      'Clarification that force majeure does not excuse accrued payment debts for services delivered'
    ],
    commonDefectsToLookFor: [
      'Open-ended force majeure clause allowing vendor to pause indefinitely without customer termination right',
      'Inclusion of routine vendor business risks (such as subcontractor failure or routine staffing turnover)',
      'Failure to require mitigation efforts or prompt written notification',
      'Denial of refunds for prepaid services suspended during the force majeure event'
    ],
    attorneyRationale: 'Force majeure should shield parties from genuine catastrophic events outside human control, but a customer cannot remain legally bound to an idle contract indefinitely without exit rights.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (30-Day Continuous Ceiling & Refund)',
        badge: '30-Day Exit Ceiling',
        summary: 'Excuses delays from unforeseen catastrophic events with prompt notice, mitigation, and 30-day exit right.',
        boilerplateText: `Neither party is liable for delays from unforeseen events beyond reasonable control. The affected party must give prompt notice and mitigate. If disruption persists for over 30 days, the other party may terminate and receive a refund of unearned prepaid fees.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (Disaster Recovery & 15-Day Exit)',
        badge: 'Disaster Recovery Obligation',
        summary: 'Requires vendor disaster recovery invocation and short 15-day termination threshold.',
        boilerplateText: `Force majeure shall not excuse Provider failure to maintain active disaster recovery and business continuity systems. Customer may terminate if disruption exceeds fifteen (15) days.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (Broad Excusable Delay / 60-Day Window)',
        badge: 'Broad Event Exemption',
        summary: 'Extends force majeure to third-party cloud hosting disruptions with 60-day threshold.',
        boilerplateText: `Provider shall not be liable for any downtime caused by third-party hosting providers, public telecommunications outages, or labor actions. Termination is permitted only after sixty (60) days of complete outage.`
      }
    ]
  },

  audit: {
    categoryKey: 'audit',
    categoryName: 'Audit & Books Inspection',
    title: 'Reasonable Annual Audit with 10 Days Notice & 5% Cost-Shifting Threshold',
    governingStandard: 'AICPA / SOC-2 Model Commercial Audit Standard',
    marketPrevalence: '78% adoption in Enterprise Software & Licensing',
    defaultBoilerplate: `UPON AT LEAST TEN (10) BUSINESS DAYS' PRIOR WRITTEN NOTICE, CUSTOMER OR ITS DESIGNATED INDEPENDENT CERTIFIED AUDITOR (BOUND BY REASONABLE CONFIDENTIALITY UNDERTAKINGS) MAY, DURING NORMAL BUSINESS HOURS AND NO MORE FREQUENTLY THAN ONCE PER TWELVE (12) MONTH PERIOD, CONDUCT A REASONABLE AUDIT OF PROVIDER'S BOOKS, RECORDS, AND SECURITY CONTROLS RELEVANT TO VERIFYING COMPLIANCE WITH THIS AGREEMENT.

AUDITS SHALL BE CONDUCTED SO AS NOT TO UNREASONABLY DISRUPT NORMAL BUSINESS OPERATIONS. CUSTOMER SHALL BEAR THE FULL EXPENSE OF ANY SUCH AUDIT, PROVIDED THAT PROVIDER SHALL REIMBURSE CUSTOMER FOR THE REASONABLE COSTS OF THE AUDIT IF THE AUDIT UNCOVERS A BILLING OVERCHARGE OR MATERIAL COMPLIANCE DEFICIENCY EXCEEDING FIVE PERCENT (5%).`,
    standardProtections: [
      'Requirement of at least 10 business days\' advance written notice',
      'Frequency capped at maximum once per 12-month period during normal business hours',
      'Auditor must be independent and bound by strict confidentiality',
      'Cost-shifting strictly pegged to substantial discrepancies (> 5%)'
    ],
    commonDefectsToLookFor: [
      'Unannounced "surprise" audit rights without prior notice',
      'Allowing direct commercial competitors to participate in inspection',
      'Clause forcing the audited party to pay for the audit even if zero discrepancies are found',
      'Unfettered access to proprietary code or other clients\' confidential data'
    ],
    attorneyRationale: 'Audit provisions should verify compliance without becoming a tool for commercial harassment or trade secret fishing expeditions.',
    stances: [
      {
        stance: 'BALANCED',
        label: 'Balanced Market Standard (Annual Audit / 10 Days Notice / 5% Cost Shift)',
        badge: 'Annual 10-Day Notice',
        summary: 'Annual inspection during business hours with 10 days notice and 5% threshold for cost reimbursement.',
        boilerplateText: `Upon 10 business days' written notice, Customer may inspect relevant records once per year during business hours. Customer pays audit costs unless an underpayment or discrepancy exceeding 5% is discovered, in which case Provider reimburses costs.`
      },
      {
        stance: 'PRO_CUSTOMER',
        label: 'Pro-Customer Standard (Security & Regulatory On-Demand Audit)',
        badge: 'SOC2 Security Inspection',
        summary: 'Semi-annual audit covering cybersecurity logs, pen-test reports, and sub-processor facilities.',
        boilerplateText: `Customer and regulatory authorities may inspect security logs, data centers, and third-party certifications upon 5 days notice. Any material security vulnerability identified must be remediated within 14 days at Provider's cost.`
      },
      {
        stance: 'PRO_VENDOR',
        label: 'Pro-Vendor Standard (SOC-2 Report in Lieu of On-Site Inspection)',
        badge: 'Third-Party Report Only',
        summary: 'Prohibits on-site physical audits; satisfies compliance by providing annual SOC-2 Type II audit report.',
        boilerplateText: `Provider satisfies all audit obligations by providing Customer an annual independent SOC 2 Type II compliance report. On-site physical inspections of Provider premises and source code are strictly prohibited.`
      }
    ]
  }
};

/**
 * Normalizes input category string to find best matching industry benchmark
 */
export function getBenchmarkForCategory(category: string): IndustryBenchmarkClause {
  if (!category) return INDUSTRY_BENCHMARKS.liability;

  const clean = category.toLowerCase().trim();

  // Direct key lookup
  if (INDUSTRY_BENCHMARKS[clean]) {
    return INDUSTRY_BENCHMARKS[clean];
  }

  // Synonym & keyword mapping
  if (clean.includes('liab') || clean.includes('damag') || clean.includes('cap')) {
    return INDUSTRY_BENCHMARKS.liability;
  }
  if (clean.includes('indemn') || clean.includes('defense') || clean.includes('hold harmless')) {
    return INDUSTRY_BENCHMARKS.indemnity;
  }
  if (clean.includes('terminat') || clean.includes('renew') || clean.includes('cancel') || clean.includes('expire')) {
    return INDUSTRY_BENCHMARKS.termination;
  }
  if (clean.includes('pay') || clean.includes('fee') || clean.includes('invoic') || clean.includes('bill')) {
    return INDUSTRY_BENCHMARKS.payment;
  }
  if (clean.includes('ip') || clean.includes('intellect') || clean.includes('patent') || clean.includes('copyright') || clean.includes('licens') || clean.includes('proprietary')) {
    return INDUSTRY_BENCHMARKS.ip;
  }
  if (clean.includes('compet') || clean.includes('solicit') || clean.includes('restrict')) {
    return INDUSTRY_BENCHMARKS.noncompete;
  }
  if (clean.includes('dispute') || clean.includes('govern') || clean.includes('arbitrat') || clean.includes('venue') || clean.includes('jurisdict')) {
    return INDUSTRY_BENCHMARKS.dispute;
  }
  if (clean.includes('confident') || clean.includes('nda') || clean.includes('secret') || clean.includes('privacy')) {
    return INDUSTRY_BENCHMARKS.confidentiality;
  }
  if (clean.includes('warrant') || clean.includes('disclaim') || clean.includes('as-is')) {
    return INDUSTRY_BENCHMARKS.warranty;
  }
  if (clean.includes('force') || clean.includes('majeure') || clean.includes('disaster') || clean.includes('unforeseen')) {
    return INDUSTRY_BENCHMARKS.force_majeure;
  }
  if (clean.includes('audit') || clean.includes('inspect') || clean.includes('books') || clean.includes('record')) {
    return INDUSTRY_BENCHMARKS.audit;
  }

  // Fallback to Liability as it represents standard corporate risk covenants
  return INDUSTRY_BENCHMARKS.liability;
}

/**
 * Computes comparative metrics and deviation analysis between current clause and industry benchmark
 */
export function analyzeClauseBenchmarkGap(
  clause: CriticalClauseAudit,
  benchmark: IndustryBenchmarkClause
): BenchmarkComparisonAnalysis {
  const isCustomCategory = !INDUSTRY_BENCHMARKS[clause.clause_category.toLowerCase()];
  const currentFavors = clause.party_favored || 'Neutral';
  const isMutual = currentFavors.toLowerCase().includes('mutual') || currentFavors.toLowerCase().includes('reciprocal') || currentFavors.toLowerCase().includes('balanced');

  const gaps: string[] = [];

  // Check mutuality gap
  if (!isMutual) {
    gaps.push(`Asymmetric Allocation: Your instrument favors ${currentFavors}, whereas the industry benchmark mandates mutual reciprocal covenants.`);
  }

  // Check high/critical risk flags
  if (clause.risk_level === 'CRITICAL' || clause.risk_level === 'HIGH') {
    gaps.push(`High Risk Exposure: Current clause is flagged as ${clause.risk_level} risk due to deviations from standard commercial market protections.`);
  }

  // Check hidden pitfalls
  if (clause.hidden_pitfalls && clause.hidden_pitfalls.length > 0) {
    clause.hidden_pitfalls.slice(0, 2).forEach(p => {
      gaps.push(`Market Gap: ${p}`);
    });
  }

  // Check omissions
  const isOmission = clause.verbatim_quote.includes('OMISSION DETECTED');
  if (isOmission) {
    gaps.push('Critical Covenant Omission: The baseline protective covenants in this benchmark are entirely absent from your current contract.');
  }

  // Calculate alignment score (0 - 100)
  let score = 50;
  if (isMutual) score += 25;
  if (clause.risk_level === 'LOW') score += 25;
  else if (clause.risk_level === 'MEDIUM') score += 10;
  else if (clause.risk_level === 'CRITICAL') score -= 25;
  if (isOmission) score = 15;
  score = Math.max(10, Math.min(95, score));

  // Strategic takeaway
  let strategicTakeaway = 'Adopt the balanced industry benchmark wording to restore reciprocal risk allocation during negotiations.';
  if (isMutual && clause.risk_level === 'LOW') {
    strategicTakeaway = 'This clause closely adheres to industry standards. Minor adjustments may be made to enhance clarity or customize operational timeframes.';
  } else if (clause.risk_level === 'CRITICAL') {
    strategicTakeaway = 'Reject this one-sided clause and counter-propose the benchmark boilerplate verbatim to neutralize extreme operational exposure.';
  }

  return {
    clauseCategory: benchmark.categoryName,
    isCustomCategory,
    benchmarkTitle: benchmark.title,
    governingStandard: benchmark.governingStandard,
    mutualityStatus: {
      current: currentFavors,
      benchmark: 'Mutual / Reciprocal',
      isAligned: isMutual
    },
    riskRating: clause.risk_level,
    keyGaps: gaps,
    alignmentScore: score,
    strategicTakeaway
  };
}
