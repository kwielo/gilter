import { afterEach, describe, expect, it } from 'vitest';
import { getCookie, setCookie } from '../cookies';

describe('cookies', () => {
  afterEach(() => {
    document.cookie.split(';').forEach((part) => {
      const name = part.split('=')[0]?.trim();
      if (name) document.cookie = `${name}=; max-age=0; path=/`;
    });
  });

  it('round-trips a cookie value', () => {
    setCookie('theme', 'dark');
    expect(getCookie('theme')).toBe('dark');
  });

  it('returns null for a missing cookie', () => {
    expect(getCookie('missing')).toBeNull();
  });

  it('encodes special characters in the name and value', () => {
    setCookie('pref name', 'a=b c');
    expect(getCookie('pref name')).toBe('a=b c');
  });
});
