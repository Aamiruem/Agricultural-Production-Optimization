import { useEffect, useRef, useState } from "react";

/**
 * Keeps the last `max` samples of a polled value, appending one per data update.
 * `stamp` must change on every fetch (TanStack Query's dataUpdatedAt).
 */
export function useSamples(value, stamp, max = 40) {
  const [samples, setSamples] = useState([]);
  const lastStamp = useRef(null);
  useEffect(() => {
    if (value == null || stamp == null || stamp === lastStamp.current) return;
    lastStamp.current = stamp;
    setSamples((prev) => [
      ...prev.slice(-(max - 1)),
      { t: stamp, ...(typeof value === "object" ? value : { v: value }) },
    ]);
  }, [value, stamp, max]);
  return samples;
}

/** Debounce a fast-changing value (slider drags) before it triggers network work. */
export function useDebounced(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
