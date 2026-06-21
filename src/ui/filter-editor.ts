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
  private currentLabels: string[];

  constructor(filter: Filter, opts: EditorOptions) {
    super('form', 'filter-editor');
    this.filter = filter;
    this.onClose = opts.onClose;
    this.currentLabels = [...(filter.actions.label ?? [])];
    this.render();
    this.bind();
  }

  private render(): void {
    const { criteria, actions } = this.filter;
    const suggestions = labelCache.getLabels();

    this.el.innerHTML = `
      ${suggestions.length > 0 ? `<datalist id="label-suggestions">${suggestions.map(l => `<option value="${escAttr(l)}">`).join('')}</datalist>` : ''}
      <fieldset class="filter-editor__group">
        <legend>Criteria</legend>
        ${CRITERIA_FIELDS.map(f => this.field(f, (criteria as Record<string, unknown>)[f.key])).join('')}
      </fieldset>
      <fieldset class="filter-editor__group">
        <legend>Actions</legend>
        ${ACTION_FIELDS.map(f => this.field(f, f.key === 'label' ? this.currentLabels : (actions as Record<string, unknown>)[f.key])).join('')}
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

    if (def.type === 'tags') {
      const tags = Array.isArray(value) ? value as string[] : [];
      const listAttr = labelCache.hasLabels() ? ' list="label-suggestions"' : '';
      const chipsHtml = tags.map((t, i) =>
        `<span class="filter-editor__tag" data-index="${i}">${escHtml(t)}<button type="button" class="filter-editor__tag-remove" data-index="${i}" title="Remove">&times;</button></span>`
      ).join('');
      return `
        <div class="filter-editor__field filter-editor__field--tags">
          <span>${def.label}</span>
          <div class="filter-editor__tags-wrap">
            <div class="filter-editor__tags">${chipsHtml}</div>
            <input type="text" class="filter-editor__tag-input" placeholder="Add label..."${listAttr} />
          </div>
        </div>`;
    }

    return `
      <label class="filter-editor__field">
        <span>${def.label}</span>
        <input type="text" name="${def.key}" value="${escAttr(String(value ?? ''))}"
               placeholder="${def.label}" />
      </label>`;
  }

  private bind(): void {
    this.listen(this.el, 'submit', (e: Event) => {
      e.preventDefault();
      this.save();
    });

    const cancelBtn = this.el.querySelector<HTMLButtonElement>('.filter-editor__cancel')!;
    this.listen(cancelBtn, 'click', () => this.onClose());

    this.bindTags();
  }

  private bindTags(): void {
    const input = this.el.querySelector<HTMLInputElement>('.filter-editor__tag-input');
    if (!input) return;

    this.listen(input, 'keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.key === 'Enter') {
        ke.preventDefault();
        const val = input.value.trim();
        if (val && !this.currentLabels.includes(val)) {
          this.currentLabels.push(val);
          this.render();
          this.bind();
        }
        input.value = '';
      }
    });

    // Also add on blur / datalist selection
    this.listen(input, 'change', () => {
      const val = input.value.trim();
      if (val && !this.currentLabels.includes(val)) {
        this.currentLabels.push(val);
        this.render();
        this.bind();
      }
      input.value = '';
    });

    const removeButtons = this.el.querySelectorAll<HTMLButtonElement>('.filter-editor__tag-remove');
    for (const btn of removeButtons) {
      this.listen(btn, 'click', (e: Event) => {
        e.preventDefault();
        const idx = parseInt(btn.dataset.index ?? '', 10);
        if (!isNaN(idx)) {
          this.currentLabels.splice(idx, 1);
          this.render();
          this.bind();
        }
      });
    }
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
      } else if (def.type === 'tags') {
        if (this.currentLabels.length > 0) {
          (actions as Record<string, unknown>)[def.key] = [...this.currentLabels];
        }
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
