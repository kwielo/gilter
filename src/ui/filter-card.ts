/**
 * Filter card component — a single row/card in the filter list.
 *
 * Displays a summary of the filter's criteria and actions as badges.
 * Expanding the card shows the inline editor.
 */

import { Component } from './component';
import { FilterEditor } from './filter-editor';
import { getFieldDef } from '../domain/schema';
import type { Filter, FilterCriteria, FilterActions } from '../domain/types';
import * as store from '../store/filter-store';
import { toast } from './toast';

export class FilterCard extends Component {
  private readonly filter: Filter;
  private readonly index: number;
  private editor: FilterEditor | null = null;

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
  }

  private renderBadges(props: FilterCriteria | FilterActions, group: 'criteria' | 'action'): string {
    const entries = Object.entries(props).filter(
      ([, v]) => v !== false && v !== null && v !== undefined && v !== '',
    );
    if (entries.length === 0) return `<span class="badge badge--empty">none</span>`;

    return entries.map(([key, val]) => {
      const def = getFieldDef(key);
      const label = def?.label ?? key;
      const display = val === true ? '' : `: ${escHtml(String(val))}`;
      return `<span class="badge badge--${group}">${escHtml(label)}${display}</span>`;
    }).join(' ');
  }

  private bind(): void {
    const editBtn   = this.el.querySelector<HTMLButtonElement>('.filter-card__edit')!;
    const dupBtn    = this.el.querySelector<HTMLButtonElement>('.filter-card__dup')!;
    const deleteBtn = this.el.querySelector<HTMLButtonElement>('.filter-card__delete')!;

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
