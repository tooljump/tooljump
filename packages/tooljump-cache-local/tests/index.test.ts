import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalCache } from '../src/index';

function createMockLogger() {
  const debug = vi.fn();
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const child = vi.fn(() => ({ debug, info, warn, error, child }));
  const logger = { debug, info, warn, error, child } as any;
  return { logger, child, debug, info, warn, error };
}

describe('LocalCache', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with given size and logs', async () => {
    const { logger, child, debug } = createMockLogger();
    const cache = new LocalCache({ logger, size: 5 });
    expect(cache).toBeTruthy();

    const childLogger = child.mock.results[0].value;
    expect(childLogger.debug).toHaveBeenCalled();
    const [ctx, message] = childLogger.debug.mock.calls[0];
    expect(ctx.operation).toBe('initialize');
    expect(ctx.size).toBe(5);
    expect(message).toContain('initialized');
  });

  it('set stores value with TTL (seconds) and get returns hit then miss after expiry', async () => {
    const { logger, child } = createMockLogger();
    // Use real timers; wait for TTL to expire in real time
    vi.useRealTimers();

    const cache = new LocalCache({ logger, size: 10 });

    await cache.set('k', 'v', 1); // 1 second TTL -> 1000ms
    // Assert set log
    {
      const childLogger = child.mock.results[0].value;
      const call = childLogger.debug.mock.calls.find((c: any[]) => c[0]?.operation === 'set');
      expect(call).toBeTruthy();
      const [ctx, message] = call!;
      expect(ctx.key).toBe('k');
      expect(ctx.ttl).toBe(1);
      expect(message).toContain('TTL: 1s');
    }

    const hit1 = await cache.get('k');
    expect(hit1).toBe('v');
    {
      const childLogger = child.mock.results[0].value;
      const call = childLogger.debug.mock.calls.find((c: any[]) => c[0]?.operation === 'get' && c[0]?.key === 'k');
      expect(call).toBeTruthy();
      const [ctx, message] = call!;
      expect(ctx.hit).toBe(true);
      expect(message).toContain('hit');
    }

    // Wait past TTL to ensure expiry
    await new Promise((r) => setTimeout(r, 1100));
    const miss = await cache.get('k');
    expect(miss).toBeUndefined();
    {
      const childLogger = child.mock.results[0].value;
      const calls = childLogger.debug.mock.calls.filter((c: any[]) => c[0]?.operation === 'get' && c[0]?.key === 'k');
      const last = calls[calls.length - 1];
      const [ctx2, message2] = last;
      expect(ctx2.hit).toBe(false);
      expect(message2).toContain('miss');
    }
  });

  it('clear empties cache and logs itemsCleared', async () => {
    const { logger, child } = createMockLogger();
    const cache = new LocalCache({ logger, size: 10 });
    await cache.set('a', 1, 60);
    await cache.set('b', 2, 60);

    await cache.clear();

    const childLogger = child.mock.results[0].value;
    const infoCall = childLogger.info.mock.calls.find((c: any[]) => c[0]?.operation === 'clear');
    expect(infoCall).toBeTruthy();
    const [ctx, message] = infoCall!;
    expect(ctx.itemsCleared).toBe(2);
    expect(message).toContain('Cache cleared');

    // Confirm actually cleared
    const valA = await cache.get('a');
    const valB = await cache.get('b');
    expect(valA).toBeUndefined();
    expect(valB).toBeUndefined();
  });
});
