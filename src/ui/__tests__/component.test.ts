import { describe, expect, it, vi } from 'vitest';
import { Component } from '../component';
import { emit } from '../../store/event-bus';

class TestComponent extends Component {
  bindClick(target: EventTarget, handler: (e: Event) => void): void {
    this.listen(target, 'click', handler);
  }

  bindBus(event: string, handler: (data: unknown) => void): void {
    this.subscribe(event, handler);
  }
}

describe('Component', () => {
  it('creates a root element and can mount it', () => {
    const parent = document.createElement('div');
    const c = new TestComponent('section', 'widget', parent);
    expect(c.el.tagName).toBe('SECTION');
    expect(c.el.className).toBe('widget');
    expect(parent.contains(c.el)).toBe(true);

    const host = document.createElement('div');
    c.mount(host);
    expect(host.contains(c.el)).toBe(true);
  });

  it('removes DOM listeners, bus subscriptions, and the element on destroy', () => {
    const c = new TestComponent('div');
    document.body.appendChild(c.el);
    const click = vi.fn();
    const bus = vi.fn();
    c.bindClick(c.el, click);
    c.bindBus('test:event', bus);

    c.el.dispatchEvent(new Event('click'));
    emit('test:event', 1);
    expect(click).toHaveBeenCalledOnce();
    expect(bus).toHaveBeenCalledWith(1);

    c.destroy();
    expect(document.body.contains(c.el)).toBe(false);

    emit('test:event', 2);
    expect(bus).toHaveBeenCalledTimes(1);
  });
});
