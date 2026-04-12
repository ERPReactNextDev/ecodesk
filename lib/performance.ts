// Performance utilities for Ecodesk
"use client";

import React from "react";
import ReactDOM from "react-dom";

/**
 * Debounce function - delays execution until after delay ms of inactivity
 * Use for: search inputs, resize handlers, scroll events
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function - executes at most once per period
 * Use for: scroll handlers, mousemove, rapid clicks
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoize expensive computations
 * Use for: sorting large arrays, complex calculations
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();

  return (...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  };
}

/**
 * Request deduplication wrapper
 * Prevents multiple identical requests from firing simultaneously
 */
export function createDeduplicatedRequest<T>() {
  const pending = new Map<string, Promise<T>>();

  return async (key: string, requestFn: () => Promise<T>): Promise<T> => {
    if (pending.has(key)) {
      return pending.get(key)!;
    }

    const promise = requestFn().finally(() => {
      pending.delete(key);
    });

    pending.set(key, promise);
    return promise;
  };
}

/**
 * Measure component render time (dev only)
 * Usage: const end = measureRender('ComponentName'); ... end();
 */
export function measureRender(componentName: string): () => void {
  if (process.env.NODE_ENV === "production") {
    return () => {};
  }

  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    if (duration > 16) {
      // Longer than one frame (60fps)
      console.warn(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Batch multiple state updates
 * Use when updating multiple related states at once
 */
export function batchUpdates<T>(
  updates: (() => void)[],
  setState: React.Dispatch<React.SetStateAction<T>>
): void {
  // React 18+ automatically batches, but this helps with older patterns
  ReactDOM.unstable_batchedUpdates?.(() => {
    updates.forEach((update) => update());
  });
}

/**
 * Intersection Observer hook for lazy loading
 * Returns true when element enters viewport
 */
export function useInView(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isInView, setIsInView] = React.useState(false);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);

  return isInView;
}

/**
 * Virtual list calculator for large tables
 * Returns visible slice of data based on scroll position
 */
export function calculateVisibleSlice<T>(
  data: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  overscan = 5
): { visibleData: T[]; startIndex: number; offsetY: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
  const endIndex = Math.min(data.length, startIndex + visibleCount);

  return {
    visibleData: data.slice(startIndex, endIndex),
    startIndex,
    offsetY: startIndex * itemHeight,
  };
}

/**
 * Performance mark for measuring operations
 */
export function markPerformance(label: string): void {
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark(label);
  }
}

/**
 * Measure between two marks
 */
export function measurePerformance(label: string, startMark: string, endMark: string): void {
  if (typeof performance !== "undefined" && performance.measure) {
    try {
      performance.measure(label, startMark, endMark);
      const entries = performance.getEntriesByName(label);
      const lastEntry = entries[entries.length - 1];
      if (lastEntry && lastEntry.duration > 100) {
        console.warn(`[Performance] ${label}: ${lastEntry.duration.toFixed(2)}ms`);
      }
    } catch (e) {
      // Marks might not exist
    }
  }
}
