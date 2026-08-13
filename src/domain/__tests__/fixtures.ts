import type { FeedMeta, Filter } from '../types';
import type { GmailLabel } from '../gmail-types';

export const emptyMeta: FeedMeta = {
  title: 'Mail Filters',
  authorName: '',
  authorEmail: '',
};

export const sampleMeta: FeedMeta = {
  title: 'Mail Filters',
  authorName: 'Ada Lovelace',
  authorEmail: 'ada@example.com',
};

export function makeFilter(overrides: Partial<Filter> = {}): Filter {
  return {
    id: 'tag:mail.google.com,2008:filter:z1',
    criteria: {},
    actions: {},
    ...overrides,
  };
}

export const userLabels: GmailLabel[] = [
  { id: 'Label_1', name: 'Work', type: 'user' },
  { id: 'Label_2', name: 'Receipts', type: 'user' },
  { id: 'INBOX', name: 'INBOX', type: 'system' },
  { id: 'TRASH', name: 'TRASH', type: 'system' },
];
