/**
 * Inline filter editor component.
 *
 * Renders a form for a single filter with all criteria and action fields
 * driven by the schema. On save, pushes changes to the store.
 */

import { Component } from './component';
import type { Filter, FilterCriteria, FilterActions } from '../domain/types';
import { CRITERIA_FIELDS, ACTION_FIELDS, type FieldDef } from '../domain/schema';
import * as store from '../store/filter-store';
import * as labelCache from '../store/label-cache';
import { toast } from './toast';

interface EditorOptions {
  onClose: () => void;
}

export class FilterEditor extends Component {
  private readonly filter: Filter;
  private readonly onClose: () => void;

  constructor(filter: Filter, opts: EditorOptions) {
    super('form', 'filter-editor');
    this.filter = filter;
    this.onClose = opts.onClose;
    this.render();
    this.bind();
  }

  private render(): void {
    const { criteria, actions } = this.filter;
    const labels = labelCache.getLabels();

    this.el.innerHTML = `
      ${labels.length > 0 ? `<datalist id="label-suggestions">${labels.map(l => `<option value="${escAttr(l)}">`).join('')}</datalist>` : ''}
      <fieldset class="filter-editor__group">
        <legend>Criteria</legend>
        ${CRITERIA_FIELDS.map(f => this.field(f, (criteria as Record<string, unknown>)[f.key])).join('')}
      </fieldset>
      <fieldset class="filter-editor__group">
        <legend>Actions</legend>
        ${ACTION_FIELDS.map(f => this.field(f, (actions as Record<string, unknown>)[f.key])).join('')}
      </fieldset>
      <div class="filter-editor__actions">
        <button type="submit" class="btn btn--primary">Save</button>
        <button type="button" class="btn btn--ghost filter-editor__cancel">Cancel</button>
      </div>
    `;
  }

  private field(def: FieldDef, value: unknown): string {
    if (def.type === 'boolean') {
      const checked = value === true ? 'checked' : '';
      return `
        <label class="filter-editor__field filter-editor__field--bool">
          <input type="checkbox" name="${def.key}" ${checked} />
          <span>${def.label}</span>
        </label>`;
    }

    if (def.type === 'select' && def.options) {
      const current = String(value ?? '');
      const optionsHtml = def.options
        .map(o => `<option value="${escAttr(o.value)}" ${o.value === current ? 'selected' : ''}>${escHtml(o.label)}</option>`)
        .join('');
      return `
        <label class="filter-editor__field">
          <span>${def.label}</span>
          <select name="${def.key}" class="filter-editor__select">
            ${optionsHtml}
          </select>
        </label>`;
    }

    const listAttr = def.key === 'label' && labelCache.hasLabels() ? ' list="label-suggestions"' : '';
    return `
      <label class="filter-editor__field">
        <span>${def.label}</span>
        <input type="text" name="${def.key}" value="${escAttr(String(value ?? ''))}"
               placeholder="${def.label}"${listAttr} />
      </label>`;
  }

  private bind(): void {
    this.listen(this.el, 'submit', (e: Event) => {
      e.preventDefault();
      this.save();
    });

    const cancelBtn = this.el.querySelector<HTMLButtonElement>('.filter-editor__cancel')!;
    this.listen(cancelBtn, 'click', () => this.onClose());
  }

  private save(): void {
    const criteria: FilterCriteria = {};
    const actions: FilterActions = {};

    for (const def of CRITERIA_FIELDS) {
      if (def.type === 'boolean') {
        const el = this.el.querySelector<HTMLInputElement>(`[name="${def.key}"]`)!;
        if (el.checked) (criteria as Record<string, unknown>)[def.key] = true;
      } else {
        const el = this.el.querySelector<HTMLInputElement>(`[name="${def.key}"]`)!;
        const val = el.value.trim();
        if (val) (criteria as Record<string, unknown>)[def.key] = val;
      }
    }

    for (const def of ACTION_FIELDS) {
      if (def.type === 'boolean') {
        const el = this.el.querySelector<HTMLInputElement>(`[name="${def.key}"]`)!;
        if (el.checked) (actions as Record<string, unknown>)[def.key] = true;
      } else if (def.type === 'select') {
        const el = this.el.querySelector<HTMLSelectElement>(`[name="${def.key}"]`)!;
        const val = el.value;
        if (val) (actions as Record<string, unknown>)[def.key] = val;
      } else {
        const el = this.el.querySelector<HTMLInputElement>(`[name="${def.key}"]`)!;
        const val = el.value.trim();
        if (val) (actions as Record<string, unknown>)[def.key] = val;
      }
    }

    store.updateFilter(this.filter.id, criteria, actions);
    toast.success('Filter saved');
    this.onClose();
  }
}

function escAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
