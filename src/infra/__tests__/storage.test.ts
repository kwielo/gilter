import { beforeEach, describe, expect, it } from 'vitest';
import { clearStorage, enableAutoSave, restoreFromStorage } from '../storage';
import { emit, Events } from '../../store/event-bus';
import { emptyMeta, makeFilter } from '../../domain/__tests__/fixtures';

const STORAGE_KEY = 'gilter_data';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored or JSON is invalid', () => {
    expect(restoreFromStorage()).toBeNull();
    localStorage.setItem(STORAGE_KEY, '{not json');
    expect(restoreFromStorage()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ meta: emptyMeta }));
    expect(restoreFromStorage()).toBeNull();
  });

  it('restores a snapshot and migrates a string label to an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      meta: emptyMeta,
      filters: [
        { id: 'a', criteria: {}, actions: { label: 'Work' } },
        { id: 'b', criteria: {}, actions: { label: ['Inbox'] } },
      ],
      savedAt: 1,
    }));

    const restored = restoreFromStorage();
    expect(restored?.filters[0].actions.label).toEqual(['Work']);
    expect(restored?.filters[1].actions.label).toEqual(['Inbox']);
  });

  it('persists FILTERS_CHANGED payloads and can clear them', () => {
    const off = enableAutoSave();
    const filters = [makeFilter({ id: 'a', criteria: { from: 'a@b.com' } })];
    emit(Events.FILTERS_CHANGED, { meta: emptyMeta, filters });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.meta).toEqual(emptyMeta);
    expect(stored.filters).toEqual(filters);
    expect(typeof stored.savedAt).toBe('number');

    clearStorage();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    off();
  });
});
