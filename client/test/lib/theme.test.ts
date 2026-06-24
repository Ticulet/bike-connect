import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  THEME_STORAGE_KEY,
  applyTheme,
  getStoredTheme,
  getSystemTheme,
  nextTheme,
  resolveInitialTheme,
  storeTheme,
} from '../../src/lib/theme.js';

/**
 * jsdom in this environment does not expose working Storage methods, so install
 * a Map-backed localStorage for each test.
 */
function createStorageMock(): Storage {
  let store = new Map<string, string>();
  return {
    get length(): number {
      return store.size;
    },
    clear(): void {
      store = new Map();
    },
    getItem(key: string): string | null {
      return store.has(key) ? (store.get(key) ?? null) : null;
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, String(value));
    },
  };
}

/** Install a window.matchMedia stub reporting the given dark-mode preference. */
function stubMatchMedia(prefersDark: boolean): void {
  const impl = (query: string): MediaQueryList =>
    ({
      matches: prefersDark,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }) as unknown as MediaQueryList;
  window.matchMedia = impl;
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorageMock());
  document.documentElement.removeAttribute('data-theme');
  document.head.querySelector('meta[name="theme-color"]')?.remove();
  stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('THEME_STORAGE_KEY', () => {
  it('matches the key used by the pre-paint script in index.html', () => {
    expect(THEME_STORAGE_KEY).toBe('bike-connect:theme');
  });
});

describe('getSystemTheme', () => {
  it('returns "dark" when the OS prefers dark', () => {
    stubMatchMedia(true);
    expect(getSystemTheme()).toBe('dark');
  });

  it('returns "light" when the OS prefers light', () => {
    stubMatchMedia(false);
    expect(getSystemTheme()).toBe('light');
  });

  it('falls back to "light" when matchMedia is unavailable', () => {
    Reflect.deleteProperty(window, 'matchMedia');
    expect(getSystemTheme()).toBe('light');
  });
});

describe('getStoredTheme', () => {
  it('returns null when nothing is stored', () => {
    expect(getStoredTheme()).toBeNull();
  });

  it('returns the stored theme when valid', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(getStoredTheme()).toBe('dark');
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(getStoredTheme()).toBe('light');
  });

  it('returns null for an unrecognised stored value', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    expect(getStoredTheme()).toBeNull();
  });

  it('returns null when storage access throws', () => {
    vi.stubGlobal('localStorage', {
      ...createStorageMock(),
      getItem: () => {
        throw new Error('storage blocked');
      },
    });
    expect(getStoredTheme()).toBeNull();
  });
});

describe('resolveInitialTheme', () => {
  it('prefers the theme already on <html> (set by the pre-paint script)', () => {
    document.documentElement.dataset.theme = 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    stubMatchMedia(false);
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('ignores an invalid data-theme and falls through to the stored choice', () => {
    document.documentElement.dataset.theme = 'sepia';
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('uses the stored choice when no data-theme is present', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    stubMatchMedia(true);
    expect(resolveInitialTheme()).toBe('light');
  });

  it('falls back to the system preference when nothing is stored', () => {
    stubMatchMedia(true);
    expect(resolveInitialTheme()).toBe('dark');
    stubMatchMedia(false);
    expect(resolveInitialTheme()).toBe('light');
  });
});

describe('applyTheme', () => {
  it('sets the data-theme attribute on <html>', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('updates the theme-color meta tag to match the theme', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);

    applyTheme('dark');
    expect(meta.content).toBe('#14120d');
    applyTheme('light');
    expect(meta.content).toBe('#2f5233');
  });

  it('does not throw when no theme-color meta tag exists', () => {
    expect(() => {
      applyTheme('dark');
    }).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('storeTheme', () => {
  it('persists the choice under the storage key', () => {
    storeTheme('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('swallows storage errors (e.g. private mode / quota)', () => {
    vi.stubGlobal('localStorage', {
      ...createStorageMock(),
      setItem: () => {
        throw new Error('quota exceeded');
      },
    });
    expect(() => {
      storeTheme('dark');
    }).not.toThrow();
  });
});

describe('nextTheme', () => {
  it('flips between light and dark', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });
});
