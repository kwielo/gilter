/**
 * Gmail REST API client for filters and labels.
 *
 * Thin wrapper over fetch() that uses the access token from google-auth.
 * All methods throw on HTTP errors with descriptive messages.
 */

import type {
  GmailFilter,
  GmailListFiltersResponse,
  GmailLabel,
  GmailListLabelsResponse,
} from '../domain/gmail-types';
import { getAccessToken } from './google-auth';

const BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated — please sign in first');

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    let detail = '';
    try {
      const parsed: { error?: { message?: string } } = JSON.parse(body);
      detail = parsed.error?.message ?? body;
    } catch {
      detail = body;
    }
    throw new Error(`Gmail API ${res.status}: ${detail}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Filters ──────────────────────────────────────────────────────────

export async function listFilters(): Promise<GmailFilter[]> {
  const data = await request<GmailListFiltersResponse>('/settings/filters');
  return data.filter ?? [];
}

export async function getFilter(id: string): Promise<GmailFilter> {
  return request<GmailFilter>(`/settings/filters/${encodeURIComponent(id)}`);
}

export async function createFilter(
  filter: Omit<GmailFilter, 'id'>,
): Promise<GmailFilter> {
  return request<GmailFilter>('/settings/filters', {
    method: 'POST',
    body: JSON.stringify(filter),
  });
}

export async function deleteFilter(id: string): Promise<void> {
  await request<void>(`/settings/filters/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

// ─── Labels ───────────────────────────────────────────────────────────

export async function listLabels(): Promise<GmailLabel[]> {
  const data = await request<GmailListLabelsResponse>('/labels');
  return data.labels ?? [];
}
