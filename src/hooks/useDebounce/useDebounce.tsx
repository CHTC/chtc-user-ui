import { useEffect, useState } from "react";

/**
 * useDebounce
 *
 * Returns a debounced version of a value that only updates after the
 * specified delay has passed without the value changing. Useful for
 * debouncing search inputs, filters, etc.
 *
 * @param value - The input value to debounce.
 * @param delay - Debounce delay in milliseconds.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
