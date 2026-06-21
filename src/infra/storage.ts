/**
 * localStorage adapter for persisting filter state.
 *
 * Subscribes to the store's FILTERS_CHANGED event and auto-saves.
 * On app boot the saved snapshot can be restored via `restoreFromStorage`.
 */

import type { FeedMeta, Filter } from '../domain/types';
import { on, Events } from '../store/event-bus';

const STORAGE_KEY = 'gilter_data';

interface StoredData {
  meta: FeedMeta;
  filters: Filter[];
  savedAt: number;
}

export function restoreFromStorage(): { meta: FeedMeta; filters: Filter[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredData = JSON.parse(raw);
    if (!parsed?.filters || !Array.isArray(parsed.filters)) return null;
    return { meta: parsed.meta, filters: parsed.filters };
  } catch {
    return null;
  }
}

export function enableAutoSave(): () => void {
  return on<{ meta: FeedMeta; filters: Filter[] }>(Events.FILTERS_CHANGED, (data) => {
    try {
      const stored: StoredData = {
        meta: data.meta,
        filters: data.filters,
        savedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (err) {
      console.warn('[Storage] Failed to persist:', err);
    }
  });
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
