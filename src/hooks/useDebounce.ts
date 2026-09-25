/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce fast-changing values (e.g. search queries, text input).
 * Drastically reduces redundant re-renders and CPU execution during user keystrokes.
 * @param value The raw input value
 * @param delay Milliseconds to delay updating the debounced value (default: 150ms)
 */
export function useDebounce<T>(value: T, delay = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
