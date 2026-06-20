/**
 * Pure-function parser: Gmail filters XML string → domain objects.
 *
 * No side effects, no DOM mutation, no state. Uses browser-native DOMParser.
 */

import type { Filter, FilterCriteria, FilterActions, FeedMeta, ParseResult } from './types';
import { CRITERIA_KEYS, ACTION_KEYS, BOOLEAN_KEYS, META_KEYS } from './schema';

const ATOM_NS = 'http://www.w3.org/2005/Atom';
const APPS_NS = 'http://schemas.google.com/apps/2006';

export function parseFiltersXml(xmlString: string): ParseResult {
  const doc = new DOMParser().parseFromString(xmlString, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error(`Invalid XML: ${parseError.textContent?.slice(0, 200)}`);
  }

  const feed = doc.documentElement;
  const meta = extractFeedMeta(feed);
  const entries = feed.getElementsByTagNameNS(ATOM_NS, 'entry');
  const filters = Array.from(entries, parseEntry);

  return { meta, filters };
}

function extractFeedMeta(feed: Element): FeedMeta {
  const text = (sel: string): string =>
    feed.querySelector(sel)?.textContent ?? '';

  return {
    title:       text('title') || 'Mail Filters',
    authorName:  text('author > name'),
    authorEmail: text('author > email'),
  };
}

function parseEntry(entry: Element): Filter {
  const idEl = entry.getElementsByTagNameNS(ATOM_NS, 'id')[0];
  const id = idEl?.textContent || generateFilterId();

  const props = entry.getElementsByTagNameNS(APPS_NS, 'property');

  const criteria: FilterCriteria = {};
  const actions: FilterActions = {};

  for (const prop of props) {
    const name = prop.getAttribute('name');
    const value = prop.getAttribute('value');
    if (!name || value === null) continue;
    if (META_KEYS.has(name)) continue;

    if (CRITERIA_KEYS.has(name)) {
      const parsed = BOOLEAN_KEYS.has(name) ? value === 'true' : value;
      (criteria as Record<string, string | boolean>)[name] = parsed;
    } else if (ACTION_KEYS.has(name)) {
      const parsed = BOOLEAN_KEYS.has(name) ? value === 'true' : value;
      (actions as Record<string, string | boolean>)[name] = parsed;
    }
  }

  return { id, criteria, actions };
}

export function generateFilterId(): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1e16).toString().padStart(16, '0');
  return `tag:mail.google.com,2008:filter:z${ts}*${rand}`;
}
