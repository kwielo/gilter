import { beforeEach, describe, expect, it } from 'vitest';
import {
  addFilter,
  duplicateFilter,
  getCount,
  getFilterById,
  getFilters,
  getMeta,
  getSelectedId,
  load,
  moveFilter,
  removeFilter,
  removeMany,
  selectFilter,
  updateFilter,
} from '../filter-store';
import { canUndo } from '../history';
import { on, Events } from '../event-bus';
import { emptyMeta, makeFilter } from '../../domain/__tests__/fixtures';
import { resetStoreState } from './reset';

describe('filter-store', () => {
  beforeEach(() => {
    resetStoreState();
  });

  it('loads filters and meta, clearing selection', () => {
    selectFilter('old');
    load(emptyMeta, [
      makeFilter({ id: 'a', criteria: { from: 'a@b.com' } }),
    ]);

    expect(getMeta()).toEqual(emptyMeta);
    expect(getCount()).toBe(1);
    expect(getFilters()[0].criteria.from).toBe('a@b.com');
    expect(getSelectedId()).toBeNull();
  });

  it('returns copies from getters so callers cannot mutate store arrays', () => {
    load(emptyMeta, [makeFilter({ id: 'a' })]);
    const copy = getFilters();
    copy.pop();
    expect(getCount()).toBe(1);

    const meta = getMeta();
    meta.title = 'mutated';
    expect(getMeta().title).toBe('Mail Filters');
  });

  it('adds a filter, selects it, and records undo history', () => {
    const created = addFilter();
    expect(getCount()).toBe(1);
    expect(getSelectedId()).toBe(created.id);
    expect(created.criteria).toEqual({});
    expect(created.actions).toEqual({});
    expect(canUndo()).toBe(true);
  });

  it('updates a filter by id and ignores unknown ids', () => {
    load(emptyMeta, [makeFilter({ id: 'a' })]);
    updateFilter('a', { from: 'x@y.com' }, { shouldArchive: true });
    expect(getFilterById('a')).toEqual({
      id: 'a',
      criteria: { from: 'x@y.com' },
      actions: { shouldArchive: true },
    });

    updateFilter('missing', { from: 'nope' }, {});
    expect(getFilterById('a')?.criteria.from).toBe('x@y.com');
    expect(canUndo()).toBe(true);
  });

  it('removes a filter and clears selection when it was selected', () => {
    load(emptyMeta, [makeFilter({ id: 'a' }), makeFilter({ id: 'b' })]);
    selectFilter('a');
    removeFilter('a');
    expect(getFilters().map(f => f.id)).toEqual(['b']);
    expect(getSelectedId()).toBeNull();
  });

  it('duplicates a filter after the source with a new id and copied labels', () => {
    load(emptyMeta, [
      makeFilter({ id: 'a', actions: { label: ['Work'] } }),
      makeFilter({ id: 'b' }),
    ]);
    const dup = duplicateFilter('a');
    expect(dup).toBeDefined();
    expect(dup!.id).not.toBe('a');
    expect(getFilters().map(f => f.id)).toEqual(['a', dup!.id, 'b']);
    expect(getSelectedId()).toBe(dup!.id);

    dup!.actions.label!.push('Home');
    expect(getFilterById('a')!.actions.label).toEqual(['Work']);
    expect(duplicateFilter('missing')).toBeUndefined();
  });

  it('emits FILTER_SELECTED only when the selected id changes', () => {
    const selected: string[] = [];
    const deselected = { count: 0 };
    const offSel = on<string>(Events.FILTER_SELECTED, (id) => selected.push(id));
    const offDesel = on(Events.FILTER_DESELECTED, () => { deselected.count += 1; });

    selectFilter('a');
    selectFilter('a');
    selectFilter(null);
    selectFilter(null);

    expect(selected).toEqual(['a']);
    expect(deselected.count).toBe(1);
    offSel();
    offDesel();
  });

  it('removes many filters and reports how many were deleted', () => {
    load(emptyMeta, [
      makeFilter({ id: 'a' }),
      makeFilter({ id: 'b' }),
      makeFilter({ id: 'c' }),
    ]);
    selectFilter('b');
    expect(removeMany(new Set(['a', 'b', 'missing']))).toBe(2);
    expect(getFilters().map(f => f.id)).toEqual(['c']);
    expect(getSelectedId()).toBeNull();
    expect(removeMany(new Set())).toBe(0);
  });

  it('moves a filter between indexes and ignores invalid moves', () => {
    load(emptyMeta, [
      makeFilter({ id: 'a' }),
      makeFilter({ id: 'b' }),
      makeFilter({ id: 'c' }),
    ]);
    moveFilter(0, 2);
    expect(getFilters().map(f => f.id)).toEqual(['b', 'c', 'a']);
    moveFilter(1, 1);
    moveFilter(-1, 0);
    moveFilter(0, 99);
    expect(getFilters().map(f => f.id)).toEqual(['b', 'c', 'a']);
  });

  it('emits FILTERS_CHANGED after mutations', () => {
    const payloads: unknown[] = [];
    const off = on(Events.FILTERS_CHANGED, (data) => payloads.push(data));
    addFilter();
    expect(payloads).toHaveLength(1);
    off();
  });
});
