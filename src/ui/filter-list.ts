/**
 * Filter list component — renders the full list of FilterCard components.
 *
 * Subscribes to FILTERS_CHANGED and re-renders the list on every state change.
 * Owns the lifecycle of all child FilterCard instances.
 */

import { Component } from './component';
import { FilterCard } from './filter-card';
import { Events } from '../store/event-bus';
import { getFilters } from '../store/filter-store';

export class FilterList extends Component {
  private cards: FilterCard[] = [];

  constructor() {
    super('section', 'filter-list');
    this.subscribe(Events.FILTERS_CHANGED, () => this.renderList());
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
        <h2>${filters.length} filter${filters.length !== 1 ? 's' : ''}</h2>
      </header>
      <div class="filter-list__items"></div>
    `;

    const container = this.el.querySelector<HTMLElement>('.filter-list__items')!;
    for (let i = 0; i < filters.length; i++) {
      const card = new FilterCard(filters[i], i + 1);
      card.mount(container);
      this.cards.push(card);
    }
  }

  override destroy(): void {
    for (const card of this.cards) card.destroy();
    this.cards = [];
    super.destroy();
  }
}
