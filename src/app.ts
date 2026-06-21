/**
 * Application entry point.
 *
 * Wires together infrastructure (storage, file-io, google-auth) with UI components.
 * Boot sequence:
 *   1. Enable localStorage auto-save
 *   2. Configure Google OAuth (if client ID is set)
 *   3. Restore previous session (if any)
 *   4. Mount UI components
 */

import './style.css';
import { enableAutoSave, restoreFromStorage } from './infra/storage';
import { configureAuth } from './infra/google-auth';
import * as store from './store/filter-store';
import { initToast } from './ui/toast';
import { Toolbar } from './ui/toolbar';
import { ImportPanel } from './ui/import-panel';
import { GmailPanel } from './ui/gmail-panel';
import { SearchBar } from './ui/search-bar';
import { FilterList } from './ui/filter-list';

/**
 * Google OAuth Client ID.
 *
 * Set via environment variable at build time:
 *   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
 *
 * In development: create a .env file with the variable.
 * In production: set it in the Cloudflare Workers build environment.
 */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

function boot(): void {
  enableAutoSave();
  initToast();

  if (GOOGLE_CLIENT_ID) {
    configureAuth(GOOGLE_CLIENT_ID);
  }

  const saved = restoreFromStorage();
  if (saved) {
    store.load(saved.meta, saved.filters);
  }

  const app = document.getElementById('app')!;

  new Toolbar().mount(app);
  new ImportPanel().mount(app);
  new GmailPanel().mount(app);
  new SearchBar().mount(app);
  new FilterList().mount(app);

  mountFooter(app);
}

function mountFooter(parent: HTMLElement): void {
  const footer = document.createElement('footer');
  footer.className = 'app-footer';
  footer.innerHTML = `
    <span>&copy; ${new Date().getFullYear()} <a href="https://wielo.co" target="_blank" rel="noopener">wielo.co</a></span>
    <nav class="app-footer__links">
      <a href="/privacy.html">Privacy Policy</a>
      <a href="/terms.html">Terms of Service</a>
      <a href="https://github.com/kwielo/gilter" target="_blank" rel="noopener">GitHub</a>
    </nav>`;
  parent.appendChild(footer);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
