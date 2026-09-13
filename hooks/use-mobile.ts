import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Vendored from shadcn/ui, rewritten on top of `useSyncExternalStore`: the
 * original set state inside an effect, which React 19's lint rules reject.
 * Behaviour is identical, including the desktop-first server snapshot that
 * keeps hydration stable.
 */
function subscribe(onStoreChange: () => void) {
  const query = window.matchMedia(MEDIA_QUERY)
  query.addEventListener("change", onStoreChange)
  return () => query.removeEventListener("change", onStoreChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MEDIA_QUERY).matches,
    () => false,
  )
}
