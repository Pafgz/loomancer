import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "yarnlane-theme";

/** Browser chrome color per theme — matches `--bg` in index.css. */
const THEME_COLOR: Record<Theme, string> = {
  light: "#f1f3f7",
  dark: "#0d1017",
};

/**
 * Keep the browser/PWA chrome in step with the chosen theme. index.html ships
 * media-scoped tags for first paint; once a knitter picks a theme by hand there
 * must be exactly one tag left, or the OS preference keeps winning.
 */
function syncThemeColor(theme: Theme): void {
  const head = document.head;
  const existing = head.querySelectorAll<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  const meta = existing[0] ?? head.appendChild(document.createElement("meta"));
  meta.setAttribute("name", "theme-color");
  meta.removeAttribute("media");
  meta.setAttribute("content", THEME_COLOR[theme]);
  existing.forEach((tag, index) => {
    if (index > 0) {
      tag.remove();
    }
  });
}

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
    ? "dark"
    : "light";
}

/**
 * Manual light/dark control, persisted to localStorage and reflected on
 * <html data-theme>. Falls back to the OS preference when nothing is stored.
 */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(
    () => readStoredTheme() ?? systemTheme(),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    syncThemeColor(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage may be unavailable (private mode); theme still applies in-memory.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}
