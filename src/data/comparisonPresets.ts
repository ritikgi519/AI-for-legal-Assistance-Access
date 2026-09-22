export interface ComparisonPreset {
  id: string;
  name: string;
  description: string;
  targetCategory: string;
  docBTitle: string;
  docBText: string;
}

export const COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    id: 'saas-counter-proposal',
    name: 'Balanced Customer Redline (Counter-Proposal B)',
    description: 'A heavily negotiated counter-proposal addressing the 5 critical trap clauses in the Enterprise SaaS MSA: inserts mutual liability caps, net-30 payment, 30-day renewal notice, and vendor IP indemnification.',
    targetCategory: 'Software & Technology',
    docBTitle: 'Enterprise Cloud SaaS MSA (Customer Negotiated Redline v2)',
    docBText: `MASTER SERVICES AGREEMENT (MSA) - REVISED COUNTER-DRAFT

This Master Services Agreement ("Agreement") is made and entered into as of October 12, 2024, by and between OmniCloud Platform, Inc., a Delaware corporation ("Vendor"), and Acme Enterprises, Inc., a California corporation ("Customer").

SECTION 3. FEES AND PAYMENT TERMS
3.1 Billing and Payments. Customer shall pay all subscription fees specified in all applicable Order Forms within thirty (30) days of the invoice date (Net 30). In the event of early termination without cause by Vendor or for cause by Customer, Vendor shall promptly provide a pro-rata refund of all prepaid unearned subscription fees.
3.2 Late Payments. Any undisputed late payments shall accrue interest at the rate of 1.0% per month or the statutory rate permitted by law, whichever is lower. The parties shall cooperate in good faith to resolve any invoice disputes before imposing late charges.

SECTION 6. TERM AND MUTUAL TERMINATION
6.1 Term and Automatic Renewal. This Agreement commences on the Effective Date and shall continue for an initial period of twelve (12) months ("Initial Term"). Thereafter, this Agreement shall renew for successive twelve (12) month periods, unless either party provides written notice of non-renewal not less than thirty (30) days prior to the expiration of the then-current term via written email notice.
6.2 Termination for Convenience. Either party may terminate this Agreement or any Order Form at any time upon sixty (60) days' prior written notice to the other party.

SECTION 8. LIMITATION OF LIABILITY
8.1 Consequential Damages Waiver. NEITHER PARTY SHALL BE LIABLE TO THE OTHER FOR ANY INDIRECT, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES, EXCEPT IN CASES OF GROSS NEGLIGENCE, WILLFUL MISCONDUCT, OR BREACH OF CONFIDENTIALITY.
8.2 Aggregate Liability Cap. EACH PARTY'S TOTAL MAXIMUM AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL BE STRICTLY LIMITED TO THE TOTAL FEES PAID OR PAYABLE BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE INCIDENT. CLAIMS ARISING FROM DATA BREACHES OR INDEMNIFICATION SHALL BE SUBJECT TO A SEPARATE SUPERCAP OF THREE TIMES (3X) ANNUAL FEES.

SECTION 11. MUTUAL INDEMNIFICATION
11.1 Customer Indemnification. Customer shall defend, indemnify, and hold harmless Vendor from and against third-party claims arising directly from Customer Data infringing third-party rights, provided Vendor gives prompt written notice.
11.2 Vendor Indemnification. Vendor shall defend, indemnify, and hold harmless Customer, its officers, employees, and affiliates from and against any third-party claims, liabilities, damages, and legal costs arising out of any allegation that the platform or services infringe or misappropriate any patent, copyright, trademark, or trade secret.

SECTION 14. DATA OWNERSHIP AND SERVICE LEVEL GUARANTEES
14.1 Customer Data Ownership. As between the parties, Customer retains all right, title, and interest (including all intellectual property rights) in and to Customer Data. Vendor is granted a limited, revocable license strictly necessary to host and deliver the services during the Term. Vendor shall not sell, license, or create derivative works from Customer Data.
14.2 Service Availability and Notice. Vendor shall provide at least 99.9% monthly uptime and shall not suspend access without at least five (5) business days' prior written notice and opportunity to cure, except in urgent cybersecurity emergencies.

SECTION 16. GOVERNING LAW AND DISPUTE RESOLUTION
16.1 Venue and Prevailing Party Fees. This Agreement shall be governed by the laws of the State of Delaware. Any dispute shall be resolved through binding arbitration or state/federal courts located in Wilmington, Delaware. The prevailing party in any dispute shall be entitled to recover reasonable attorneys' fees and court costs.`
  },
  {
    id: 'saas-aggressive-lockdown',
    name: 'Aggressive Vendor Lockdown (Version 2.0 Escalation)',
    description: 'An even more restrictive vendor draft illustrating predatory contractual drift: increases late fee penalties to 3.5%, extends renewal notice to 180 days, and imposes unilateral $50 liability limits.',
    targetCategory: 'Software & Technology',
    docBTitle: 'OmniCloud MSA (Aggressive Lockdown Revision 2.0)',
    docBText: `MASTER SERVICES AGREEMENT (MSA) - STRICT VENDOR REVISION

This Master Services Agreement ("Agreement") is entered into by OmniCloud Platform, Inc. ("Vendor") and Acme Enterprises, Inc. ("Customer").

SECTION 3. FEES AND PAYMENT TERMS
3.1 Billing and Payments. Customer shall pay all subscription fees immediately upon receipt of invoice in advance. Fees are strictly non-refundable and non-cancellable for any reason.
3.2 Late Payments. Late amounts accrue interest at 3.5% per month compounded daily, plus mandatory administrative collection charges of $5,000 per delinquency.

SECTION 6. TERM AND UNILATERAL TERMINATION
6.1 Term and Automatic Renewal. The term shall be sixty (60) months. The contract renews automatically for successive 36-month terms unless Customer serves notice via registered courier at least one hundred eighty (180) days prior to expiration.
6.2 Termination for Convenience. Vendor may terminate immediately without cause. Customer has zero termination rights.

SECTION 8. LIMITATION OF LIABILITY
8.1 Consequential Damages Waiver. Customer waives all indirect, punitive, and consequential damages.
8.2 Aggregate Liability Cap. VENDOR'S TOTAL CUMULATIVE LIABILITY IS CAPPED AT FIFTY DOLLARS ($50.00).

SECTION 11. INDEMNIFICATION
11.1 Customer Indemnity. Customer provides uncapped indemnification for all vendor losses, regulatory fines, and reputational damages.
11.2 Vendor Indemnity. [OMISSION DETECTED: No vendor indemnity provided under any circumstances.]

SECTION 14. DATA OWNERSHIP AND MONETIZATION
14.1 Broad Commercial Exploitation. Vendor owns all derivative analytical insights and AI models trained on Customer Data in perpetuity.
14.2 Immediate Discretionary Termination. Vendor may terminate or suspend access instantly without notice or cure period.

SECTION 16. GOVERNING LAW
16.1 Venue. Exclusive venue in Vendor's choice of forum. Customer pays all legal fees incurred by Vendor regardless of outcome.`
  }
];
