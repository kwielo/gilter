import { beforeEach, describe, expect, it } from 'vitest';
import {
  deselectAll,
  getSelected,
  getSelectedCount,
  isSelected,
  selectAll,
  toggle,
} from '../selection';
import { Events, on } from '../event-bus';
import { resetStoreState } from './reset';

describe('selection', () => {
  beforeEach(() => {
    resetStoreState();
  });

  it('toggles ids in and out of the selection', () => {
    toggle('a');
    expect(isSelected('a')).toBe(true);
    toggle('a');
    expect(isSelected('a')).toBe(false);
  });

  it('selects all provided ids and can clear the set', () => {
    selectAll(['a', 'b', 'a']);
    expect(getSelectedCount()).toBe(2);
    expect([...getSelected()].sort()).toEqual(['a', 'b']);
    deselectAll();
    expect(getSelectedCount()).toBe(0);
  });

  it('returns a copy of the selected set', () => {
    toggle('a');
    getSelected().add('b');
    expect(isSelected('b')).toBe(false);
  });

  it('emits SELECTION_CHANGED with a snapshot', () => {
    const events: { count: number }[] = [];
    const off = on<{ selected: Set<string>; count: number }>(
      Events.SELECTION_CHANGED,
      (data) => events.push({ count: data.count }),
    );
    toggle('a');
    expect(events).toEqual([{ count: 1 }]);
    off();
  });
});
