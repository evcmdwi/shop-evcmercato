// Client-side helpers for affiliate ref attribution

export function getRefFromUrl(searchParams: URLSearchParams): string | null {
  return searchParams.get('ref') || null;
}

export function appendRef(url: string, ref: string | null | undefined): string {
  if (!ref) return url;
  try {
    const u = new URL(url, 'https://evcmercato.com');
    u.searchParams.set('ref', ref);
    return u.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}ref=${encodeURIComponent(ref)}`;
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
