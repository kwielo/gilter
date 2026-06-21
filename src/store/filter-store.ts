/**
 * Central filter store — the single source of truth for filter state.
 *
 * Follows the observable-store pattern:
 *   - State is held privately and exposed via getters (read-only snapshots).
 *   - Mutations happen through explicit action methods.
 *   - Every mutation emits FILTERS_CHANGED so the UI can re-render.
 */

import type { Filter, FilterCriteria, FilterActions, FeedMeta } from '../domain/types';
import { generateFilterId } from '../domain/parser';
import { emit, Events } from './event-bus';

let meta: FeedMeta = { title: 'Mail Filters', authorName: '', authorEmail: '' };
let filters: Filter[] = [];
let selectedId: string | null = null;

// ─── Getters ──────────────────────────────────────────────────────────

export function getMeta(): FeedMeta { return { ...meta }; }

export function getFilters(): Filter[] { return [...filters]; }

export function getCount(): number { return filters.length; }

export function getSelectedId(): string | null { return selectedId; }

export function getFilterById(id: string): Filter | undefined {
  return filters.find(f => f.id === id);
}

// ─── Actions ──────────────────────────────────────────────────────────

export function load(newMeta: FeedMeta, newFilters: Filter[]): void {
  meta = { ...meta, ...newMeta };
  filters = newFilters.map(deepClone);
  selectedId = null;
  notify();
}

export function addFilter(): Filter {
  const filter: Filter = { id: generateFilterId(), criteria: {}, actions: {} };
  filters = [...filters, filter];
  selectedId = filter.id;
  notify();
  return filter;
}

export function updateFilter(id: string, criteria: FilterCriteria, actions: FilterActions): void {
  const idx = filters.findIndex(f => f.id === id);
  if (idx === -1) return;
  filters = filters.map((f, i) =>
    i === idx ? { ...f, criteria: { ...criteria }, actions: { ...actions } } : f,
  );
  notify();
}

export function removeFilter(id: string): void {
  filters = filters.filter(f => f.id !== id);
  if (selectedId === id) selectedId = null;
  notify();
}

export function duplicateFilter(id: string): Filter | undefined {
  const src = filters.find(f => f.id === id);
  if (!src) return undefined;
  const dup = deepClone(src);
  dup.id = generateFilterId();
  const idx = filters.indexOf(src);
  filters = [...filters.slice(0, idx + 1), dup, ...filters.slice(idx + 1)];
  selectedId = dup.id;
  notify();
  return dup;
}

export function selectFilter(id: string | null): void {
  const prev = selectedId;
  selectedId = id;
  if (prev !== id) {
    if (id) emit(Events.FILTER_SELECTED, id);
    else emit(Events.FILTER_DESELECTED);
  }
}

// ─── Internals ────────────────────────────────────────────────────────

function notify(): void {
  emit(Events.FILTERS_CHANGED, { meta: getMeta(), filters: getFilters() });
}

function deepClone(f: Filter): Filter {
  return { id: f.id, criteria: { ...f.criteria }, actions: { ...f.actions } };
}
