/**
 * Gmail filter schema — single source of truth for property metadata.
 *
 * Every criteria / action field is described once here. The parser, serializer,
 * editor form, and validation logic all derive their behaviour from this map.
 */

export type FieldType = 'string' | 'boolean' | 'select';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  group: 'criteria' | 'action';
  options?: readonly SelectOption[];
}

export const SMART_LABEL_OPTIONS: readonly SelectOption[] = [
  { value: '',                          label: '(none)' },
  { value: '^smartlabel_personal',      label: 'Personal' },
  { value: '^smartlabel_social',        label: 'Social' },
  { value: '^smartlabel_promo',         label: 'Promotions' },
  { value: '^smartlabel_notification',  label: 'Updates' },
  { value: '^smartlabel_group',         label: 'Forums' },
];

export const CRITERIA_FIELDS: readonly FieldDef[] = [
  { key: 'from',               label: 'From',               type: 'string',  group: 'criteria' },
  { key: 'to',                 label: 'To',                 type: 'string',  group: 'criteria' },
  { key: 'subject',            label: 'Subject',            type: 'string',  group: 'criteria' },
  { key: 'hasTheWord',         label: 'Has the words',      type: 'string',  group: 'criteria' },
  { key: 'doesNotHaveTheWord', label: 'Doesn\u2019t have',  type: 'string',  group: 'criteria' },
  { key: 'hasAttachment',      label: 'Has attachment',     type: 'boolean', group: 'criteria' },
] as const;

export const ACTION_FIELDS: readonly FieldDef[] = [
  { key: 'shouldTrash',                label: 'Delete it',             type: 'boolean', group: 'action' },
  { key: 'shouldArchive',              label: 'Skip inbox (archive)',  type: 'boolean', group: 'action' },
  { key: 'shouldMarkAsRead',           label: 'Mark as read',          type: 'boolean', group: 'action' },
  { key: 'shouldNeverSpam',            label: 'Never send to spam',    type: 'boolean', group: 'action' },
  { key: 'shouldAlwaysMarkAsImportant',label: 'Always mark important', type: 'boolean', group: 'action' },
  { key: 'shouldNeverMarkAsImportant', label: 'Never mark important',  type: 'boolean', group: 'action' },
  { key: 'forwardTo',                  label: 'Forward to',            type: 'string',  group: 'action' },
  { key: 'label',                      label: 'Apply label',           type: 'string',  group: 'action' },
  { key: 'smartLabelToApply',          label: 'Categorize as',         type: 'select',  group: 'action', options: SMART_LABEL_OPTIONS },
] as const;

export const ALL_FIELDS: readonly FieldDef[] = [...CRITERIA_FIELDS, ...ACTION_FIELDS];

export const CRITERIA_KEYS = new Set(CRITERIA_FIELDS.map(f => f.key));
export const ACTION_KEYS   = new Set(ACTION_FIELDS.map(f => f.key));
export const BOOLEAN_KEYS  = new Set(ALL_FIELDS.filter(f => f.type === 'boolean').map(f => f.key));

/** Keys that Gmail always adds but are not user-editable. */
export const META_KEYS = new Set(['sizeOperator', 'sizeUnit']);

export function getFieldDef(key: string): FieldDef | undefined {
  return ALL_FIELDS.find(f => f.key === key);
}
