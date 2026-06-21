/**
 * Filter list component — renders the full list of FilterCard components.
 *
 * Subscribes to FILTERS_CHANGED and re-renders the list on every state change.
 * Supports search filtering, bulk selection, and drag-to-reorder.
 */

import { Component } from './component';
import { FilterCard } from './filter-card';
import { Events } from '../store/event-bus';
import { getFilters, removeMany, moveFilter } from '../store/filter-store';
import * as selection from '../store/selection';
import { SearchEvents, type SearchState } from './search-bar';
import { toast } from './toast';
import type { Filter } from '../domain/types';

export class FilterList extends Component {
  private cards: FilterCard[] = [];
  private searchQuery = '';
  private actionFilter = '';
  private dragFromIndex: number | null = null;

  constructor() {
    super('section', 'filter-list');
    this.subscribe(Events.FILTERS_CHANGED, () => this.renderList());
    this.subscribe(SearchEvents.SEARCH_CHANGED, (s: SearchState) => {
      this.searchQuery = s.query;
      this.actionFilter = s.actionFilter;
      this.applyFilter();
    });
    this.subscribe(Events.SELECTION_CHANGED, () => this.updateBulkBar());
    this.renderList();
  }

  private renderList(): void {
    for (const card of this.cards) card.destroy();
    this.cards = [];

    const filters = getFilters();

    if (filters.length === 0) {
      this.el.innerHTML = `
        <div class="filter-list__empty">
          <p>No filters loaded. Import a Gmail filters XML file to get started.</p>
        </div>`;
      return;
    }

    this.el.innerHTML = `
      <header class="filter-list__header">
        <div class="filter-list__header-left">
          <label class="filter-list__select-all" title="Select all">
            <input type="checkbox" class="filter-list__select-all-cb" />
          </label>
          <h2>${filters.length} filter${filters.length !== 1 ? 's' : ''}</h2>
        </div>
        <div class="filter-list__bulk-bar" style="display:none">
          <span class="filter-list__bulk-count"></span>
          <button class="btn btn--danger btn--sm filter-list__bulk-delete">Delete selected</button>
          <button class="btn btn--ghost btn--sm filter-list__bulk-deselect">Deselect</button>
        </div>
      </header>
      <div class="filter-list__items"></div>
    `;

    this.bindHeader(filters);

    const container = this.el.querySelector<HTMLElement>('.filter-list__items')!;
    for (let i = 0; i < filters.length; i++) {
      const card = new FilterCard(filters[i], i + 1);
      card.mount(container);
      this.cards.push(card);
      this.setupDrag(card, i);
    }

    this.applyFilter();
    this.updateBulkBar();
  }

  private bindHeader(filters: Filter[]): void {
    const selectAllCb = this.el.querySelector<HTMLInputElement>('.filter-list__select-all-cb');
    const bulkDeleteBtn = this.el.querySelector<HTMLButtonElement>('.filter-list__bulk-delete');
    const bulkDeselectBtn = this.el.querySelector<HTMLButtonElement>('.filter-list__bulk-deselect');

    if (selectAllCb) {
      this.listen(selectAllCb, 'change', () => {
        if (selectAllCb.checked) {
          selection.selectAll(filters.map(f => f.id));
        } else {
          selection.deselectAll();
        }
      });
    }

    if (bulkDeleteBtn) {
      this.listen(bulkDeleteBtn, 'click', () => {
        const sel = selection.getSelected();
        if (sel.size === 0) return;
        if (!confirm(`Delete ${sel.size} selected filter(s)?`)) return;
        const removed = removeMany(sel);
        selection.deselectAll();
        toast.info(`Deleted ${removed} filter(s)`);
      });
    }

    if (bulkDeselectBtn) {
      this.listen(bulkDeselectBtn, 'click', () => {
        selection.deselectAll();
      });
    }
  }

  private updateBulkBar(): void {
    const bulkBar = this.el.querySelector<HTMLElement>('.filter-list__bulk-bar');
    const bulkCount = this.el.querySelector<HTMLElement>('.filter-list__bulk-count');
    const selectAllCb = this.el.querySelector<HTMLInputElement>('.filter-list__select-all-cb');
    const count = selection.getSelectedCount();

    if (bulkBar) {
      bulkBar.style.display = count > 0 ? '' : 'none';
    }
    if (bulkCount) {
      bulkCount.textContent = `${count} selected`;
    }
    if (selectAllCb) {
      const filters = getFilters();
      selectAllCb.checked = filters.length > 0 && count === filters.length;
      selectAllCb.indeterminate = count > 0 && count < filters.length;
    }

    for (const card of this.cards) {
      card.updateSelectionState();
    }
  }

  private applyFilter(): void {
    const filters = getFilters();
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const filter = filters[i];
      const visible = this.matchesSearch(filter);
      card.el.style.display = visible ? '' : 'none';
    }
  }

  private matchesSearch(filter: Filter): boolean {
    if (this.actionFilter) {
      const val = (filter.actions as Record<string, unknown>)[this.actionFilter];
      if (!val && val !== true) return false;
    }

    if (!this.searchQuery) return true;

    const q = this.searchQuery;
    const { criteria, actions } = filter;

    const searchable = [
      criteria.from, criteria.to, criteria.subject,
      criteria.hasTheWord, criteria.doesNotHaveTheWord,
      actions.forwardTo, actions.label, actions.smartLabelToApply,
    ];

    return searchable.some(v => v && v.toLowerCase().includes(q));
  }

  private setupDrag(card: FilterCard, index: number): void {
    card.el.draggable = true;
    card.el.dataset.index = String(index);

    this.listen(card.el, 'dragstart', (e: Event) => {
      const de = e as DragEvent;
      this.dragFromIndex = index;
      de.dataTransfer!.effectAllowed = 'move';
      de.dataTransfer!.setData('text/plain', String(index));
      card.el.classList.add('filter-card--dragging');
    });

    this.listen(card.el, 'dragend', () => {
      card.el.classList.remove('filter-card--dragging');
      this.clearDropIndicators();
      this.dragFromIndex = null;
    });

    this.listen(card.el, 'dragover', (e: Event) => {
      e.preventDefault();
      (e as DragEvent).dataTransfer!.dropEffect = 'move';
      this.clearDropIndicators();
      if (this.dragFromIndex !== null && this.dragFromIndex !== index) {
        card.el.classList.add(
          index < this.dragFromIndex ? 'filter-card--drop-above' : 'filter-card--drop-below'
        );
      }
    });

    this.listen(card.el, 'dragleave', () => {
      card.el.classList.remove('filter-card--drop-above', 'filter-card--drop-below');
    });

    this.listen(card.el, 'drop', (e: Event) => {
      e.preventDefault();
      this.clearDropIndicators();
      if (this.dragFromIndex !== null && this.dragFromIndex !== index) {
        moveFilter(this.dragFromIndex, index);
      }
      this.dragFromIndex = null;
    });
  }

  private clearDropIndicators(): void {
    for (const card of this.cards) {
      card.el.classList.remove('filter-card--drop-above', 'filter-card--drop-below');
    }
  }

  override destroy(): void {
    for (const card of this.cards) card.destroy();
    this.cards = [];
    super.destroy();
  }
}
