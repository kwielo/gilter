/**
 * Simple toast notification system.
 *
 * Listens for TOAST events and renders auto-dismissing notifications.
 */

import { on, emit, Events } from '../store/event-bus';

interface ToastPayload {
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
}

let container: HTMLElement | null = null;

export function initToast(): void {
  container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  on<ToastPayload>(Events.TOAST, ({ message, type = 'info', duration = 3000 }) => {
    show(message, type, duration);
  });
}

function show(message: string, type: string, duration: number): void {
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.textContent = message;
  container.appendChild(el);

  requestAnimationFrame(() => el.classList.add('toast--visible'));

  setTimeout(() => {
    el.classList.remove('toast--visible');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400);
  }, duration);
}

export const toast = {
  info:    (msg: string) => emit(Events.TOAST, { message: msg, type: 'info' } satisfies ToastPayload),
  success: (msg: string) => emit(Events.TOAST, { message: msg, type: 'success' } satisfies ToastPayload),
  error:   (msg: string) => emit(Events.TOAST, { message: msg, type: 'error' } satisfies ToastPayload),
};
