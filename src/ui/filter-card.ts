/**
 * Filter card component — a single row/card in the filter list.
 *
 * Displays a summary of the filter's criteria and actions as badges.
 * Expanding the card shows the inline editor. Includes a selection checkbox
 * for bulk operations and supports drag-to-reorder via drag handle.
 */

import { Component } from './component';
import { FilterEditor } from './filter-editor';
import { getFieldDef, SMART_LABEL_OPTIONS } from '../domain/schema';
import type { Filter, FilterCriteria, FilterActions } from '../domain/types';
import * as store from '../store/filter-store';
import * as selection from '../store/selection';
import { toast } from './toast';

export class FilterCard extends Component {
  private readonly filter: Filter;
  private readonly index: number;
  private editor: FilterEditor | null = null;
  private checkbox: HTMLInputElement | null = null;

  constructor(filter: Filter, index: number) {
    super('article', 'filter-card');
    this.filter = filter;
    this.index = index;
    this.render();
    this.bind();
  }

  private render(): void {
    const { criteria, actions } = this.filter;
    this.el.dataset.id = this.filter.id;

    this.el.innerHTML = `
      <header class="filter-card__header">
        <label class="filter-card__select" title="Select">
          <input type="checkbox" class="filter-card__checkbox"
                 ${selection.isSelected(this.filter.id) ? 'checked' : ''} />
        </label>
        <span class="filter-card__drag-handle" title="Drag to reorder" aria-label="Drag handle">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <circle cx="9" cy="5" r="1.5"/><circle cx="15" cy="5" r="1.5"/>
            <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
            <circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
          </svg>
        </span>
        <span class="filter-card__index">#${this.index}</span>
        <div class="filter-card__summary">
          <div class="filter-card__criteria">${this.renderBadges(criteria, 'criteria')}</div>
          <div class="filter-card__actions">${this.renderBadges(actions, 'action')}</div>
        </div>
        <div class="filter-card__controls">
          <button class="btn btn--icon filter-card__edit" title="Edit" aria-label="Edit filter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn--icon filter-card__dup" title="Duplicate" aria-label="Duplicate filter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button class="btn btn--icon btn--danger filter-card__delete" title="Delete" aria-label="Delete filter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </header>
      <div class="filter-card__editor-slot"></div>
    `;

    this.checkbox = this.el.querySelector<HTMLInputElement>('.filter-card__checkbox');
  }

  private renderBadges(props: FilterCriteria | FilterActions, group: 'criteria' | 'action'): string {
    const entries = Object.entries(props).filter(
      ([, v]) => v !== false && v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0),
    );
    if (entries.length === 0) return `<span class="badge badge--empty">none</span>`;

    return entries.flatMap(([key, val]) => {
      const def = getFieldDef(key);
      const label = def?.label ?? key;
      if (key === 'label' && Array.isArray(val)) {
        return (val as string[]).map(l =>
          `<span class="badge badge--${group}">${escHtml(label)}: ${escHtml(l)}</span>`
        );
      }
      let displayVal = String(val);
      if (key === 'smartLabelToApply') {
        const opt = SMART_LABEL_OPTIONS.find(o => o.value === val);
        if (opt) displayVal = opt.label;
      }
      const display = val === true ? '' : `: ${escHtml(displayVal)}`;
      return `<span class="badge badge--${group}">${escHtml(label)}${display}</span>`;
    }).join(' ');
  }

  private bind(): void {
    const editBtn   = this.el.querySelector<HTMLButtonElement>('.filter-card__edit')!;
    const dupBtn    = this.el.querySelector<HTMLButtonElement>('.filter-card__dup')!;
    const deleteBtn = this.el.querySelector<HTMLButtonElement>('.filter-card__delete')!;

    if (this.checkbox) {
      this.listen(this.checkbox, 'change', (e: Event) => {
        e.stopPropagation();
        selection.toggle(this.filter.id);
      });
    }

    this.listen(editBtn, 'click', () => this.toggleEditor());
    this.listen(dupBtn, 'click', () => {
      store.duplicateFilter(this.filter.id);
      toast.info('Filter duplicated');
    });
    this.listen(deleteBtn, 'click', () => {
      if (confirm('Delete this filter?')) {
        store.removeFilter(this.filter.id);
      }
    });
  }

  updateSelectionState(): void {
    if (this.checkbox) {
      this.checkbox.checked = selection.isSelected(this.filter.id);
    }
  }

  private toggleEditor(): void {
    const slot = this.el.querySelector<HTMLElement>('.filter-card__editor-slot')!;

    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
      this.el.classList.remove('filter-card--editing');
      return;
    }

    const current = store.getFilterById(this.filter.id);
    if (!current) return;

    this.editor = new FilterEditor(current, {
      onClose: () => {
        this.editor?.destroy();
        this.editor = null;
        this.el.classList.remove('filter-card--editing');
      },
    });
    this.editor.mount(slot);
    this.el.classList.add('filter-card--editing');
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
