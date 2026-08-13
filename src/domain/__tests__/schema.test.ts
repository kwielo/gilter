import { describe, expect, it } from 'vitest';
import {
  ACTION_FIELDS,
  ACTION_KEYS,
  ALL_FIELDS,
  BOOLEAN_KEYS,
  CRITERIA_FIELDS,
  CRITERIA_KEYS,
  getFieldDef,
  META_KEYS,
  SMART_LABEL_OPTIONS,
} from '../schema';

describe('schema', () => {
  it('keeps criteria and action keys unique and grouped', () => {
    const keys = ALL_FIELDS.map(f => f.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...CRITERIA_KEYS]).toEqual(CRITERIA_FIELDS.map(f => f.key));
    expect([...ACTION_KEYS]).toEqual(ACTION_FIELDS.map(f => f.key));
    expect(CRITERIA_FIELDS.every(f => f.group === 'criteria')).toBe(true);
    expect(ACTION_FIELDS.every(f => f.group === 'action')).toBe(true);
  });

  it('lists every boolean field in BOOLEAN_KEYS', () => {
    const booleanKeys = ALL_FIELDS.filter(f => f.type === 'boolean').map(f => f.key);
    expect([...BOOLEAN_KEYS].sort()).toEqual([...booleanKeys].sort());
  });

  it('looks up field definitions by key', () => {
    expect(getFieldDef('from')).toMatchObject({ type: 'string', group: 'criteria' });
    expect(getFieldDef('label')).toMatchObject({ type: 'tags', group: 'action' });
    expect(getFieldDef('smartLabelToApply')?.options).toBe(SMART_LABEL_OPTIONS);
    expect(getFieldDef('not-a-field')).toBeUndefined();
  });

  it('includes a none option and Gmail smart-label values', () => {
    expect(SMART_LABEL_OPTIONS[0]).toEqual({ value: '', label: '(none)' });
    expect(SMART_LABEL_OPTIONS.map(o => o.value)).toEqual(expect.arrayContaining([
      '^smartlabel_personal',
      '^smartlabel_social',
      '^smartlabel_promo',
      '^smartlabel_notification',
      '^smartlabel_group',
    ]));
  });

  it('treats sizeOperator and sizeUnit as non-editable meta keys', () => {
    expect(META_KEYS.has('sizeOperator')).toBe(true);
    expect(META_KEYS.has('sizeUnit')).toBe(true);
    expect(CRITERIA_KEYS.has('sizeOperator')).toBe(false);
    expect(ACTION_KEYS.has('sizeUnit')).toBe(false);
  });
});
