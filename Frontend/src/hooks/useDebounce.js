import { useState, useEffect } from "react";

/**
 * Custom hook to debounce fast-changing values (e.g. search inputs).
 * Prevents unnecessary re-renders, filter operations, or API calls on every keystroke.
 *
 * @template T
 * @param {T} value - The input value to debounce
 * @param {number} [delay=300] - Delay in milliseconds (default: 300ms)
 * @returns {T} - The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear timeout if value changes before delay runs out (user is still typing)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
