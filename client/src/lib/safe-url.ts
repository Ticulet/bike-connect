/**
 * Validates that a URL is safe to render as an image or link src/href.
 * Only allows http(s) schemes; rejects javascript:, data:, file:, etc.
 */
export function isSafeImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
