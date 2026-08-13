import { beforeEach, describe, expect, it } from 'vitest';
import { getLabels, hasLabels, setLabels } from '../label-cache';
import { Events, on } from '../event-bus';
import { resetStoreState } from './reset';

describe('label-cache', () => {
  beforeEach(() => {
    resetStoreState();
  });

  it('stores a sorted copy of label names', () => {
    setLabels(['Work', 'Archive', 'Receipts']);
    expect(getLabels()).toEqual(['Archive', 'Receipts', 'Work']);
    expect(hasLabels()).toBe(true);
  });

  it('copies incoming names so the caller cannot mutate the cache via the input', () => {
    const names = ['Work'];
    setLabels(names);
    names.push('Nope');
    expect(getLabels()).toEqual(['Work']);
  });

  it('treats an empty list as having no labels', () => {
    setLabels(['Work']);
    setLabels([]);
    expect(hasLabels()).toBe(false);
  });

  it('emits LABELS_CHANGED when labels are replaced', () => {
    const received: string[][] = [];
    const off = on<string[]>(Events.LABELS_CHANGED, (names) => received.push(names));
    setLabels(['B', 'A']);
    expect(received).toEqual([['A', 'B']]);
    off();
  });
});
