/**
 * Validates that a URL is safe to render as an image or link src/href.
 * Only allows http(s) schemes; rejects javascript:, data:, file:, etc.
 */
export function isSafeImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  // Root-relative, same-origin paths (e.g. /bike-photos/x.jpg) are safe.
  // Exclude protocol-relative URLs (//host) which can point cross-origin.
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
