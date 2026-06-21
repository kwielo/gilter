/**
 * Minimal component base class for vanilla TS.
 *
 * Not a framework — just a thin wrapper that standardises:
 *   - Root element creation
 *   - Declarative event binding via `this.listen()`
 *   - Event bus subscription via `this.subscribe()`
 *   - Cleanup via `destroy()`
 *
 * Each component owns its root element and manages its own DOM subtree.
 */

import { on } from '../store/event-bus';

type TeardownFn = () => void;

export abstract class Component {
  readonly el: HTMLElement;
  private teardown: TeardownFn[] = [];

  constructor(tag: string, className?: string, parent?: HTMLElement) {
    this.el = document.createElement(tag);
    if (className) this.el.className = className;
    if (parent) parent.appendChild(this.el);
  }

  /** Bind a DOM event listener with automatic cleanup. */
  protected listen<K extends keyof HTMLElementEventMap>(
    target: EventTarget,
    event: K | string,
    handler: (e: Event) => void,
    opts?: AddEventListenerOptions,
  ): this {
    target.addEventListener(event, handler, opts);
    this.teardown.push(() => target.removeEventListener(event, handler, opts));
    return this;
  }

  /** Subscribe to the app event bus with automatic cleanup. */
  protected subscribe<T = unknown>(event: string, handler: (data: T) => void): this {
    this.teardown.push(on(event, handler));
    return this;
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.el);
  }

  destroy(): void {
    for (const fn of this.teardown) fn();
    this.teardown = [];
    this.el.remove();
  }
}
