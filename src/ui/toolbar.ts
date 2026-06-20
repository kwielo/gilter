/**
 * Toolbar component — top actions bar.
 *
 * Provides: Add filter, Export XML, Clear all.
 */

import { Component } from './component';
import * as store from '../store/filter-store';
import { serializeFiltersXml } from '../domain/serializer';
import { downloadAsFile } from '../infra/file-io';
import { clearStorage } from '../infra/storage';
import { toast } from './toast';

export class Toolbar extends Component {
  constructor() {
    super('nav', 'toolbar');
    this.render();
    this.bind();
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="toolbar__left">
        <h1 class="toolbar__title">
          <svg class="toolbar__logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          gilter
        </h1>
      </div>
      <div class="toolbar__right">
        <button class="btn btn--secondary toolbar__add" title="Add new filter">
          + Add filter
        </button>
        <button class="btn btn--primary toolbar__export" title="Export as XML">
          Export XML
        </button>
        <button class="btn btn--ghost btn--danger toolbar__clear" title="Clear all filters">
          Clear
        </button>
      </div>
    `;
  }

  private bind(): void {
    const addBtn    = this.el.querySelector<HTMLButtonElement>('.toolbar__add')!;
    const exportBtn = this.el.querySelector<HTMLButtonElement>('.toolbar__export')!;
    const clearBtn  = this.el.querySelector<HTMLButtonElement>('.toolbar__clear')!;

    this.listen(addBtn, 'click', () => {
      store.addFilter();
      toast.info('New filter added — edit it below');
    });

    this.listen(exportBtn, 'click', () => {
      const filters = store.getFilters();
      if (filters.length === 0) {
        toast.error('No filters to export');
        return;
      }
      const xml = serializeFiltersXml(store.getMeta(), filters);
      downloadAsFile(xml, 'mailFilters.xml');
      toast.success(`Exported ${filters.length} filter(s)`);
    });

    this.listen(clearBtn, 'click', () => {
      if (store.getCount() === 0) return;
      if (!confirm(`Delete all ${store.getCount()} filters?`)) return;
      store.load({ title: 'Mail Filters', authorName: '', authorEmail: '' }, []);
      clearStorage();
      toast.info('All filters cleared');
    });
  }
}
