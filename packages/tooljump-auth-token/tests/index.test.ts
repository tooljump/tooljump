import { describe, it, expect, vi } from 'vitest';
import { TokenAuth } from '../src/index';

function createMockLogger() {
  const debug = vi.fn();
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const child = vi.fn(() => ({ debug, info, warn, error, child }));
  const logger = { debug, info, warn, error, child } as any; // conforms to @tooljump/logger Logger shape
  return { logger, debug, info, warn, error, child };
}

function createMockRes() {
  const json = vi.fn(() => undefined);
  const status = vi.fn(() => ({ status, json }));
  return { status, json } as any;
}

describe('TokenAuth constructor', () => {
  it('throws when token is missing', () => {
    const { logger, child } = createMockLogger();
    expect(() => new TokenAuth({ logger, token: undefined as any })).toThrow('Token is required');

    // Child logger is used internally
    const childLogger = child.mock.results[0].value;
    expect(childLogger.warn).toHaveBeenCalled();
    const [ctx, message] = childLogger.warn.mock.calls[0];
    expect(ctx.issue).toBe('missing-token');
    expect(message).toContain('Token is required');
  });

  it('rejects tokens shorter than 8 chars', () => {
    const { logger, child } = createMockLogger();
    expect(() => new TokenAuth({ logger, token: 'Aa1!' })).toThrow('at least 8 characters');

    const childLogger = child.mock.results[0].value;
    const [ctx, message] = childLogger.warn.mock.calls[0];
    expect(ctx.issue).toBe('too-short');
    expect(message).toContain('at least 8 characters');
  });

  it('requires at least one uppercase letter', () => {
    const { logger, child } = createMockLogger();
    expect(() => new TokenAuth({ logger, token: 'abcd1234!' })).toThrow('uppercase');

    const childLogger = child.mock.results[0].value;
    const [ctx, message] = childLogger.warn.mock.calls[0];
    expect(ctx.issue).toBe('missing-uppercase');
    expect(message).toContain('uppercase');
  });

  it('requires at least one lowercase letter', () => {
    const { logger, child } = createMockLogger();
    expect(() => new TokenAuth({ logger, token: 'ABCD1234!' })).toThrow('lowercase');

    const childLogger = child.mock.results[0].value;
    const [ctx, message] = childLogger.warn.mock.calls[0];
    expect(ctx.issue).toBe('missing-lowercase');
    expect(message).toContain('lowercase');
  });

  it('requires at least one number', () => {
    const { logger, child } = createMockLogger();
    expect(() => new TokenAuth({ logger, token: 'Abcd!Abcd' })).toThrow('number');

    const childLogger = child.mock.results[0].value;
    const [ctx, message] = childLogger.warn.mock.calls[0];
    expect(ctx.issue).toBe('missing-number');
    expect(message).toContain('number');
  });

  it('requires at least one special character', () => {
    const { logger, child } = createMockLogger();
    expect(() => new TokenAuth({ logger, token: 'Abcd1234' })).toThrow('special character');

    const childLogger = child.mock.results[0].value;
    const [ctx, message] = childLogger.warn.mock.calls[0];
    expect(ctx.issue).toBe('missing-special-char');
    expect(message).toContain('special character');
  });

  it('initializes successfully with a strong token', () => {
    const { logger, child } = createMockLogger();
    const auth = new TokenAuth({ logger, token: 'Abcd1234!' });
    expect(auth).toBeTruthy();

    const childLogger = child.mock.results[0].value;
    expect(childLogger.debug).toHaveBeenCalled();
    const [ctx, message] = childLogger.debug.mock.calls.find((c: any[]) => c[1]?.includes('initialized')) ?? childLogger.debug.mock.calls[0];
    expect(ctx.operation).toBe('initialize');
    expect(message).toContain('initialized');
  });
});

describe('TokenAuth middleware', () => {
  const validToken = 'Abcd1234!';

  it('rejects when Authorization header is missing', async () => {
    const { logger, child } = createMockLogger();
    const auth = new TokenAuth({ logger, token: validToken });
    const req = { headers: {} } as any;
    const res = createMockRes();
    const next = vi.fn();

    await auth.middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authorization header required' });
    expect(next).not.toHaveBeenCalled();

    const childLogger = child.mock.results[0].value;
    const [ctx, message] = childLogger.warn.mock.calls.find((c: any[]) => c[1]?.includes('No authorization')) ?? childLogger.warn.mock.calls[0];
    expect(ctx.issue).toBe('missing-header');
    expect(message).toContain('No authorization header');
  });

  it('rejects when header format is invalid', async () => {
    const { logger, child } = createMockLogger();
    const auth = new TokenAuth({ logger, token: validToken });
    const req = { headers: { authorization: 'Token abc' } } as any;
    const res = createMockRes();
    const next = vi.fn();

    await auth.middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid authorization header format' });
    expect(next).not.toHaveBeenCalled();

    const childLogger = child.mock.results[0].value;
    const [ctx, message] = childLogger.warn.mock.calls.find((c: any[]) => c[1]?.includes('Invalid authorization header format')) ?? childLogger.warn.mock.calls[0];
    expect(ctx.issue).toBe('invalid-format');
    expect(message).toContain('Invalid authorization header format');
  });

  it('rejects when token does not match', async () => {
    const { logger, child } = createMockLogger();
    const auth = new TokenAuth({ logger, token: validToken });
    const req = { headers: { authorization: 'Bearer wrongToken!' } } as any;
    const res = createMockRes();
    const next = vi.fn();

    await auth.middleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(next).not.toHaveBeenCalled();

    const childLogger = child.mock.results[0].value;
    const [ctx, message] = childLogger.warn.mock.calls.find((c: any[]) => c[1]?.includes('Invalid token provided')) ?? childLogger.warn.mock.calls[0];
    expect(ctx.issue).toBe('invalid-token');
    expect(message).toContain('Invalid token');
  });

  it('accepts when token matches and calls next', async () => {
    const { logger, child } = createMockLogger();
    const auth = new TokenAuth({ logger, token: validToken });
    const req = { headers: { authorization: `Bearer ${validToken}` } } as any;
    const res = createMockRes();
    const next = vi.fn();

    await auth.middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();

    const childLogger = child.mock.results[0].value;
    const [ctx, message] = childLogger.debug.mock.calls.find((c: any[]) => c[1]?.includes('authentication successful')) ?? childLogger.debug.mock.calls[0];
    expect(ctx.result).toBe('success');
    expect(message).toContain('successful');
  });
});
