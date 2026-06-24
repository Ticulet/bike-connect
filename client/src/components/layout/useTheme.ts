import { useCallback, useEffect, useState } from 'react';
import {
  applyTheme,
  getStoredTheme,
  nextTheme,
  resolveInitialTheme,
  storeTheme,
  type Theme,
} from '../../lib/theme.js';

interface UseThemeResult {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * Manages the active colour theme.
 *
 * Initialises from <html data-theme> (set by the pre-paint script in index.html)
 * so React state matches what is already on screen, then keeps the document and
 * storage in sync. Until the user makes an explicit choice it also follows the
 * OS preference live; once they toggle, their choice is persisted and wins.
 */
export function useTheme(): UseThemeResult {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  // Reflect the active theme onto the document whenever it changes.
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Follow the OS preference until the user picks a theme themselves.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent): void => {
      if (getStoredTheme() === null) {
        setTheme(event.matches ? 'dark' : 'light');
      }
    };
    query.addEventListener('change', handleChange);
    return () => {
      query.removeEventListener('change', handleChange);
    };
  }, []);

  const toggleTheme = useCallback((): void => {
    setTheme((current) => {
      const next = nextTheme(current);
      storeTheme(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
