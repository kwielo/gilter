/**
 * Gmail integration panel — sign in, pull filters, push changes.
 *
 * Shows auth state and provides sync controls. Fetches filters + labels
 * from the Gmail API and maps them to gilter's internal model.
 */

import { Component } from './component';
import { Events } from '../store/event-bus';
import * as auth from '../infra/google-auth';
import * as api from '../infra/gmail-api';
import * as store from '../store/filter-store';
import { fromGmailFilter, toGmailFilter } from '../domain/api-mapper';
import type { GmailLabel } from '../domain/gmail-types';
import { toast } from './toast';

export class GmailPanel extends Component {
  private labels: GmailLabel[] = [];
  private syncing = false;

  constructor() {
    super('section', 'gmail-panel');
    this.subscribe(Events.AUTH_CHANGED, () => this.render());
    this.render();
  }

  private render(): void {
    const signedIn = auth.isSignedIn();
    const email = auth.getUserEmail();
    const configured = auth.isConfigured();

    if (!configured) {
      this.el.innerHTML = `
        <div class="gmail-panel__status gmail-panel__status--unconfigured">
          <svg class="gmail-panel__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Gmail API not configured — set <code>GOOGLE_CLIENT_ID</code> to enable sync</span>
        </div>`;
      return;
    }

    if (!signedIn) {
      this.el.innerHTML = `
        <div class="gmail-panel__connect">
          <button class="btn btn--google gmail-panel__sign-in">
            <svg class="gmail-panel__google-icon" viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          <span class="gmail-panel__hint">Connect to pull & push filters directly</span>
        </div>`;
    } else {
      this.el.innerHTML = `
        <div class="gmail-panel__connected">
          <div class="gmail-panel__user">
            <svg class="gmail-panel__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>${escHtml(email ?? 'Connected')}</span>
            <button class="btn btn--ghost btn--sm gmail-panel__sign-out">Sign out</button>
          </div>
          <div class="gmail-panel__actions">
            <button class="btn btn--secondary gmail-panel__pull" ${this.syncing ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
              </svg>
              Pull from Gmail
            </button>
            <button class="btn btn--primary gmail-panel__push" ${this.syncing ? 'disabled' : ''}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
              Push to Gmail
            </button>
          </div>
          ${this.syncing ? '<div class="gmail-panel__syncing">Syncing...</div>' : ''}
        </div>`;
    }

    this.bind();
  }

  private bind(): void {
    const signInBtn = this.el.querySelector<HTMLButtonElement>('.gmail-panel__sign-in');
    const signOutBtn = this.el.querySelector<HTMLButtonElement>('.gmail-panel__sign-out');
    const pullBtn = this.el.querySelector<HTMLButtonElement>('.gmail-panel__pull');
    const pushBtn = this.el.querySelector<HTMLButtonElement>('.gmail-panel__push');

    if (signInBtn) {
      this.listen(signInBtn, 'click', () => this.handleSignIn());
    }
    if (signOutBtn) {
      this.listen(signOutBtn, 'click', () => {
        auth.signOut();
        toast.info('Signed out');
      });
    }
    if (pullBtn) {
      this.listen(pullBtn, 'click', () => this.handlePull());
    }
    if (pushBtn) {
      this.listen(pushBtn, 'click', () => this.handlePush());
    }
  }

  private async handleSignIn(): Promise<void> {
    try {
      await auth.signIn();
      toast.success('Signed in to Google');
    } catch (err) {
      toast.error(`Sign-in failed: ${(err as Error).message}`);
    }
  }

  private async handlePull(): Promise<void> {
    this.syncing = true;
    this.render();
    try {
      const [filters, labels] = await Promise.all([
        api.listFilters(),
        api.listLabels(),
      ]);
      this.labels = labels;

      const mapped = filters.map(f => fromGmailFilter(f, labels));
      const email = auth.getUserEmail();
      store.load(
        { title: 'Mail Filters', authorName: '', authorEmail: email ?? '' },
        mapped,
      );
      toast.success(`Pulled ${mapped.length} filter(s) from Gmail`);
    } catch (err) {
      toast.error(`Pull failed: ${(err as Error).message}`);
    } finally {
      this.syncing = false;
      this.render();
    }
  }

  private async handlePush(): Promise<void> {
    const localFilters = store.getFilters();
    if (localFilters.length === 0) {
      toast.error('No filters to push');
      return;
    }

    const action = await this.showPushConfirm(localFilters.length);
    if (!action) return;

    this.syncing = true;
    this.render();
    try {
      if (this.labels.length === 0) {
        this.labels = await api.listLabels();
      }

      // Get existing remote filters
      const remoteFilters = await api.listFilters();

      if (action === 'replace') {
        // Delete all existing, then create all local
        for (const rf of remoteFilters) {
          await api.deleteFilter(rf.id);
        }
        let created = 0;
        for (const lf of localFilters) {
          const payload = toGmailFilter(lf, this.labels);
          await api.createFilter(payload);
          created++;
        }
        toast.success(`Replaced ${remoteFilters.length} remote filter(s) with ${created} local filter(s)`);
      } else {
        // Append: create local filters that don't exist remotely
        let created = 0;
        for (const lf of localFilters) {
          const payload = toGmailFilter(lf, this.labels);
          await api.createFilter(payload);
          created++;
        }
        toast.success(`Pushed ${created} filter(s) to Gmail (appended)`);
      }
    } catch (err) {
      toast.error(`Push failed: ${(err as Error).message}`);
    } finally {
      this.syncing = false;
      this.render();
    }
  }

  private showPushConfirm(count: number): Promise<'replace' | 'append' | null> {
    return new Promise(resolve => {
      const dialog = document.createElement('dialog');
      dialog.className = 'gmail-dialog';
      dialog.innerHTML = `
        <div class="gmail-dialog__content">
          <h3>Push ${count} filter(s) to Gmail</h3>
          <p>How should existing Gmail filters be handled?</p>
          <div class="gmail-dialog__actions">
            <button class="btn btn--danger" data-action="replace">Replace all remote filters</button>
            <button class="btn btn--primary" data-action="append">Append (keep existing)</button>
            <button class="btn btn--ghost" data-action="cancel">Cancel</button>
          </div>
        </div>`;
      document.body.appendChild(dialog);
      dialog.showModal();

      dialog.addEventListener('click', (e: Event) => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        dialog.close();
        dialog.remove();
        if (action === 'replace' || action === 'append') resolve(action);
        else resolve(null);
      });

      dialog.addEventListener('close', () => {
        dialog.remove();
        resolve(null);
      });
    });
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
