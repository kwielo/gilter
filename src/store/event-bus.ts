/**
 * Lightweight typed pub/sub event bus.
 *
 * Decouples producers (store, file-io) from consumers (UI components)
 * without requiring direct references between them.
 */

type Listener<T = unknown> = (data: T) => void;

const channels = new Map<string, Set<Listener>>();

export function on<T = unknown>(event: string, listener: Listener<T>): () => void {
  if (!channels.has(event)) channels.set(event, new Set());
  const set = channels.get(event)!;
  set.add(listener as Listener);
  return () => set.delete(listener as Listener);
}

export function emit<T = unknown>(event: string, data?: T): void {
  const listeners = channels.get(event);
  if (!listeners) return;
  for (const fn of listeners) {
    try { fn(data); }
    catch (err) { console.error(`[EventBus] Error in "${event}" listener:`, err); }
  }
}

export const Events = Object.freeze({
  FILTERS_CHANGED:   'filters:changed',
  FILTER_SELECTED:   'filter:selected',
  FILTER_DESELECTED: 'filter:deselected',
  IMPORT_SUCCESS:    'import:success',
  IMPORT_ERROR:      'import:error',
  TOAST:             'toast',
  HISTORY_CHANGED:   'history:changed',
  SELECTION_CHANGED: 'selection:changed',
  AUTH_CHANGED:      'auth:changed',
  LABELS_CHANGED:    'labels:changed',
});
