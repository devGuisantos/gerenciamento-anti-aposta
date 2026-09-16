'use client';

import { useSyncExternalStore } from 'react';

const NEVER_CHANGES = () => () => {};

/**
 * `false` while rendering on the server and through hydration, `true` afterwards.
 *
 * Charts use it to hold a placeholder until they can mount fresh in the browser:
 * an entrance animation attached to a hydration often never plays, and the chart
 * library needs a real box to measure before it can lay anything out.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
}
