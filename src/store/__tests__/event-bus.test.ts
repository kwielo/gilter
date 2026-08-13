import { describe, expect, it, vi } from 'vitest';
import { emit, Events, on } from '../event-bus';

describe('event-bus', () => {
  it('delivers events to subscribers and returns an unsubscribe function', () => {
    const received: unknown[] = [];
    const off = on<string>(Events.TOAST, (data) => received.push(data));

    emit(Events.TOAST, 'hello');
    off();
    emit(Events.TOAST, 'ignored');

    expect(received).toEqual(['hello']);
  });

  it('supports multiple listeners on the same channel', () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = on('custom', a);
    const offB = on('custom', b);

    emit('custom', 42);
    offA();
    offB();

    expect(a).toHaveBeenCalledWith(42);
    expect(b).toHaveBeenCalledWith(42);
  });

  it('is a no-op when emitting to a channel with no listeners', () => {
    expect(() => emit('nobody-home', true)).not.toThrow();
  });

  it('isolates listener errors so later listeners still run', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const later = vi.fn();
    const offBad = on('boom', () => { throw new Error('listener failed'); });
    const offLater = on('boom', later);

    emit('boom', 'payload');

    expect(later).toHaveBeenCalledWith('payload');
    expect(errorSpy).toHaveBeenCalled();
    offBad();
    offLater();
    errorSpy.mockRestore();
  });
});
