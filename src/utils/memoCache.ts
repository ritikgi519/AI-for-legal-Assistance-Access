/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * High-performance, memory-bounded LRU Cache with sub-millisecond lookups.
 * Prevents redundant AST scanning, tokenization, diff calculations, and regex parsing.
 */
export class FastLRUCache<T> {
  private cache = new Map<string, { value: T; lastAccessed: number }>();
  private maxEntries: number;
  private accessCounter = 0;

  constructor(maxEntries = 80) {
    this.maxEntries = maxEntries;
  }

  /**
   * Generates a lightweight, fast 32-bit hash key for strings to minimize memory overhead
   */
  public static hashKey(input: string, prefix = ''): string {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    }
    return `${prefix}:${(hash >>> 0).toString(36)}:${input.length}`;
  }

  public get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    entry.lastAccessed = ++this.accessCounter;
    return entry.value;
  }

  public set(key: string, value: T): void {
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      let oldestKey: string | null = null;
      let oldestOrder = Infinity;

      for (const [k, v] of this.cache.entries()) {
        if (v.lastAccessed < oldestOrder) {
          oldestOrder = v.lastAccessed;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { value, lastAccessed: ++this.accessCounter });
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }
}
