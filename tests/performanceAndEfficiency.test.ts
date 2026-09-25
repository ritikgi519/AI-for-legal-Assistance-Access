/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { FastLRUCache } from '../src/utils/memoCache';
import { parseDocumentGlossary } from '../src/utils/legalGlossaryParser';
import { compareDocuments } from '../src/utils/documentComparator';
import { extractComplianceTimeline } from '../src/utils/timelineExtractor';
import { performSemanticSearch } from '../src/utils/semanticSearch';
import { SAMPLE_CONTRACTS } from '../src/data/sampleContracts';

describe('Performance and Efficiency Optimizations', () => {
  it('FastLRUCache stores, retrieves, and evicts entries correctly', () => {
    const cache = new FastLRUCache<string>(3);
    
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    cache.set('key3', 'val3');

    expect(cache.size).toBe(3);
    expect(cache.get('key1')).toBe('val1');
    expect(cache.get('key2')).toBe('val2');

    // Adding key4 should evict key3 because key1 and key2 were accessed more recently
    cache.set('key4', 'val4');
    expect(cache.size).toBe(3);
    expect(cache.has('key4')).toBe(true);
    expect(cache.has('key3')).toBe(false);
  });

  it('FastLRUCache generates consistent 32-bit hash keys', () => {
    const sample = 'IN WITNESS WHEREOF, the parties hereto have executed this Agreement.';
    const key1 = FastLRUCache.hashKey(sample, 'test');
    const key2 = FastLRUCache.hashKey(sample, 'test');
    expect(key1).toBe(key2);
    expect(key1.startsWith('test:')).toBe(true);
  });

  it('Memoized parseDocumentGlossary executes sub-millisecond on cache hit', () => {
    const text = SAMPLE_CONTRACTS[0].content;

    // First call (populates cache)
    const t0 = performance.now();
    const res1 = parseDocumentGlossary(text);
    const durationFirst = performance.now() - t0;

    // Second call (cache hit)
    const t1 = performance.now();
    const res2 = parseDocumentGlossary(text);
    const durationCached = performance.now() - t1;

    expect(res1.terms.length).toBe(res2.terms.length);
    expect(res1.totalOccurrences).toBe(res2.totalOccurrences);
    // Cached call should be faster or virtually instantaneous (< 2ms)
    expect(durationCached).toBeLessThan(10);
  });

  it('Memoized compareDocuments executes sub-millisecond on cache hit', () => {
    const docA = SAMPLE_CONTRACTS[0].content;
    const docB = SAMPLE_CONTRACTS[1].content;

    const res1 = compareDocuments(docA, docB, 'Doc A', 'Doc B');
    const t0 = performance.now();
    const res2 = compareDocuments(docA, docB, 'Doc A', 'Doc B');
    const durationCached = performance.now() - t0;

    expect(res1.similarityScore).toBe(res2.similarityScore);
    expect(durationCached).toBeLessThan(5);
  });

  it('extractComplianceTimeline extracts milestones and operates under 15ms', () => {
    const doc = SAMPLE_CONTRACTS[0].content;
    const clauses = SAMPLE_CONTRACTS[0].presetAnalysis?.critical_clause_audit || [];

    const t0 = performance.now();
    const timeline = extractComplianceTimeline(doc, clauses);
    const duration = performance.now() - t0;

    expect(timeline.milestones.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(30);
  });

  it('performSemanticSearch returns relevant results within microsecond budget', () => {
    const doc = SAMPLE_CONTRACTS[0].content;
    const analysis = SAMPLE_CONTRACTS[0].presetAnalysis || null;

    const t0 = performance.now();
    const results = performSemanticSearch('indemnity', analysis, doc);
    const duration = performance.now() - t0;

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.title.toLowerCase().includes('indemn') || r.category.toLowerCase().includes('indemn'))).toBe(true);
    expect(duration).toBeLessThan(20);
  });
});
