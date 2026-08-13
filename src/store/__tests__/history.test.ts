import { beforeEach, describe, expect, it } from 'vitest';
import { addFilter, getCount, getFilters, load, updateFilter } from '../filter-store';
import { canRedo, canUndo, clearHistory, redo, undo } from '../history';
import { emptyMeta, makeFilter } from '../../domain/__tests__/fixtures';
import { resetStoreState } from './reset';

describe('history', () => {
  beforeEach(() => {
    resetStoreState();
  });

  it('undoes and redoes a mutation', () => {
    load(emptyMeta, [makeFilter({ id: 'a', criteria: { from: 'old' } })]);
    clearHistory();
    updateFilter('a', { from: 'new' }, {});

    expect(canUndo()).toBe(true);
    expect(canRedo()).toBe(false);
    expect(undo()).toBe(true);
    expect(getFilters()[0].criteria.from).toBe('old');
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(true);

    expect(redo()).toBe(true);
    expect(getFilters()[0].criteria.from).toBe('new');
    expect(canRedo()).toBe(false);
  });

  it('returns false when undo or redo stacks are empty', () => {
    expect(undo()).toBe(false);
    expect(redo()).toBe(false);
  });

  it('clears redo when a new mutation happens after undo', () => {
    addFilter();
    addFilter();
    undo();
    expect(canRedo()).toBe(true);
    addFilter();
    expect(canRedo()).toBe(false);
    expect(getCount()).toBe(2);
  });

  it('caps the undo stack at 50 snapshots', () => {
    for (let i = 0; i < 51; i++) addFilter();
    let undos = 0;
    while (undo()) undos += 1;
    expect(undos).toBe(50);
    expect(getCount()).toBe(1);
  });
});
