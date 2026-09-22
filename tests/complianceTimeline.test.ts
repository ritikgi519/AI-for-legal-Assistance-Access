import { describe, it, expect } from 'vitest';
import { extractComplianceTimeline, generateICSContent } from '../src/utils/timelineExtractor';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';

describe('Compliance Timeline & Milestone Extractor', () => {
  it('extracts key commencement, payment, and renewal milestones from Enterprise SaaS MSA', () => {
    const msa = SAMPLE_CONTRACTS[0];
    const timeline = extractComplianceTimeline(msa.content, msa.presetAnalysis?.critical_clause_audit || []);

    expect(timeline.milestones.length).toBeGreaterThanOrEqual(5);
    expect(timeline.initialTermMonths).toBe(36);
    expect(timeline.renewalTermMonths).toBe(24);

    // 1. Effective date check
    const effective = timeline.milestones.find(m => m.category === 'EFFECTIVE');
    expect(effective).toBeDefined();
    expect(effective?.relativeOffsetDays).toBe(0);

    // 2. Payment terms check
    const payment = timeline.milestones.find(m => m.category === 'PAYMENT');
    expect(payment).toBeDefined();
    expect(payment?.dateLabel).toContain('15');

    // 3. Non-renewal trap cutoff check
    const trap = timeline.milestones.find(m => m.isTrapClause && m.category === 'RENEWAL');
    expect(trap).toBeDefined();
    expect(trap?.urgency).toBe('CRITICAL');
    expect(trap?.actionRequired).toContain('certified');

    // 4. Initial term expiration check
    const expiration = timeline.milestones.find(m => m.category === 'TERMINATION');
    expect(expiration).toBeDefined();
    expect(expiration?.dateLabel).toContain('36');
  });

  it('generates a valid RFC 5545 iCalendar string for calendar export', () => {
    const msa = SAMPLE_CONTRACTS[0];
    const timeline = extractComplianceTimeline(msa.content, msa.presetAnalysis?.critical_clause_audit || []);
    const ics = generateICSContent(timeline.milestones, msa.title);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:');
    expect(ics).toContain('DESCRIPTION:');
  });

  it('handles arbitrary contracts gracefully with fallback milestones', () => {
    const arbitraryText = `AGREEMENT made this 1st day of January 2025 by and between Party A and Party B.
    Party B shall pay within 30 days of invoice date.
    The term of this agreement shall be 12 months. Either party may terminate with 30 days written notice.`;

    const timeline = extractComplianceTimeline(arbitraryText);
    expect(timeline.milestones.length).toBeGreaterThan(2);

    const payment = timeline.milestones.find(m => m.category === 'PAYMENT');
    expect(payment).toBeDefined();
  });
});
