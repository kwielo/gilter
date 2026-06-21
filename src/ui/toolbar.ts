/**
 * Toolbar component — top actions bar.
 *
 * Provides: Undo/Redo, Add filter, Export XML, Clear all, Dark/Light toggle.
 */

import { Component } from './component';
import * as store from '../store/filter-store';
import * as history from '../store/history';
import { serializeFiltersXml } from '../domain/serializer';
import { downloadAsFile } from '../infra/file-io';
import { clearStorage } from '../infra/storage';
import { Events } from '../store/event-bus';
import { toast } from './toast';

const THEME_KEY = 'gilter_theme';

export class Toolbar extends Component {
  private undoBtn!: HTMLButtonElement;
  private redoBtn!: HTMLButtonElement;

  constructor() {
    super('nav', 'toolbar');
    this.render();
    this.bind();
    this.subscribe(Events.HISTORY_CHANGED, () => this.updateUndoRedo());
    this.initTheme();
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
        <div class="toolbar__undo-redo">
          <button class="btn btn--icon toolbar__undo" title="Undo (Ctrl+Z)" aria-label="Undo" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
          </button>
          <button class="btn btn--icon toolbar__redo" title="Redo (Ctrl+Y)" aria-label="Redo" disabled>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
            </svg>
          </button>
        </div>
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
        <button class="btn btn--icon toolbar__theme" title="Toggle theme" aria-label="Toggle dark/light mode">
          <svg class="toolbar__theme-icon--light" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg class="toolbar__theme-icon--dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
    `;

    this.undoBtn = this.el.querySelector<HTMLButtonElement>('.toolbar__undo')!;
    this.redoBtn = this.el.querySelector<HTMLButtonElement>('.toolbar__redo')!;
  }

  private bind(): void {
    const addBtn    = this.el.querySelector<HTMLButtonElement>('.toolbar__add')!;
    const exportBtn = this.el.querySelector<HTMLButtonElement>('.toolbar__export')!;
    const clearBtn  = this.el.querySelector<HTMLButtonElement>('.toolbar__clear')!;
    const themeBtn  = this.el.querySelector<HTMLButtonElement>('.toolbar__theme')!;

    this.listen(this.undoBtn, 'click', () => {
      if (history.undo()) toast.info('Undone');
    });

    this.listen(this.redoBtn, 'click', () => {
      if (history.redo()) toast.info('Redone');
    });

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
      history.clearHistory();
      toast.info('All filters cleared');
    });

    this.listen(themeBtn, 'click', () => this.toggleTheme());

    // Keyboard shortcuts
    this.listen(document, 'keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if (ke.target instanceof HTMLInputElement || ke.target instanceof HTMLTextAreaElement) return;
      if ((ke.ctrlKey || ke.metaKey) && ke.key === 'z' && !ke.shiftKey) {
        ke.preventDefault();
        if (history.undo()) toast.info('Undone');
      }
      if ((ke.ctrlKey || ke.metaKey) && (ke.key === 'y' || (ke.key === 'z' && ke.shiftKey))) {
        ke.preventDefault();
        if (history.redo()) toast.info('Redone');
      }
    });
  }

  private updateUndoRedo(): void {
    this.undoBtn.disabled = !history.canUndo();
    this.redoBtn.disabled = !history.canRedo();
  }

  private initTheme(): void {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }

  private toggleTheme(): void {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem(THEME_KEY);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }
}
