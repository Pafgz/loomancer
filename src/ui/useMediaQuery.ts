import { useEffect, useState } from "react";

/**
 * Track a CSS media query from React so semantics can follow the layout.
 * The Studio shows three panes side by side on wide screens and one pane
 * behind a tab bar on narrow ones; only the narrow layout is really a tab set,
 * so the ARIA roles have to change with the breakpoint rather than guess.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => matchQuery(query));

  useEffect(() => {
    const list = window.matchMedia?.(query);
    if (!list) {
      return;
    }
    setMatches(list.matches);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

function matchQuery(query: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia?.(query)?.matches ?? false;
}
