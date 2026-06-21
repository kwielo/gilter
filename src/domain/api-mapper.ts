/**
 * Bidirectional mapper between Gmail API filter model and gilter's internal model.
 *
 * Gmail API uses label IDs for actions (addLabelIds/removeLabelIds),
 * while gilter uses semantic boolean flags and label name strings.
 * This module bridges the two representations.
 */

import type { Filter, FilterCriteria, FilterActions } from './types';
import type { GmailFilter, GmailFilterCriteria, GmailFilterAction, GmailLabel } from './gmail-types';
import { SYSTEM_LABELS, SMART_LABEL_TO_CATEGORY, CATEGORY_TO_SMART_LABEL } from './gmail-types';

type LabelMap = Map<string, GmailLabel>;

function buildIdToLabel(labels: GmailLabel[]): LabelMap {
  return new Map(labels.map(l => [l.id, l]));
}

function buildNameToLabel(labels: GmailLabel[]): Map<string, GmailLabel> {
  return new Map(labels.map(l => [l.name, l]));
}

/** Convert a Gmail API filter to gilter's internal Filter model. */
export function fromGmailFilter(gf: GmailFilter, labels: GmailLabel[]): Filter {
  const idMap = buildIdToLabel(labels);
  const criteria = mapCriteriaFromApi(gf.criteria);
  const actions = mapActionsFromApi(gf.action, idMap);

  return { id: gf.id, criteria, actions };
}

/** Convert gilter's internal Filter to a Gmail API filter (for create). */
export function toGmailFilter(filter: Filter, labels: GmailLabel[]): Omit<GmailFilter, 'id'> {
  const nameMap = buildNameToLabel(labels);
  const criteria = mapCriteriaToApi(filter.criteria);
  const action = mapActionsToApi(filter.actions, nameMap);

  return { criteria, action };
}

function mapCriteriaFromApi(gc: GmailFilterCriteria): FilterCriteria {
  const c: FilterCriteria = {};
  if (gc.from) c.from = gc.from;
  if (gc.to) c.to = gc.to;
  if (gc.subject) c.subject = gc.subject;
  if (gc.query) c.hasTheWord = gc.query;
  if (gc.negatedQuery) c.doesNotHaveTheWord = gc.negatedQuery;
  if (gc.hasAttachment) c.hasAttachment = true;
  return c;
}

function mapCriteriaToApi(c: FilterCriteria): GmailFilterCriteria {
  const gc: GmailFilterCriteria = {};
  if (c.from) gc.from = c.from;
  if (c.to) gc.to = c.to;
  if (c.subject) gc.subject = c.subject;
  if (c.hasTheWord) gc.query = c.hasTheWord;
  if (c.doesNotHaveTheWord) gc.negatedQuery = c.doesNotHaveTheWord;
  if (c.hasAttachment) gc.hasAttachment = true;
  return gc;
}

function mapActionsFromApi(ga: GmailFilterAction, idMap: LabelMap): FilterActions {
  const a: FilterActions = {};
  const addIds = new Set(ga.addLabelIds ?? []);
  const removeIds = new Set(ga.removeLabelIds ?? []);

  if (addIds.has(SYSTEM_LABELS.TRASH)) a.shouldTrash = true;
  if (removeIds.has(SYSTEM_LABELS.INBOX)) a.shouldArchive = true;
  if (removeIds.has(SYSTEM_LABELS.UNREAD)) a.shouldMarkAsRead = true;
  if (removeIds.has(SYSTEM_LABELS.SPAM)) a.shouldNeverSpam = true;
  if (addIds.has(SYSTEM_LABELS.IMPORTANT)) a.shouldAlwaysMarkAsImportant = true;
  if (removeIds.has(SYSTEM_LABELS.IMPORTANT)) a.shouldNeverMarkAsImportant = true;
  if (ga.forward) a.forwardTo = ga.forward;

  // Category labels → smartLabelToApply
  for (const catId of Object.values(SYSTEM_LABELS)) {
    if (catId.startsWith('CATEGORY_') && addIds.has(catId)) {
      const smart = CATEGORY_TO_SMART_LABEL[catId];
      if (smart) a.smartLabelToApply = smart;
    }
  }

  // User labels → label (use name, take first one found)
  for (const lid of addIds) {
    const label = idMap.get(lid);
    if (label && label.type === 'user') {
      a.label = label.name;
      break;
    }
  }

  return a;
}

function mapActionsToApi(a: FilterActions, nameMap: Map<string, GmailLabel>): GmailFilterAction {
  const addLabelIds: string[] = [];
  const removeLabelIds: string[] = [];

  if (a.shouldTrash) addLabelIds.push(SYSTEM_LABELS.TRASH);
  if (a.shouldArchive) removeLabelIds.push(SYSTEM_LABELS.INBOX);
  if (a.shouldMarkAsRead) removeLabelIds.push(SYSTEM_LABELS.UNREAD);
  if (a.shouldNeverSpam) removeLabelIds.push(SYSTEM_LABELS.SPAM);
  if (a.shouldAlwaysMarkAsImportant) addLabelIds.push(SYSTEM_LABELS.IMPORTANT);
  if (a.shouldNeverMarkAsImportant) removeLabelIds.push(SYSTEM_LABELS.IMPORTANT);

  if (a.smartLabelToApply) {
    const catId = SMART_LABEL_TO_CATEGORY[a.smartLabelToApply];
    if (catId) addLabelIds.push(catId);
  }

  if (a.label) {
    const label = nameMap.get(a.label);
    if (label) addLabelIds.push(label.id);
  }

  const action: GmailFilterAction = {};
  if (addLabelIds.length > 0) action.addLabelIds = addLabelIds;
  if (removeLabelIds.length > 0) action.removeLabelIds = removeLabelIds;
  if (a.forwardTo) action.forward = a.forwardTo;

  return action;
}
