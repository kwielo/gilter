/**
 * In-memory cache for Gmail label names.
 *
 * Populated when filters are pulled from the Gmail API.
 * Used by the filter editor to provide autocomplete suggestions.
 */

import { emit, Events } from './event-bus';

let labels: string[] = [];

export function getLabels(): string[] {
  return labels;
}

export function setLabels(names: string[]): void {
  labels = [...names].sort((a, b) => a.localeCompare(b));
  emit(Events.LABELS_CHANGED, labels);
}

export function hasLabels(): boolean {
  return labels.length > 0;
}
