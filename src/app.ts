/**
 * Application entry point.
 *
 * Wires together infrastructure (storage, file-io) with UI components.
 * Boot sequence:
 *   1. Enable localStorage auto-save
 *   2. Restore previous session (if any)
 *   3. Mount UI components
 */

import './style.css';
import { enableAutoSave, restoreFromStorage } from './infra/storage';
import * as store from './store/filter-store';
import { initToast } from './ui/toast';
import { Toolbar } from './ui/toolbar';
import { ImportPanel } from './ui/import-panel';
import { SearchBar } from './ui/search-bar';
import { FilterList } from './ui/filter-list';

function boot(): void {
  enableAutoSave();
  initToast();

  const saved = restoreFromStorage();
  if (saved) {
    store.load(saved.meta, saved.filters);
  }

  const app = document.getElementById('app')!;

  new Toolbar().mount(app);
  new ImportPanel().mount(app);
  new SearchBar().mount(app);
  new FilterList().mount(app);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
