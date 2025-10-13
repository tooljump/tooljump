import { describe, it, expect, vi } from 'vitest';
import { generateCacheKey, validateContextMatch } from '../src/index';

function createMockLogger() {
  const debug = vi.fn();
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const child = vi.fn(() => ({ debug, info, warn, error, child }));
  const logger = { debug, info, warn, error, child } as any;
  return { logger, debug, info, warn, error, child };
}

describe('generateCacheKey', () => {
  it('returns null when no paths provided', () => {
    const { logger } = createMockLogger();
    expect(generateCacheKey({ a: 1 }, [], logger, 'test-int')).toBeNull();
  });

  it('joins resolved values with | and warns for missing paths', () => {
    const { logger, warn } = createMockLogger();
    const ctx = { service: { name: 'api' }, version: 2 };
    const key = generateCacheKey(ctx, ['service.name', 'missing.path', 'version'], logger, 'my-int');
    expect(key).toBe('api|undefined|2');

    expect(warn).toHaveBeenCalled();
    const [callCtx] = warn.mock.calls[0];
    expect(callCtx.operation).toBe('cache-key-generation');
    expect(callCtx.integrationName).toBe('my-int');
    expect(callCtx.missingPath).toBe('missing.path');
  });
});

describe('validateContextMatch', () => {
  it('returns valid with null cacheKey when no rules', () => {
    const { logger } = createMockLogger();
    const res = validateContextMatch({ any: 'thing' }, {}, logger, 'int');
    expect(res).toEqual({ isValid: true, cacheKey: null });
  });

  it('fails exists:true when path missing and logs debug', () => {
    const { logger, debug } = createMockLogger();
    const res = validateContextMatch({}, { 'a.b': { exists: true } }, logger, 'int');
    expect(res.isValid).toBe(false);
    expect(debug).toHaveBeenCalled();
    const [ctx] = debug.mock.calls[0];
    expect(ctx.operation).toBe('context-validation');
    expect(ctx.path).toBe('a.b');
  });

  it('fails equals when value differs', () => {
    const { logger } = createMockLogger();
    const res = validateContextMatch({ env: 'prod' }, { env: { equals: 'dev' } }, logger, 'int');
    expect(res.isValid).toBe(false);
  });

  it('fails in when value not allowed', () => {
    const { logger } = createMockLogger();
    const res = validateContextMatch({ region: 'eu-west-1' }, { region: { in: ['us-east-1', 'us-west-2'] } }, logger, 'int');
    expect(res.isValid).toBe(false);
  });

  it('passes combined rules and generates cacheKey from paths order', () => {
    const { logger } = createMockLogger();
    const context = { svc: { name: 'billing' }, env: 'prod', id: 42 };
    const rules = {
      'svc.name': { pattern: /^bill/ },
      env: { in: ['prod', 'stage'] },
      id: { startsWith: undefined as any } // ignored since rule has no recognized validator
    } as any;

    const res = validateContextMatch(context, rules, logger, 'int');
    expect(res.isValid).toBe(true);
    // Paths are ['svc.name', 'env', 'id'] in insertion order
    expect(res.cacheKey).toBe('billing|prod|42');
  });

  it('validates startsWith and endsWith rules', () => {
    const { logger } = createMockLogger();
    const context = { url: 'https://example.com/path', name: 'repo.txt' };
    let res = validateContextMatch(context, { url: { startsWith: 'https://example.com' } }, logger, 'int');
    expect(res.isValid).toBe(true);
    res = validateContextMatch(context, { name: { endsWith: '.md' } }, logger, 'int');
    expect(res.isValid).toBe(false);
  });

  it('fails exists:false when path exists', () => {
    const { logger } = createMockLogger();
    const res = validateContextMatch({ feature: { flag: true } }, { 'feature.flag': { exists: false } }, logger, 'int');
    expect(res.isValid).toBe(false);
  });
});
