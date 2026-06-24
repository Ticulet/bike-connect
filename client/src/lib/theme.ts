/**
 * Colour-theme helpers — the single source of truth for how the active theme is
 * resolved, applied to the document, and persisted.
 *
 * The pre-paint script in index.html duplicates resolveInitialTheme()'s logic
 * (it must run before this module loads, to avoid a flash of the wrong theme);
 * keep the two in sync, especially THEME_STORAGE_KEY.
 */

export type Theme = 'light' | 'dark';

/** localStorage key holding the user's explicit theme choice. */
export const THEME_STORAGE_KEY = 'bike-connect:theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * The OS / browser colour preference. Falls back to 'light' when matchMedia is
 * unavailable (older runtimes, non-browser environments).
 */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

/** The user's explicitly-stored choice, or null if they have never chosen one. */
export function getStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * The theme to start from: whatever the pre-paint script already put on
 * <html data-theme> (so React state matches the screen), else the stored
 * choice, else the system preference.
 */
export function resolveInitialTheme(): Theme {
  if (typeof document !== 'undefined') {
    const current = document.documentElement.dataset.theme;
    if (isTheme(current)) {
      return current;
    }
  }
  return getStoredTheme() ?? getSystemTheme();
}

/**
 * Apply a theme to the document: set <html data-theme> and keep the mobile
 * browser chrome (theme-color meta) in step.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta instanceof HTMLMetaElement) {
    meta.content = theme === 'dark' ? '#14120d' : '#2f5233';
  }
}

/** The theme a toggle switches to from the current one. */
export function nextTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}

/** Persist the user's explicit choice. Storage failures are non-fatal. */
export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage unavailable (private mode / quota exceeded) — ignore */
  }
}
