/**
 * Selection state for bulk operations.
 *
 * Tracks which filter IDs are currently selected via checkboxes.
 */

import { emit, Events } from './event-bus';

const selected = new Set<string>();

export function getSelected(): Set<string> { return new Set(selected); }

export function isSelected(id: string): boolean { return selected.has(id); }

export function getSelectedCount(): number { return selected.size; }

export function toggle(id: string): void {
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  notify();
}

export function selectAll(ids: string[]): void {
  for (const id of ids) selected.add(id);
  notify();
}

export function deselectAll(): void {
  selected.clear();
  notify();
}

function notify(): void {
  emit(Events.SELECTION_CHANGED, { selected: getSelected(), count: selected.size });
}
