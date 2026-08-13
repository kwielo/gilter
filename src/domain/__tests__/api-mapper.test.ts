import { describe, expect, it } from 'vitest';
import { fromGmailFilter, toGmailFilter } from '../api-mapper';
import { SYSTEM_LABELS } from '../gmail-types';
import { makeFilter, userLabels } from './fixtures';

describe('fromGmailFilter', () => {
  it('maps criteria fields from the Gmail API names', () => {
    const filter = fromGmailFilter({
      id: 'gf-1',
      criteria: {
        from: 'a@b.com',
        to: 'me@x.com',
        subject: 'Hi',
        query: 'has:yellow-star',
        negatedQuery: 'unsubscribe',
        hasAttachment: true,
      },
      action: {},
    }, userLabels);

    expect(filter.id).toBe('gf-1');
    expect(filter.criteria).toEqual({
      from: 'a@b.com',
      to: 'me@x.com',
      subject: 'Hi',
      hasTheWord: 'has:yellow-star',
      doesNotHaveTheWord: 'unsubscribe',
      hasAttachment: true,
    });
  });

  it('maps system label ids to semantic action flags', () => {
    const filter = fromGmailFilter({
      id: 'gf-2',
      criteria: {},
      action: {
        addLabelIds: [SYSTEM_LABELS.TRASH, SYSTEM_LABELS.IMPORTANT],
        removeLabelIds: [
          SYSTEM_LABELS.INBOX,
          SYSTEM_LABELS.UNREAD,
          SYSTEM_LABELS.SPAM,
        ],
        forward: 'copy@x.com',
      },
    }, userLabels);

    expect(filter.actions).toEqual({
      shouldTrash: true,
      shouldAlwaysMarkAsImportant: true,
      shouldArchive: true,
      shouldMarkAsRead: true,
      shouldNeverSpam: true,
      forwardTo: 'copy@x.com',
    });
  });

  it('maps never-important from removing IMPORTANT', () => {
    const filter = fromGmailFilter({
      id: 'gf-3',
      criteria: {},
      action: { removeLabelIds: [SYSTEM_LABELS.IMPORTANT] },
    }, userLabels);
    expect(filter.actions.shouldNeverMarkAsImportant).toBe(true);
  });

  it('maps category labels to smartLabelToApply and user labels by name', () => {
    const filter = fromGmailFilter({
      id: 'gf-4',
      criteria: {},
      action: {
        addLabelIds: ['Label_1', 'Label_2', SYSTEM_LABELS.CATEGORY_PERSONAL],
      },
    }, userLabels);

    expect(filter.actions.label).toEqual(['Work', 'Receipts']);
    expect(filter.actions.smartLabelToApply).toBe('^smartlabel_personal');
  });

  it('ignores unknown label ids and system labels that are not actions', () => {
    const filter = fromGmailFilter({
      id: 'gf-5',
      criteria: {},
      action: { addLabelIds: ['Label_missing', SYSTEM_LABELS.STARRED] },
    }, userLabels);
    expect(filter.actions).toEqual({});
  });
});

describe('toGmailFilter', () => {
  it('maps criteria back to Gmail API names', () => {
    const payload = toGmailFilter(makeFilter({
      criteria: {
        from: 'a@b.com',
        to: 'me@x.com',
        subject: 'Hi',
        hasTheWord: 'receipt',
        doesNotHaveTheWord: 'promo',
        hasAttachment: true,
      },
    }), userLabels);

    expect(payload).not.toHaveProperty('id');
    expect(payload.criteria).toEqual({
      from: 'a@b.com',
      to: 'me@x.com',
      subject: 'Hi',
      query: 'receipt',
      negatedQuery: 'promo',
      hasAttachment: true,
    });
  });

  it('maps action flags to add/remove label ids and forward', () => {
    const payload = toGmailFilter(makeFilter({
      actions: {
        shouldTrash: true,
        shouldArchive: true,
        shouldMarkAsRead: true,
        shouldNeverSpam: true,
        shouldAlwaysMarkAsImportant: true,
        forwardTo: 'copy@x.com',
        label: ['Work'],
        smartLabelToApply: '^smartlabel_promo',
      },
    }), userLabels);

    expect(payload.action.addLabelIds).toEqual([
      SYSTEM_LABELS.TRASH,
      SYSTEM_LABELS.IMPORTANT,
      SYSTEM_LABELS.CATEGORY_PROMOTIONS,
      'Label_1',
    ]);
    expect(payload.action.removeLabelIds).toEqual([
      SYSTEM_LABELS.INBOX,
      SYSTEM_LABELS.UNREAD,
      SYSTEM_LABELS.SPAM,
    ]);
    expect(payload.action.forward).toBe('copy@x.com');
  });

  it('maps never-important to removing IMPORTANT', () => {
    const payload = toGmailFilter(makeFilter({
      actions: { shouldNeverMarkAsImportant: true },
    }), userLabels);
    expect(payload.action).toEqual({ removeLabelIds: [SYSTEM_LABELS.IMPORTANT] });
  });

  it('skips labels that are not in the provided label list', () => {
    const payload = toGmailFilter(makeFilter({
      actions: { label: ['Missing'] },
    }), userLabels);
    expect(payload.action).toEqual({});
  });

  it('round-trips a filter through API mapping', () => {
    const original = makeFilter({
      id: 'keep-me',
      criteria: { from: 'a@b.com', hasTheWord: 'invoice', hasAttachment: true },
      actions: {
        shouldArchive: true,
        label: ['Receipts'],
        smartLabelToApply: '^smartlabel_personal',
        forwardTo: 'copy@x.com',
      },
    });
    const api = toGmailFilter(original, userLabels);
    const restored = fromGmailFilter({ id: original.id, ...api }, userLabels);
    expect(restored).toEqual(original);
  });
});
