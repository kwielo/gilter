/**
 * Gmail API response types for filters and labels.
 *
 * These mirror the REST API schemas from
 * https://developers.google.com/gmail/api/reference/rest/v1/users.settings.filters
 */

export interface GmailFilterCriteria {
  from?: string;
  to?: string;
  subject?: string;
  query?: string;
  negatedQuery?: string;
  hasAttachment?: boolean;
  excludeChats?: boolean;
  size?: number;
  sizeComparison?: 'unspecified' | 'smaller' | 'larger';
}

export interface GmailFilterAction {
  addLabelIds?: string[];
  removeLabelIds?: string[];
  forward?: string;
}

export interface GmailFilter {
  id: string;
  criteria: GmailFilterCriteria;
  action: GmailFilterAction;
}

export interface GmailListFiltersResponse {
  filter: GmailFilter[];
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
}

export interface GmailListLabelsResponse {
  labels: GmailLabel[];
}

/** Well-known Gmail system label IDs used in filter actions. */
export const SYSTEM_LABELS = {
  INBOX: 'INBOX',
  TRASH: 'TRASH',
  SPAM: 'SPAM',
  UNREAD: 'UNREAD',
  IMPORTANT: 'IMPORTANT',
  STARRED: 'STARRED',
  CATEGORY_PERSONAL: 'CATEGORY_PERSONAL',
  CATEGORY_SOCIAL: 'CATEGORY_SOCIAL',
  CATEGORY_PROMOTIONS: 'CATEGORY_PROMOTIONS',
  CATEGORY_UPDATES: 'CATEGORY_UPDATES',
  CATEGORY_FORUMS: 'CATEGORY_FORUMS',
} as const;

/** Maps smartlabel values from XML export to Gmail API category label IDs. */
export const SMART_LABEL_TO_CATEGORY: Record<string, string> = {
  '^smartlabel_personal': SYSTEM_LABELS.CATEGORY_PERSONAL,
  '^smartlabel_group': SYSTEM_LABELS.CATEGORY_SOCIAL,
  '^smartlabel_promo': SYSTEM_LABELS.CATEGORY_PROMOTIONS,
  '^smartlabel_notification': SYSTEM_LABELS.CATEGORY_UPDATES,
  '^smartlabel_social': SYSTEM_LABELS.CATEGORY_SOCIAL,
};

export const CATEGORY_TO_SMART_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SMART_LABEL_TO_CATEGORY).map(([k, v]) => [v, k]),
);
