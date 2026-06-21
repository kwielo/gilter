/**
 * Search bar component — text search and action-type filter.
 *
 * Emits filter criteria to the FilterList so it can show/hide cards.
 * Searches across all criteria and action string values.
 */

import { Component } from './component';
import { ACTION_FIELDS } from '../domain/schema';
import { emit, Events } from '../store/event-bus';

export interface SearchState {
  query: string;
  actionFilter: string;
}

export const SearchEvents = {
  SEARCH_CHANGED: 'search:changed',
} as const;

export class SearchBar extends Component {
  private query = '';
  private actionFilter = '';

  constructor() {
    super('div', 'search-bar');
    this.subscribe(Events.FILTERS_CHANGED, () => this.updateVisibility());
    this.render();
    this.bind();
  }

  private render(): void {
    const actionOpts = ACTION_FIELDS.map(f =>
      `<option value="${f.key}">${f.label}</option>`
    ).join('');

    this.el.innerHTML = `
      <div class="search-bar__input-wrap">
        <svg class="search-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="text" class="search-bar__input"
               placeholder="Search filters (from, to, subject, label...)"
               aria-label="Search filters" />
        <button class="search-bar__clear btn btn--icon" title="Clear search" aria-label="Clear search" style="display:none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <select class="search-bar__action-filter" aria-label="Filter by action">
        <option value="">All actions</option>
        ${actionOpts}
      </select>
    `;
  }

  private bind(): void {
    const input = this.el.querySelector<HTMLInputElement>('.search-bar__input')!;
    const clearBtn = this.el.querySelector<HTMLButtonElement>('.search-bar__clear')!;
    const select = this.el.querySelector<HTMLSelectElement>('.search-bar__action-filter')!;

    this.listen(input, 'input', () => {
      this.query = input.value.trim().toLowerCase();
      clearBtn.style.display = this.query ? '' : 'none';
      this.emitSearch();
    });

    this.listen(clearBtn, 'click', () => {
      input.value = '';
      this.query = '';
      clearBtn.style.display = 'none';
      this.emitSearch();
    });

    this.listen(select, 'change', () => {
      this.actionFilter = select.value;
      this.emitSearch();
    });
  }

  private emitSearch(): void {
    emit<SearchState>(SearchEvents.SEARCH_CHANGED, {
      query: this.query,
      actionFilter: this.actionFilter,
    });
  }

  private updateVisibility(): void {
    // Reset search on new import
  }

  getState(): SearchState {
    return { query: this.query, actionFilter: this.actionFilter };
  }
}
