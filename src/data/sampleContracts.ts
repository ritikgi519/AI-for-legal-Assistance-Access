import { SampleContract } from '../types';

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    id: 'saas-msa',
    title: 'Enterprise Cloud SaaS Master Services Agreement',
    category: 'Software & Technology',
    parties: 'OmniCloud Platform, Inc. ("Vendor") vs. Acme Corp ("Customer")',
    description: 'A heavily unilateral SaaS contract featuring uncapped customer indemnities, auto-renewal with 120-day notice traps, and vendor-only termination rights.',
    content: `MASTER SERVICES AGREEMENT (MSA)

This Master Services Agreement ("Agreement") is made and entered into as of October 12, 2024, by and between OmniCloud Platform, Inc., a Delaware corporation ("Vendor"), and Acme Enterprises, Inc., a California corporation ("Customer").

SECTION 3. FEES AND PAYMENT TERMS
3.1 Billing and Payments. Customer shall pay all subscription fees specified in all applicable Order Forms annually in advance within fifteen (15) days of the invoice date. All payment obligations are non-cancelable and fees paid are strictly non-refundable under any circumstances, including upon early termination or service interruption.
3.2 Late Payments. Any late payments shall accrue interest at the rate of 2.5% per month or the highest rate permitted by law, whichever is higher, plus reimbursement of all collection costs, collection agency charges, and full outside attorney fees incurred by Vendor.

SECTION 6. TERM AND UNILATERAL TERMINATION
6.1 Term and Automatic Renewal. This Agreement commences on the Effective Date and shall continue for an initial period of thirty-six (36) months ("Initial Term"). Thereafter, this Agreement shall automatically renew for successive twenty-four (24) month renewal periods, unless Customer provides written notice of non-renewal not less than one hundred twenty (120) days prior to the expiration of the then-current term via certified physical mail to Vendor headquarters.
6.2 Termination for Convenience. Vendor may terminate this Agreement or any Order Form at any time without cause upon thirty (30) days' written notice to Customer. Customer shall have no right to terminate this Agreement for convenience.

SECTION 8. LIMITATION OF LIABILITY
8.1 Consequential Damages Waiver. IN NO EVENT SHALL VENDOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, PUNITIVE, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THIS AGREEMENT.
8.2 Aggregate Liability Cap. VENDOR'S TOTAL CUMULATIVE AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT, REGARDLESS OF THE THEORY OF LIABILITY OR BREACH OF ESSENTIAL PURPOSE, SHALL BE STRICTLY LIMITED TO THE LESSER OF (A) ONE HUNDRED DOLLARS ($100.00) OR (B) THE FEES ACTUALLY PAID BY CUSTOMER IN THE PRECEDING ONE (1) MONTH.

SECTION 11. INDEMNIFICATION
11.1 Customer Indemnification. Customer shall defend, indemnify, and hold harmless Vendor, its affiliates, directors, officers, employees, agents, and licensors from and against any and all claims, demands, losses, damages, liabilities, costs, settlements, fines, and legal expenses (including uncapped attorneys' fees) arising out of, relating to, or resulting from Customer's use of the Services, Customer Data, or alleged infringement or misappropriation of third-party rights.
11.2 Vendor Indemnification. [OMISSION DETECTED: No vendor indemnity for intellectual property infringement or data breaches provided in source instrument.]

SECTION 14. DATA OWNERSHIP AND SERVICE SUSPENSION
14.1 Vendor Data License. Customer hereby grants Vendor a perpetual, irrevocable, royalty-free, worldwide, transferable, sublicensable license to aggregate, analyze, alter, monetize, and create derivative works from all Customer Data uploaded or transmitted to the platform.
14.2 Discretionary Suspension. Vendor reserves the unilateral right to suspend access to the platform without prior notice or liability if Vendor suspects any breach, dispute, or non-cooperation by Customer.

SECTION 16. GOVERNING LAW AND DISPUTE RESOLUTION
16.1 Venue and Fee Shifting. This Agreement shall be governed exclusively by the laws of the State of Delaware, without regard to conflict of law principles. Any dispute shall be resolved solely in federal or state courts in Wilmington, Delaware. Customer waives all rights to jury trial and class action representation. In any dispute, Customer shall pay all legal fees and court costs incurred by Vendor regardless of the prevailing party.`,
    presetAnalysis: {
      document_overview: {
        document_title: "Enterprise Cloud SaaS Master Services Agreement",
        document_type: "Software as a Service Master Services Agreement",
        parties_identified: ["OmniCloud Platform, Inc. (Vendor)", "Acme Enterprises, Inc. (Customer)"],
        fairness_index: 22,
        executive_summary: "This agreement is heavily biased in favor of OmniCloud Platform (Vendor), creating extreme operational and financial risk for Acme Enterprises (Customer). The contract imposes strict 15-day non-refundable advance payment terms, a 120-day certified mail non-renewal trap, an illusory $100 vendor liability cap, unilateral termination for convenience solely for the vendor, and unilateral customer indemnification with zero reciprocal IP indemnity from the vendor."
      },
      critical_clause_audit: [
        {
          clause_id: "Section 8.2",
          clause_category: "Liability",
          verbatim_quote: "VENDOR'S TOTAL CUMULATIVE AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT, REGARDLESS OF THE THEORY OF LIABILITY OR BREACH OF ESSENTIAL PURPOSE, SHALL BE STRICTLY LIMITED TO THE LESSER OF (A) ONE HUNDRED DOLLARS ($100.00) OR (B) THE FEES ACTUALLY PAID BY CUSTOMER IN THE PRECEDING ONE (1) MONTH.",
          plain_english_meaning: "If the vendor causes a massive data loss, system outage, or breaches the contract entirely, the most you can ever recover from them in court is $100 or one month of fees, even if your business loses millions.",
          risk_level: "CRITICAL",
          party_favored: "Vendor",
          hidden_pitfalls: [
            "Caps liability at an artificial $100 ceiling regardless of contract value",
            "Fails to carve out gross negligence, willful misconduct, or data breach liabilities",
            "Leaves customer virtually without any financial remedy for vendor breach"
          ],
          proposed_redline: "EACH PARTY'S MAXIMUM AGGREGATE LIABILITY UNDER THIS AGREEMENT SHALL BE LIMITED TO THE TOTAL FEES PAID OR PAYABLE BY CUSTOMER IN THE TWELVE (12) MONTHS PRECEDING THE INCIDENT, EXCEPT FOR BREACHES OF CONFIDENTIALITY, DATA SECURITY, OR INDEMNIFICATION OBLIGATIONS WHICH SHALL BE SUBJECT TO A MUTUAL SUPERCAP OF 3X ANNUAL FEES."
        },
        {
          clause_id: "Section 11.1 & 11.2",
          clause_category: "Indemnity",
          verbatim_quote: "Customer shall defend, indemnify, and hold harmless Vendor... from and against any and all claims... (including uncapped attorneys' fees)... [OMISSION DETECTED: No vendor indemnity for intellectual property infringement or data breaches provided in source instrument.]",
          plain_english_meaning: "You must pay all legal fees and settlement costs if someone sues the vendor over your data, but if a third party sues you because the vendor stole their software or patent, the vendor provides zero defense or reimbursement.",
          risk_level: "CRITICAL",
          party_favored: "Vendor",
          hidden_pitfalls: [
            "Complete lack of standard vendor IP infringement indemnification ([OMISSION DETECTED])",
            "Uncapped customer indemnity with no fault or causation limitation",
            "Customer assumes open-ended third-party litigation exposure"
          ],
          proposed_redline: "Vendor shall defend, indemnify, and hold harmless Customer against any third-party claims alleging that the Services infringe any patent, copyright, or trademark. Customer shall indemnify Vendor solely against third-party claims arising directly from Customer's gross negligence or unauthorized modification of the Services."
        },
        {
          clause_id: "Section 6.1 & 6.2",
          clause_category: "Termination",
          verbatim_quote: "Vendor may terminate this Agreement or any Order Form at any time without cause upon thirty (30) days' written notice to Customer. Customer shall have no right to terminate this Agreement for convenience.",
          plain_english_meaning: "The vendor can cancel your service anytime for no reason on 30 days' notice, but you are locked into a 3-year term with automatic 2-year renewals and have zero right to walk away even if you no longer need the software.",
          risk_level: "HIGH",
          party_favored: "Vendor",
          hidden_pitfalls: [
            "Unilateral termination for convenience favors vendor exclusively",
            "120-day certified mail non-renewal window is designed to trap customers into 2-year extensions",
            "Creates immediate operational shutdown risk without migration transition assistance"
          ],
          proposed_redline: "Either party may terminate this Agreement for convenience upon ninety (90) days' prior written notice. In the event of early termination by Vendor without cause, Vendor shall promptly issue a pro-rata refund of any prepaid, unearned fees."
        },
        {
          clause_id: "Section 14.1",
          clause_category: "IP",
          verbatim_quote: "Customer hereby grants Vendor a perpetual, irrevocable, royalty-free, worldwide, transferable, sublicensable license to aggregate, analyze, alter, monetize, and create derivative works from all Customer Data uploaded or transmitted to the platform.",
          plain_english_meaning: "The vendor can permanently keep, modify, resell, and use your confidential company data and customer files forever, even after you cancel your subscription.",
          risk_level: "CRITICAL",
          party_favored: "Vendor",
          hidden_pitfalls: [
            "Surrenders commercial exploitation and derivative rights of proprietary customer data",
            "Perpetual and irrevocable grant survives contract termination",
            "Potential violation of customer privacy covenants and GDPR/CCPA commitments"
          ],
          proposed_redline: "Customer retains all right, title, and interest in and to Customer Data. Vendor is granted a limited, non-exclusive license solely to host and process Customer Data to the extent necessary to provide the Services during the Term."
        },
        {
          clause_id: "Section 16.1",
          clause_category: "Dispute",
          verbatim_quote: "In any dispute, Customer shall pay all legal fees and court costs incurred by Vendor regardless of the prevailing party.",
          plain_english_meaning: "Even if you sue the vendor and win 100% of your claim, you are still legally required to pay all of the vendor's attorney fees and legal expenses.",
          risk_level: "HIGH",
          party_favored: "Vendor",
          hidden_pitfalls: [
            "One-way fee shifting creates a severe financial deterrent to enforcing legitimate rights",
            "Predatory provision contrary to standard 'prevailing party' legal conventions"
          ],
          proposed_redline: "In the event of any legal dispute arising out of this Agreement, the prevailing party shall be entitled to recover reasonable attorneys' fees and court costs from the non-prevailing party."
        }
      ],
      what_if_stress_tests: [
        {
          scenario: "OmniCloud suffers a catastrophic security breach exposing Customer confidential records",
          consequence_chain: "Section 8.2 (Aggregate Cap) limits total liability to $100 -> Section 8.1 (Consequential Damages Waiver) bars recovery for lost business -> Section 11.2 ([OMISSION DETECTED]) leaves Customer without vendor indemnity",
          user_protection_level: "Unprotected"
        },
        {
          scenario: "Customer attempts to cancel contract due to cost-cutting after 14 months",
          consequence_chain: "Section 6.2 denies Customer termination for convenience -> Section 3.1 deems all fees non-refundable -> Section 6.1 enforces remaining 22 months of subscription payments under threat of Section 3.2 2.5%/mo late penalties",
          user_protection_level: "Unprotected"
        },
        {
          scenario: "Vendor breaches uptime SLA or degrades system performance",
          consequence_chain: "[OMISSION DETECTED: No Service Level Agreement or remedy credit clause] -> Section 3.1 prohibits withholding payment -> Section 14.2 authorizes Vendor to suspend service if Customer withholds fees during dispute",
          user_protection_level: "Unprotected"
        }
      ],
      lawyer_consultation_dossier: {
        top_red_flags_for_discussion: [
          "Section 8.2: $100 liability cap renders vendor effectively immune to contract breach, system failure, and gross negligence.",
          "Section 11.2 ([OMISSION DETECTED]): Absence of vendor intellectual property infringement indemnity exposes customer to third-party patent/copyright lawsuits.",
          "Section 14.1: Perpetual license allowing vendor to monetize and create derivative works from proprietary customer data.",
          "Section 16.1: One-sided fee-shifting clause requiring customer to pay vendor's legal fees even if customer wins in litigation."
        ],
        high_leverage_questions_for_counsel: [
          "How can we redline Section 8.2 to establish a customary 12-month trailing fee liability cap with a separate supercap for data breaches and confidentiality?",
          "Does Delaware contract jurisprudence enforce Section 16.1's unilateral fee shift regardless of prevailing party status?",
          "What standard language should we insert for a robust IP infringement defense and hold-harmless provision under Section 11?"
        ],
        suggested_walkaway_terms: [
          "Refusal by Vendor to eliminate the $100 liability cap and agree to at least a 1x-2x annual fee cap.",
          "Refusal to remove the perpetual commercial data license in Section 14.1 and restore strict customer IP ownership.",
          "Refusal to strike the unilateral legal fee reimbursement clause in Section 16.1."
        ]
      },
      statutory_disclaimer: "This analysis provides automated legal document intelligence for educational and preparatory purposes only, and does not constitute formal legal representation, statutory interpretation, or legal advice."
    }
  },
  {
    id: 'contractor-agreement',
    title: 'Freelance Software Developer Independent Contractor Agreement',
    category: 'Employment & Consulting',
    parties: 'HyperGrowth Labs, LLC ("Company") vs. Jane Doe ("Contractor")',
    description: 'Contains aggressive pre-existing invention claims, a 2-year 100-mile non-compete, net-90 payment terms with forfeiture clauses, and unilateral liquidated damages.',
    content: `INDEPENDENT CONTRACTOR SERVICES AGREEMENT

This Agreement is entered into as of January 15, 2025, by and between HyperGrowth Labs, LLC ("Company"), and Jane Doe, an independent consultant ("Contractor").

SECTION 2. COMPENSATION AND EXPENSES
2.1 Payment Schedule. Company shall remit payment for approved invoices within ninety (90) days of receipt ("Net 90"). Invoices must be submitted within seven (7) days of milestone completion. Any invoice submitted after seven days shall be deemed permanently waived and forfeited by Contractor.
2.2 Disputed Fees. Company reserves the right to withhold up to 100% of payment if Company, in its sole and absolute discretion, deems the Deliverables unsatisfactory.

SECTION 4. INTELLECTUAL PROPERTY ASSIGNMENT
4.1 Inventions and Prior Works. Contractor hereby assigns to Company all right, title, and interest in all works of authorship, software, algorithms, ideas, designs, patents, and inventions conceived, developed, or reduced to practice by Contractor, whether prior to the Effective Date or during the Term, and whether or not developed using Company equipment or on Contractor's own personal time.
4.2 Moral Rights and Power of Attorney. Contractor irrevocably waives all moral rights and appoints Company as Contractor's attorney-in-fact with irrevocable power to execute any IP assignment documents.

SECTION 7. RESTRICTIVE COVENANTS AND NON-COMPETE
7.1 Non-Competition. For the duration of this Agreement and for a period of twenty-four (24) months following termination for any reason, Contractor shall not directly or indirectly provide consulting, software development, advisory, or technical services to any business operating in the technology sector within a one hundred (100) mile radius of any Company office.
7.2 Liquidated Damages. In the event Contractor breaches Section 7.1, Contractor shall pay Company liquidated damages of $50,000 per violation within ten (10) days, and Contractor acknowledges this amount represents a reasonable pre-estimate of damages.

SECTION 9. TERMINATION
9.1 Immediate Termination by Company. Company may terminate this Agreement immediately upon written notice for any reason.
9.2 Notice by Contractor. [OMISSION DETECTED: No provision permitting Contractor to terminate for non-payment or convenience.]`,
    presetAnalysis: {
      document_overview: {
        document_title: "Freelance Software Developer Independent Contractor Agreement",
        document_type: "Independent Contractor Consulting Agreement",
        parties_identified: ["HyperGrowth Labs, LLC (Company)", "Jane Doe (Contractor)"],
        fairness_index: 18,
        executive_summary: "This agreement is highly predatory toward the independent contractor. It expropriates all prior personal inventions conceived before signing, imposes an oppressive 2-year 100-mile non-compete with $50,000 liquidated damages, forces a 90-day payment delay with invoice forfeiture traps, and grants the company sole discretion to withhold 100% of compensation while denying the contractor any termination rights."
      },
      critical_clause_audit: [
        {
          clause_id: "Section 4.1",
          clause_category: "IP",
          verbatim_quote: "Contractor hereby assigns to Company all right, title, and interest in all works of authorship, software, algorithms, ideas, designs, patents, and inventions conceived, developed, or reduced to practice by Contractor, whether prior to the Effective Date or during the Term, and whether or not developed using Company equipment or on Contractor's own personal time.",
          plain_english_meaning: "The company takes complete legal ownership of every piece of code, app, or idea you have ever built in your entire life prior to this contract, as well as anything you build in your spare time at home while under contract.",
          risk_level: "CRITICAL",
          party_favored: "Company",
          hidden_pitfalls: [
            "Retroactive assignment captures pre-existing open-source code and prior personal projects",
            "Moonlighting ban captures off-hours unrelated personal software development",
            "Exceeds typical statutory boundaries for work-for-hire provisions"
          ],
          proposed_redline: "Contractor assigns to Company all right, title, and interest solely in custom Deliverables created specifically for Company pursuant to an authorized Statement of Work. Contractor retains all rights in pre-existing intellectual property, tools, and background technology."
        },
        {
          clause_id: "Section 7.1",
          clause_category: "Non-Compete",
          verbatim_quote: "Contractor shall not directly or indirectly provide consulting, software development, advisory, or technical services to any business operating in the technology sector within a one hundred (100) mile radius of any Company office.",
          plain_english_meaning: "You are legally banned from writing software or taking any freelance client in the entire tech industry for 2 full years after leaving, and they will fine you $50,000 if you do.",
          risk_level: "CRITICAL",
          party_favored: "Company",
          hidden_pitfalls: [
            "Overbroad geographic and industry scope prevents contractor from earning a livelihood",
            "Punitive liquidated damages clause intended to intimidate rather than compensate",
            "May violate FTC non-compete rules and state statutes (e.g. California Bus. & Prof. Code § 16600)"
          ],
          proposed_redline: "Delete Section 7 entirely, or replace with: Contractor agrees not to solicit Company's existing active clients for a period of six (6) months following termination of this Agreement."
        },
        {
          clause_id: "Section 2.1",
          clause_category: "Payment",
          verbatim_quote: "Company shall remit payment for approved invoices within ninety (90) days of receipt (\"Net 90\"). Invoices must be submitted within seven (7) days of milestone completion. Any invoice submitted after seven days shall be deemed permanently waived and forfeited by Contractor.",
          plain_english_meaning: "You must wait 3 full months to get paid, missing an invoice by one day means you get $0, and the client can unilaterally decide they don't like the work and keep all your code without paying a dime.",
          risk_level: "HIGH",
          party_favored: "Company",
          hidden_pitfalls: [
            "Extreme Net 90 payment cycle causes contractor cash flow choke points",
            "Subjective 'sole and absolute discretion' satisfaction clause creates wage theft vulnerability",
            "Unreasonable 7-day forfeiture window"
          ],
          proposed_redline: "Company shall pay all undisputed invoices within thirty (30) days of receipt ('Net 30'). Deliverables shall be deemed accepted unless Company provides specific written objections within ten (10) business days. Contractor shall be compensated for all hours worked prior to any rejection."
        },
        {
          clause_id: "Section 9.2",
          clause_category: "Termination",
          verbatim_quote: "[OMISSION DETECTED: No provision permitting Contractor to terminate for non-payment or convenience.]",
          plain_english_meaning: "The contract gives the company the right to fire you on the spot, but gives you zero legal exit path if the company stops paying or mistreats you.",
          risk_level: "HIGH",
          party_favored: "Company",
          hidden_pitfalls: [
            "Contractor is contractually bonded without a reciprocal exit mechanism",
            "Leaves contractor vulnerable to indefinite performance demands during payment disputes"
          ],
          proposed_redline: "Either party may terminate this Agreement without cause upon fourteen (14) days' written notice, or immediately upon written notice if the other party breaches a material obligation and fails to cure within seven (7) days."
        }
      ],
      what_if_stress_tests: [
        {
          scenario: "Company refuses to pay final invoice claiming Deliverable is unsatisfactory",
          consequence_chain: "Section 2.2 grants Company sole discretion to withhold 100% of fees -> Section 4.1 already assigned IP on creation -> Section 9.2 provides Contractor no contractual right to terminate or reclaim work",
          user_protection_level: "Unprotected"
        },
        {
          scenario: "Contractor accepts a remote React development contract for another startup in the same city",
          consequence_chain: "Section 7.1 triggers non-compete violation across entire tech sector -> Section 7.2 demands immediate $50,000 liquidated damages forfeiture within 10 days",
          user_protection_level: "Unprotected"
        },
        {
          scenario: "Contractor launches an indie mobile app built entirely on personal weekends",
          consequence_chain: "Section 4.1 claims assignment of all software conceived 'on Contractor's own personal time' -> Company can legally claim 100% title and revenue from the app",
          user_protection_level: "Unprotected"
        }
      ],
      lawyer_consultation_dossier: {
        top_red_flags_for_discussion: [
          "Section 4.1: Sweeping assignment of pre-existing and personal moonlighting code.",
          "Section 7.1 & 7.2: Unenforceable or punitive 2-year non-compete with $50,000 liquidated damages.",
          "Section 2.2: Unilateral subjective acceptance clause allowing total fee withholding.",
          "Section 9.2 ([OMISSION DETECTED]): Missing contractor termination clause upon non-payment."
        ],
        high_leverage_questions_for_counsel: [
          "Under our local state law, is Section 7.1's 100-mile tech non-compete void as a matter of public policy against independent contractors?",
          "How can we craft a comprehensive 'Schedule of Prior Inventions' carve-out to insulate all existing GitHub repos and side projects from Section 4.1?",
          "What expedited dispute resolution or mechanic's lien equivalent applies if the client triggers Section 2.2 withholding?"
        ],
        suggested_walkaway_terms: [
          "Immediate strike of Section 4.1's retroactive and off-hours IP assignment.",
          "Complete removal of Section 7.1 and 7.2 non-compete and liquidated damages provisions.",
          "Reduction of payment terms from Net 90 to Net 30 with objective acceptance criteria."
        ]
      },
      statutory_disclaimer: "This analysis provides automated legal document intelligence for educational and preparatory purposes only, and does not constitute formal legal representation, statutory interpretation, or legal advice."
    }
  },
  {
    id: 'commercial-lease',
    title: 'Commercial Triple-Net Retail Lease Agreement',
    category: 'Real Estate & Property',
    parties: 'Apex Commercial Properties, Inc. ("Landlord") vs. Urban Roast Café ("Tenant")',
    description: 'Triple-net lease with hidden pass-through capital expenditures, automatic accelerated rent upon minor breach, and tenant indemnification for landlord negligence.',
    content: `COMMERCIAL LEASE AGREEMENT

This Commercial Lease Agreement ("Lease") is executed on March 1, 2024, by Apex Commercial Properties, Inc. ("Landlord"), and Urban Roast LLC ("Tenant").

SECTION 4. OPERATING EXPENSES AND CAPITAL ESCALATIONS
4.1 Operating Costs. Tenant shall pay its proportionate share (100%) of all Common Area Maintenance (CAM), operating costs, real estate taxes, and insurance. Operating Costs shall explicitly include, without amortization, all capital improvements, structural roof replacements, HVAC overhaul, seismic retrofitting, and Landlord's executive administrative overhead.
4.2 Audit Rights. [OMISSION DETECTED: No audit rights provided for Tenant to inspect or challenge Landlord's CAM invoices.]

SECTION 9. INDEMNIFICATION AND LANDLORD EXCULPATION
9.1 Tenant Indemnity. Tenant shall defend, indemnify, and hold Landlord harmless against any damage, injury, death, loss, or litigation occurring in, on, or about the Leased Premises, including any injury or damage resulting from Landlord's or Landlord's contractors' active negligence.
9.2 Waiver of Subrogation. Tenant waives all rights of recovery against Landlord. Landlord shall have no reciprocal waiver.

SECTION 13. DEFAULT AND ACCELERATED RENT
13.1 Immediate Acceleration. If Tenant fails to pay any installment of Rent within five (5) days of the due date, Landlord may immediately accelerate and declare the entire balance of Rent for the remainder of the ten (10) year term immediately due and payable in full, with no obligation by Landlord to mitigate damages or re-let the premises.
13.2 Surrender of Tenant Trade Fixtures. Upon any default, all Tenant espresso machines, roasting equipment, and personal property shall automatically forfeit to Landlord.`,
    presetAnalysis: {
      document_overview: {
        document_title: "Commercial Triple-Net Retail Lease Agreement",
        document_type: "Commercial Real Estate Triple-Net Lease",
        parties_identified: ["Apex Commercial Properties, Inc. (Landlord)", "Urban Roast LLC (Tenant)"],
        fairness_index: 25,
        executive_summary: "This commercial retail lease shifts catastrophic building ownership liabilities onto the tenant. The landlord passes through unamortized structural capital replacements (roof, HVAC, seismic) into monthly CAM charges without audit rights, demands tenant indemnification even for the landlord's own active negligence, and triggers immediate 10-year rent acceleration with asset forfeiture for a 5-day late payment."
      },
      critical_clause_audit: [
        {
          clause_id: "Section 13.1",
          clause_category: "Termination",
          verbatim_quote: "If Tenant fails to pay any installment of Rent within five (5) days of the due date, Landlord may immediately accelerate and declare the entire balance of Rent for the remainder of the ten (10) year term immediately due and payable in full, with no obligation by Landlord to mitigate damages or re-let the premises.",
          plain_english_meaning: "If you are 6 days late on one month's rent, the landlord can instantly demand all 10 years of future rent at once (hundreds of thousands of dollars) and doesn't even have to try finding a replacement tenant.",
          risk_level: "CRITICAL",
          party_favored: "Landlord",
          hidden_pitfalls: [
            "Absence of statutory duty to mitigate damages",
            "Draconian 5-day grace period with no written cure notice requirement",
            "Accelerated rent constitutes an illegal penalty under many jurisdictions"
          ],
          proposed_redline: "In the event of a monetary default, Landlord shall provide Tenant written notice and a fifteen (15) day cure window. If uncured, Landlord may terminate the lease, subject to Landlord's statutory obligation to make commercially reasonable efforts to mitigate damages by re-letting the premises."
        },
        {
          clause_id: "Section 4.1",
          clause_category: "Payment",
          verbatim_quote: "Operating Costs shall explicitly include, without amortization, all capital improvements, structural roof replacements, HVAC overhaul, seismic retrofitting, and Landlord's executive administrative overhead.",
          plain_english_meaning: "The landlord can force you to pay upfront for replacing the entire building roof or upgrading structural foundations in a single month, and you aren't legally allowed to see the receipts.",
          risk_level: "CRITICAL",
          party_favored: "Landlord",
          hidden_pitfalls: [
            "Lumps multi-decade structural capital expenditures into immediate tenant operational expenses",
            "Tenant pays for permanent building appreciation with zero equity",
            "Total absence of CAM financial audit rights ([OMISSION DETECTED])"
          ],
          proposed_redline: "Capital expenditures shall be excluded from Operating Costs, except for cost-saving equipment amortized over its useful life in accordance with GAAP. Tenant shall have the annual right to audit Landlord's operating expense records upon thirty (30) days' notice."
        },
        {
          clause_id: "Section 9.1",
          clause_category: "Indemnity",
          verbatim_quote: "Tenant shall defend, indemnify, and hold Landlord harmless against any damage, injury, death, loss, or litigation occurring in, on, or about the Leased Premises, including any injury or damage resulting from Landlord's or Landlord's contractors' active negligence.",
          plain_english_meaning: "If the landlord's worker drops a hammer on a customer's head or causes an electrical fire through carelessness, you have to pay the victim's hospital bills and defend the landlord in court.",
          risk_level: "HIGH",
          party_favored: "Landlord",
          hidden_pitfalls: [
            "Indemnification for active negligence is against public policy in many states",
            "Invalidates standard business liability insurance policies which exclude third-party intentional fault"
          ],
          proposed_redline: "Each party shall indemnify the other against claims arising from its own gross negligence or willful misconduct. Neither party shall be required to indemnify the other for claims resulting from the other party's negligence."
        }
      ],
      what_if_stress_tests: [
        {
          scenario: "Building roof collapses requiring a $120,000 emergency structural replacement",
          consequence_chain: "Section 4.1 designates unamortized structural roof replacement as an immediate Operating Cost -> Landlord invoices Tenant for 100% of $120,000 -> Section 4.2 denies audit rights -> Failure to pay within 5 days triggers Section 13.1 rent acceleration",
          user_protection_level: "Unprotected"
        },
        {
          scenario: "Tenant is forced to temporarily shut down due to a municipal health inspection delay",
          consequence_chain: "Rent is 5 days late -> Section 13.1 activates acceleration of remaining 10-year rent obligation -> Section 13.2 forfeits all espresso machines and trade fixtures to Landlord",
          user_protection_level: "Unprotected"
        }
      ],
      lawyer_consultation_dossier: {
        top_red_flags_for_discussion: [
          "Section 13.1: 5-day rent acceleration with explicit waiver of Landlord's duty to mitigate damages.",
          "Section 4.1: Pass-through of permanent structural capital improvements without amortization.",
          "Section 9.1: Indemnifying Landlord for Landlord's own active negligence."
        ],
        high_leverage_questions_for_counsel: [
          "Is Section 13.1's waiver of mitigation enforceable under our state commercial landlord-tenant statutes?",
          "How can we insert standard BOMA capital expenditure amortization exclusions into Section 4.1?",
          "Can our commercial property insurer provide coverage if Section 9.1's active negligence indemnity remains?"
        ],
        suggested_walkaway_terms: [
          "Exclusion of major structural capital improvements (roof, foundation, HVAC) from operating expenses.",
          "Mandatory inclusion of a 10-day written notice and cure period before lease default or rent acceleration.",
          "Removal of indemnification for Landlord's active negligence."
        ]
      },
      statutory_disclaimer: "This analysis provides automated legal document intelligence for educational and preparatory purposes only, and does not constitute formal legal representation, statutory interpretation, or legal advice."
    }
  }
];
