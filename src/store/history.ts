/**
 * Undo/redo history for filter state.
 *
 * Maintains a stack of snapshots. Each mutation pushes the previous state
 * onto the undo stack and clears the redo stack. Undo pops from the undo
 * stack and pushes current state to redo, then restores.
 */

import type { Filter, FeedMeta } from '../domain/types';
import * as store from './filter-store';
import { emit, Events } from './event-bus';

interface Snapshot {
  meta: FeedMeta;
  filters: Filter[];
}

const undoStack: Snapshot[] = [];
const redoStack: Snapshot[] = [];
const MAX_HISTORY = 50;

let capturing = true;

function snapshot(): Snapshot {
  return { meta: store.getMeta(), filters: store.getFilters() };
}

export function pushState(): void {
  if (!capturing) return;
  undoStack.push(snapshot());
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack.length = 0;
  emitChange();
}

export function undo(): boolean {
  if (undoStack.length === 0) return false;
  redoStack.push(snapshot());
  const prev = undoStack.pop()!;
  capturing = false;
  store.load(prev.meta, prev.filters);
  capturing = true;
  emitChange();
  return true;
}

export function redo(): boolean {
  if (redoStack.length === 0) return false;
  undoStack.push(snapshot());
  const next = redoStack.pop()!;
  capturing = false;
  store.load(next.meta, next.filters);
  capturing = true;
  emitChange();
  return true;
}

export function canUndo(): boolean { return undoStack.length > 0; }
export function canRedo(): boolean { return redoStack.length > 0; }

export function clearHistory(): void {
  undoStack.length = 0;
  redoStack.length = 0;
  emitChange();
}

function emitChange(): void {
  emit(Events.HISTORY_CHANGED, { canUndo: canUndo(), canRedo: canRedo() });
}
