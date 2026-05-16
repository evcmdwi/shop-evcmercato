// Client-side helpers for affiliate ref attribution

export function getRefFromUrl(searchParams: URLSearchParams): string | null {
  return searchParams.get('ref') || null;
}

export function appendRef(url: string, ref: string | null | undefined): string {
  if (!ref) return url;

  // Only append ref to internal EVC domains
  const internalDomains = ['shop.evcmercato.com', 'evcmercato.com'];
  try {
    const u = new URL(url);
    const isInternal = internalDomains.some(d => u.hostname === d || u.hostname.endsWith('.' + d));
    if (!isInternal) return url; // external URL: don't append ref
    u.searchParams.set('ref', ref);
    return u.toString();
  } catch {
    // Relative URL (starts with /) — treat as internal
    if (url.startsWith('/')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}ref=${encodeURIComponent(ref)}`;
    }
    return url; // Can't parse, don't modify
  }
}

export function getRefCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)evc_ref=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setRefCookie(ref: string): void {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 24 * 60 * 60; // 60 days
  document.cookie = `evc_ref=${encodeURIComponent(ref)}; max-age=${maxAge}; path=/; domain=.evcmercato.com; SameSite=Lax; Secure`;
}
