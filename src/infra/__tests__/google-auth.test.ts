import { describe, expect, it } from 'vitest';
import {
  configureAuth,
  getAccessToken,
  getUserEmail,
  isConfigured,
  isSignedIn,
  signIn,
  signOut,
} from '../google-auth';

describe('google-auth', () => {
  it('treats an empty client id as unconfigured and signed out', () => {
    configureAuth('');
    expect(isConfigured()).toBe(false);
    expect(isSignedIn()).toBe(false);
    expect(getAccessToken()).toBeNull();
    expect(getUserEmail()).toBeNull();
  });

  it('records the client id from configureAuth', () => {
    configureAuth('client-123');
    expect(isConfigured()).toBe(true);
  });

  it('rejects sign-in when GIS is not loaded', async () => {
    configureAuth('client-123');
    await expect(signIn()).rejects.toThrow(/Google Identity Services not loaded/);
  });

  it('rejects sign-in when no client id is configured', async () => {
    configureAuth('');
    await expect(signIn()).rejects.toThrow(/OAuth Client ID not configured/);
  });

  it('sign-out is a no-op when already signed out', () => {
    expect(() => signOut()).not.toThrow();
  });
});
