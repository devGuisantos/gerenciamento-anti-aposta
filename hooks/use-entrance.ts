'use client';

import { useEffect, useState } from 'react';

/**
 * `false` for the first paint, then `true` — so a CSS transition has somewhere to
 * animate *from*. Bars read their width off this: collapsed, then grown.
 *
 * Reduced motion is handled by `motion-safe:` on the transition itself rather
 * than here, so the final state is identical either way and only the travel
 * between them disappears.
 *
 * Do not replace this with `useState(!animate)` fed by a prop: the initialiser
 * runs once, so a prop that flips after hydration leaves the state already
 * settled and the animation silently never plays.
 */
export function useEntrance(): boolean {
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return hasEntered;
}
