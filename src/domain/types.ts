export type CriteriaKey =
  | 'from'
  | 'to'
  | 'subject'
  | 'hasTheWord'
  | 'doesNotHaveTheWord'
  | 'hasAttachment';

export type ActionKey =
  | 'shouldTrash'
  | 'shouldArchive'
  | 'shouldMarkAsRead'
  | 'shouldNeverSpam'
  | 'shouldAlwaysMarkAsImportant'
  | 'shouldNeverMarkAsImportant'
  | 'forwardTo'
  | 'label'
  | 'smartLabelToApply';

export interface FilterCriteria {
  from?: string;
  to?: string;
  subject?: string;
  hasTheWord?: string;
  doesNotHaveTheWord?: string;
  hasAttachment?: boolean;
}

export interface FilterActions {
  shouldTrash?: boolean;
  shouldArchive?: boolean;
  shouldMarkAsRead?: boolean;
  shouldNeverSpam?: boolean;
  shouldAlwaysMarkAsImportant?: boolean;
  shouldNeverMarkAsImportant?: boolean;
  forwardTo?: string;
  label?: string[];
  smartLabelToApply?: string;
}

export interface Filter {
  id: string;
  criteria: FilterCriteria;
  actions: FilterActions;
}

export interface FeedMeta {
  title: string;
  authorName: string;
  authorEmail: string;
}

export interface ParseResult {
  meta: FeedMeta;
  filters: Filter[];
}
