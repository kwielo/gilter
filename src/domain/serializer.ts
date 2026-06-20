/**
 * Pure-function serializer: domain objects → Gmail-compatible XML string.
 *
 * Output is valid for re-import via Gmail Settings → Filters → Import filters.
 */

import type { FeedMeta, Filter } from './types';
import { BOOLEAN_KEYS } from './schema';

export function serializeFiltersXml(meta: FeedMeta, filters: Filter[]): string {
  const lines: string[] = [
    `<?xml version='1.0' encoding='UTF-8'?>`,
    `<feed xmlns='http://www.w3.org/2005/Atom' xmlns:apps='http://schemas.google.com/apps/2006'>`,
    `\t<title>${esc(meta.title || 'Mail Filters')}</title>`,
    buildFeedId(filters),
    `\t<updated>${isoNow()}</updated>`,
  ];

  if (meta.authorName || meta.authorEmail) {
    lines.push(`\t<author>`);
    if (meta.authorName)  lines.push(`\t\t<name>${esc(meta.authorName)}</name>`);
    if (meta.authorEmail) lines.push(`\t\t<email>${esc(meta.authorEmail)}</email>`);
    lines.push(`\t</author>`);
  }

  for (const filter of filters) {
    lines.push(...serializeEntry(filter));
  }

  lines.push(`</feed>`);
  return lines.join('\n');
}

function serializeEntry(filter: Filter): string[] {
  const now = isoNow();
  const lines: string[] = [
    `\t<entry>`,
    `\t\t<category term='filter'></category>`,
    `\t\t<title>Mail Filter</title>`,
    `\t\t<id>${esc(filter.id)}</id>`,
    `\t\t<updated>${now}</updated>`,
    `\t\t<content></content>`,
  ];

  const emitProp = (key: string, val: string | boolean | undefined) => {
    if (val === null || val === undefined || val === '' || val === false) return;
    const strVal = BOOLEAN_KEYS.has(key) ? 'true' : String(val);
    lines.push(`\t\t<apps:property name='${esc(key)}' value='${esc(strVal)}'/>`);
  };

  for (const [k, v] of Object.entries(filter.criteria)) emitProp(k, v);
  for (const [k, v] of Object.entries(filter.actions))  emitProp(k, v);

  lines.push(`\t\t<apps:property name='sizeOperator' value='s_sl'/>`);
  lines.push(`\t\t<apps:property name='sizeUnit' value='s_smb'/>`);
  lines.push(`\t</entry>`);
  return lines;
}

function buildFeedId(filters: Filter[]): string {
  const ids = filters
    .map(f => f.id.replace('tag:mail.google.com,2008:filter:', ''))
    .join(',');
  return `\t<id>tag:mail.google.com,2008:filters:${ids}</id>`;
}

function isoNow(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
}
