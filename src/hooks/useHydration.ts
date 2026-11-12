"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Custom hook to safely determine if client-side hydration has finished.
 * Uses useSyncExternalStore to avoid cascading renders and ESLint warnings in React 19.
 */
export function useHydration(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * Hook to read Zustand store values safely without triggering hydration mismatches.
 * Returns `fallback` during SSR, then switches to the store's value on client.
 */
export function useHydratedStore<T, F>(
  store: (callback: (state: T) => unknown) => unknown,
  callback: (state: T) => F,
  fallback: F
): F {
  const result = store(callback) as F;
  const isHydrated = useHydration();
  return isHydrated ? result : fallback;
}
