/**
 * Google OAuth 2.0 authentication via Google Identity Services (GIS).
 *
 * Uses the GIS token model (implicit grant) for a pure SPA — no backend needed.
 * The access token is held in memory only (never persisted to localStorage).
 *
 * Requires the GIS client script to be loaded:
 *   <script src="https://accounts.google.com/gsi/client" async defer></script>
 */

import { emit, Events } from '../store/event-bus';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.settings.basic https://www.googleapis.com/auth/gmail.labels.readonly';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken: (overrides?: { prompt?: string }) => void;
  callback: (response: TokenResponse) => void;
}

declare const google: {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        error_callback?: (error: { type: string; message: string }) => void;
      }) => TokenClient;
      revoke: (token: string, callback?: () => void) => void;
    };
  };
};

let clientId = '';
let tokenClient: TokenClient | null = null;
let accessToken: string | null = null;
let tokenExpiry = 0;
let userEmail: string | null = null;

export function configureAuth(id: string): void {
  clientId = id;
}

export function isConfigured(): boolean {
  return clientId.length > 0;
}

export function isSignedIn(): boolean {
  return accessToken !== null && Date.now() < tokenExpiry;
}

export function getAccessToken(): string | null {
  if (!isSignedIn()) return null;
  return accessToken;
}

export function getUserEmail(): string | null {
  return userEmail;
}

function ensureGisLoaded(): boolean {
  return typeof google !== 'undefined' && !!google.accounts?.oauth2;
}

export function signIn(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!clientId) {
      reject(new Error('OAuth Client ID not configured'));
      return;
    }

    if (!ensureGisLoaded()) {
      reject(new Error('Google Identity Services not loaded. Check your internet connection.'));
      return;
    }

    if (isSignedIn()) {
      resolve(accessToken!);
      return;
    }

    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GMAIL_SCOPE,
      callback: (response: TokenResponse) => {
        if (response.error) {
          reject(new Error(response.error_description ?? response.error));
          return;
        }
        accessToken = response.access_token;
        tokenExpiry = Date.now() + response.expires_in * 1000;
        fetchUserEmail(response.access_token);
        emitAuthChange();
        resolve(response.access_token);
      },
      error_callback: (error) => {
        reject(new Error(error.message ?? 'OAuth error'));
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export function signOut(): void {
  if (accessToken) {
    if (ensureGisLoaded()) {
      google.accounts.oauth2.revoke(accessToken);
    }
    accessToken = null;
    tokenExpiry = 0;
    userEmail = null;
    emitAuthChange();
  }
}

async function fetchUserEmail(token: string): Promise<void> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data: { email?: string } = await res.json();
      if (data.email) {
        userEmail = data.email;
        emitAuthChange();
      }
    }
  } catch {
    // Non-critical — email display is optional
  }
}

function emitAuthChange(): void {
  emit(Events.AUTH_CHANGED, {
    signedIn: isSignedIn(),
    email: userEmail,
  });
}
