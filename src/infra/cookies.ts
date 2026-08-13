/**
 * Cookie helpers for persisting small UI preferences.
 */

export function getCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 365): void {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}` +
    `; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}
