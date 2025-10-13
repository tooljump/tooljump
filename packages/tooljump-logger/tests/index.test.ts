import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WinstonLogger, LoggerFactory } from '../src';

function createFakeWinston() {
  const log = vi.fn();
  return { log } as any;
}

describe('WinstonLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs with string-first args and default context', () => {
    const fake = createFakeWinston();
    const wl = new WinstonLogger(fake, { component: 'root' }, () => 'cid-123');

    wl.info('hello', { a: 1 }, true);

    expect(fake.log).toHaveBeenCalledTimes(1);
    const call = (fake.log as any).mock.calls[0][0];
    expect(call.level).toBe('info');
    expect(call.message).toBe('hello {"a":1} true');
    expect(call.component).toBe('root');
    expect(call.correlationId).toBe('cid-123');
    expect(call.timestamp).toBeTruthy();
  });

  it('logs with object-first args and merges context', () => {
    const fake = createFakeWinston();
    const wl = new WinstonLogger(fake, { component: 'root', base: 'x' }, () => 'cid-xyz');

    wl.warn({ operation: 'op' }, 'done');

    const call = (fake.log as any).mock.calls[0][0];
    expect(call.level).toBe('warn');
    expect(call.message).toBe('done');
    expect(call.component).toBe('root');
    expect(call.base).toBe('x');
    expect(call.operation).toBe('op');
    expect(call.correlationId).toBe('cid-xyz');
  });

  it('extracts Error for error level (string-first)', () => {
    const fake = createFakeWinston();
    const wl = new WinstonLogger(fake, {}, () => 'cid-e');
    const err = new Error('boom');

    wl.error('failed to save', err);

    const call = (fake.log as any).mock.calls[0][0];
    expect(call.level).toBe('error');
    expect(call.message).toBe('failed to save');
    expect(call.error).toBeTruthy();
    expect(call.error.message).toBe('boom');
    expect(call.correlationId).toBe('cid-e');
  });

  it('respects provided correlationId in object-first usage', () => {
    const fake = createFakeWinston();
    const wl = new WinstonLogger(fake, {}, () => 'cid-generated');

    wl.info({ correlationId: 'cid-provided', k: 1 }, 'msg');

    const call = (fake.log as any).mock.calls[0][0];
    expect(call.correlationId).toBe('cid-provided');
    expect(call.k).toBe(1);
  });

  it('creates child with merged default context', () => {
    const fake = createFakeWinston();
    const wl = new WinstonLogger(fake, { component: 'root' });
    const child = wl.child({ component: 'child', extra: 'y' });

    child.debug('ok');

    const call = (fake.log as any).mock.calls[0][0];
    expect(call.level).toBe('debug');
    expect(call.message).toBe('ok');
    expect(call.component).toBe('child');
    expect(call.extra).toBe('y');
  });

  it('object-first error with explicit Error param attaches error', () => {
    const fake = createFakeWinston();
    const wl = new WinstonLogger(fake, { component: 'svc' });
    const err = new Error('kaput');
    wl.error({ operation: 'op1' }, 'failed op', err);
    const call = (fake.log as any).mock.calls[0][0];
    expect(call.level).toBe('error');
    expect(call.operation).toBe('op1');
    expect(call.message).toBe('failed op');
    expect(call.error?.message).toBe('kaput');
  });

  it('fallback path treats non-plain-object first arg as message', () => {
    const fake = createFakeWinston();
    const wl = new WinstonLogger(fake, {});
    wl.info(new Map([["k","v"]]));
    const call = (fake.log as any).mock.calls[0][0];
    expect(call.message).toBe('{}');
  });
});

describe('Logger factories', () => {
  it('createConsoleLogger returns logger that logs via underlying winston logger', async () => {
    vi.resetModules();
    vi.doMock('winston', () => {
      const state: any = { lastLogger: null };
      const mod = {
        default: {
          createLogger: () => (state.lastLogger = { log: vi.fn() }),
          transports: { Console: vi.fn(() => ({})) },
          format: {
            combine: () => ({}),
            timestamp: () => ({}),
            errors: () => ({}),
            colorize: () => ({}),
            printf: (f: any) => f,
          },
          __state: state,
        },
      } as any;
      return mod;
    });
    const { createConsoleLogger } = await import('../src/winston-logger');
    const { default: winston } = await import('winston');
    const logger = createConsoleLogger('debug');
    logger.debug('hello');
    expect((winston as any).__state.lastLogger.log).toHaveBeenCalled();
  });

  it('createJsonLogger works and logs', async () => {
    vi.resetModules();
    vi.doMock('winston', () => {
      const state: any = { lastLogger: null };
      return {
        default: {
          createLogger: () => (state.lastLogger = { log: vi.fn() }),
          transports: { Console: vi.fn(() => ({})) },
          format: { combine: () => ({}), timestamp: () => ({}), errors: () => ({}), json: () => ({}) },
          __state: state,
        },
      } as any;
    });
    const { createJsonLogger } = await import('../src/winston-logger');
    const { default: winston } = await import('winston');
    const logger = createJsonLogger('info');
    logger.info('ok');
    expect((winston as any).__state.lastLogger.log).toHaveBeenCalled();
  });

  it('createFileLogger works and logs', async () => {
    vi.resetModules();
    vi.doMock('winston', () => {
      const state: any = { lastLogger: null };
      return {
        default: {
          createLogger: () => (state.lastLogger = { log: vi.fn() }),
          transports: { File: vi.fn(() => ({})) },
          format: { combine: () => ({}), timestamp: () => ({}), errors: () => ({}), json: () => ({}) },
          __state: state,
        },
      } as any;
    });
    const { createFileLogger } = await import('../src/winston-logger');
    const { default: winston } = await import('winston');
    const logger = createFileLogger('out.log', 'info');
    logger.info('file');
    expect((winston as any).__state.lastLogger.log).toHaveBeenCalled();
  });
});

describe('LoggerFactory', () => {
  beforeEach(() => {
    LoggerFactory.reset();
    vi.restoreAllMocks();
  });

  function makeFakeRootLogger() {
    const debug = vi.fn();
    const info = vi.fn();
    const warn = vi.fn();
    const error = vi.fn();
    const child = vi.fn(() => ({ debug, info, warn, error, child }));
    const logger = { debug, info, warn, error, child } as any;
    return { logger, debug, info, warn, error, child };
  }

  it('auto-initializes and caches component loggers', () => {
    const { logger, child } = makeFakeRootLogger();

    // Override initialize to use fake root logger without constructing a real Winston logger
    const initSpy = vi.spyOn(LoggerFactory, 'initialize').mockImplementation(((l?: any) => {
      (LoggerFactory as any).instance = l ?? logger;
      (LoggerFactory as any).componentLoggers = new Map();
      return (LoggerFactory as any).instance;
    }) as any);

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const a1 = LoggerFactory.getLogger('compA');
    expect(child).toHaveBeenCalledWith({ component: 'compA' });

    const a2 = LoggerFactory.getLogger('compA');
    expect(child).toHaveBeenCalledTimes(1); // cached

    const b = LoggerFactory.getLogger('compB');
    expect(child).toHaveBeenCalledTimes(2);

    expect(warnSpy).toHaveBeenCalled(); // auto-init path
    initSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('createSimpleLogger routes to underlying logger with integration context', () => {
    const { logger, info, debug, warn, error } = makeFakeRootLogger();
    LoggerFactory.initialize(logger);

    const simple = LoggerFactory.createSimpleLogger('myint');

    simple('hello', 123);
    expect(info).toHaveBeenCalled();
    const [ctx1, msg1] = (info as any).mock.calls[0];
    expect(ctx1.component).toBe('integration');
    expect(ctx1.integrationName).toBe('myint');
    expect(msg1).toBe('hello 123');

    simple.debug({ operation: 'op' }, 'dbg');
    const [ctx2, msg2] = (debug as any).mock.calls[0];
    expect(ctx2.component).toBe('integration');
    expect(ctx2.integrationName).toBe('myint');
    expect(ctx2.operation).toBe('op');
    expect(msg2).toBe('dbg');

    const err = new Error('bad');
    simple.error({ step: 'x' }, 'oops', err);
    const [ctx3, msg3, e3] = (error as any).mock.calls[0];
    expect(ctx3.step).toBe('x');
    expect(msg3).toBe('oops');
    expect(e3.message).toBe('bad');
  });
});
