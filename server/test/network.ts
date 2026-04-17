/**
 * Global network interceptor. Rejects any outbound HTTP request whose host is
 * not on the allow-list, forcing tests to mock externals explicitly instead of
 * silently hitting the real network.
 */

import { getContainerHost } from './db.js';

const STATIC_ALLOW = new Set(['127.0.0.1', 'localhost', '::1']);

class NetworkBlockedError extends Error {
  constructor(method: string, url: string) {
    super(
      `Tests may not touch the network. Attempted: ${method} ${url}. ` +
        `Mock this (with msw, nock, or a test double) — or use a local testcontainer. ` +
        `If network access is genuinely required, opt out per-file and document why.`,
    );
    this.name = 'NetworkBlockedError';
  }
}

function hostnameOf(input: string | URL | Request): string {
  try {
    if (typeof input === 'string') return new URL(input).hostname;
    if (input instanceof URL) return input.hostname;
    if (input instanceof Request) return new URL(input.url).hostname;
    return '';
  } catch {
    return '';
  }
}

function isAllowed(host: string): boolean {
  if (STATIC_ALLOW.has(host)) return true;
  const containerHost = getContainerHost();
  return containerHost !== undefined && host === containerHost;
}

const originalFetch: typeof globalThis.fetch = globalThis.fetch;
let installed = false;

export function installNetworkGuard(): void {
  if (installed) return;
  installed = true;

  const guardedFetch: typeof globalThis.fetch = (input, init) => {
    const host = hostnameOf(input as string | URL | Request);
    if (!isAllowed(host)) {
      const method = (init?.method ?? 'GET').toUpperCase();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      return Promise.reject(new NetworkBlockedError(method, url));
    }
    return originalFetch(input, init);
  };

  globalThis.fetch = guardedFetch;
}

export function uninstallNetworkGuard(): void {
  if (!installed) return;
  globalThis.fetch = originalFetch;
  installed = false;
}
