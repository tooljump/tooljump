import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { VMRunner } from '../src';

function createMockLogger() {
  const debug = vi.fn();
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const child = vi.fn(() => ({ debug, info, warn, error, child }));
  const logger = { debug, info, warn, error, child } as any;
  return { logger, debug, info, warn, error, child };
}

async function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function cleanupDataDir() {
  const dir = path.join(process.cwd(), 'data');
  try { await fs.rm(dir, { recursive: true, force: true }); } catch {}
}

describe('VMRunner.getMetadata and validation', () => {
  it('extracts metadata and validates presence/types of functions', async () => {
    const { logger, error, debug } = createMockLogger();
    const runner = new VMRunner({ logger });
    const code = `
      module.exports.metadata = { name: 't1', match: { contextType: 'github', context: {} } };
      module.exports.shouldRun = async () => true;
      module.exports.run = async () => [];
    `;
    const meta = await runner.getMetadata(code);
    expect(meta.name).toBe('t1');
    // should not error; should log validation passed
    expect(debug).toHaveBeenCalled();
    const call = debug.mock.calls.find((c:any[]) => c[0]?.operation === 'metadata-validation');
    expect(call).toBeTruthy();
  });

  it('throws and logs when run is missing', async () => {
    const { logger, error } = createMockLogger();
    const runner = new VMRunner({ logger });
    const code = `
      module.exports.metadata = { name: 'missrun', match: { contextType: 'github', context: {} } };
      module.exports.shouldRun = async () => true;
    `;
    await expect(runner.getMetadata(code, path.join(process.cwd(), 'data', 'missrun.integration.js'))).rejects.toThrow('missing required');
    const errCall = error.mock.calls.find((c:any[]) => c[0]?.operation === 'metadata-validation' && c[0]?.error === 'missing-run-function');
    expect(errCall).toBeTruthy();
  });

  it('throws when shouldRun is not a function', async () => {
    const { logger } = createMockLogger();
    const runner = new VMRunner({ logger });
    const code = `
      module.exports.metadata = { name: 'badshould', match: { contextType: 'github', context: {} } };
      module.exports.shouldRun = 'nope';
      module.exports.run = async () => [];
    `;
    await expect(runner.getMetadata(code, path.join(process.cwd(), 'data', 'badshould.integration.js'))).rejects.toThrow('invalid');
  });

  it('disallows relative require without filePath', async () => {
    const { logger } = createMockLogger();
    const runner = new VMRunner({ logger });
    const code = `
      const dep = require('./dep');
      module.exports.run = async () => dep;
      module.exports.metadata = { name: 'r', match: { contextType: 'github', context: {} } };
    `;
    await expect(runner.getMetadata(code)).rejects.toThrow('Relative imports are not supported');
  });

  it('allows relative require when filePath provided', async () => {
    const { logger } = createMockLogger();
    const runner = new VMRunner({ logger });
    const dir = await ensureDataDir();
    await fs.writeFile(path.join(dir, 'dep.js'), 'module.exports = { n: 5 };', 'utf-8');
    const filePath = path.join(dir, 'file.integration.js');
    const code = `
      const dep = require('./dep');
      module.exports.metadata = { name: 'ok', match: { contextType: 'github', context: {} } };
      module.exports.run = async () => dep.n;
    `;
    const meta = await runner.getMetadata(code, filePath);
    expect(meta.name).toBe('ok');
  });
});

describe('VMRunner.shouldRun', () => {
  beforeAll(async () => {
    const dir = await ensureDataDir();
    await fs.writeFile(path.join(dir, 'dep.js'), 'module.exports = { value: 7 };', 'utf-8');
  });
  afterAll(async () => {
    await cleanupDataDir();
  });

  it('evaluates shouldRun with relative require and context', async () => {
    const { logger } = createMockLogger();
    const runner = new VMRunner({ logger });
    const integration = {
      id: 'i',
      code: `
        const d = require('./dep');
        module.exports.shouldRun = async (ctx) => ctx.flag === true && d.value === 7;
        module.exports.run = async () => [];
      `,
      metadata: { name: 'testrun', match: { contextType: 'github', context: {} }, cache: 10, requiredSecrets: [], priority: 100 }
    } as any;

    const res1 = await runner.shouldRun(integration, { url: 'https://x', type: 'github', flag: true });
    expect(res1).toBe(true);
    const res2 = await runner.shouldRun(integration, { url: 'https://x', type: 'github', flag: false });
    expect(res2).toBe(false);
  });

  it('logs and returns false on error in shouldRun', async () => {
    const { logger, error } = createMockLogger();
    const runner = new VMRunner({ logger });
    const integration = {
      id: 'i',
      code: `
        module.exports.shouldRun = async () => { throw new Error('boom'); };
        module.exports.run = async () => [];
      `,
      metadata: { name: 'oops', match: { contextType: 'github', context: {} }, cache: 10, requiredSecrets: [], priority: 100 }
    } as any;

    const res = await runner.shouldRun(integration, { url: 'https://x', type: 'github' });
    expect(res).toBe(false);
    expect(error).toHaveBeenCalled();
  });
});

describe('VMRunner.run execution', () => {
  beforeAll(async () => {
    const dir = await ensureDataDir();
    await fs.writeFile(path.join(dir, 'dep.js'), 'module.exports = { value: 3 };', 'utf-8');
  });
  afterAll(async () => {
    await cleanupDataDir();
  });

  it('skips execution if shouldRun returns false', async () => {
    const { logger, debug } = createMockLogger();
    const runner = new VMRunner({ logger });
    const integration = {
      id: 'i',
      code: `
        module.exports.shouldRun = async () => false;
        module.exports.run = async () => { return ['x']; };
      `,
      metadata: { name: 'skip', match: { contextType: 'github', context: {} }, cache: 10, requiredSecrets: [], priority: 100 }
    } as any;
    const res = await runner.run(integration, { url: 'https://x', type: 'github' }, { getSecretsForIntegration: async () => ({}) } as any);
    expect(res).toEqual([]);
    const call = debug.mock.calls.find((c:any[]) => c[1]?.includes('shouldRun returned false'));
    expect(call).toBeTruthy();
  });

  it('injects secrets and dataFiles and returns result', async () => {
    const { logger } = createMockLogger();
    const runner = new VMRunner({ logger });
    const integration = {
      id: 'i',
      code: `
        module.exports.shouldRun = async () => true;
        module.exports.run = async (ctx, secrets, dataFiles) => {
          return [{ type: 'text', content: secrets.token + ':' + dataFiles.length }];
        };
      `,
      metadata: { name: 'exec', match: { contextType: 'github', context: {} }, cache: 10, requiredSecrets: [], priority: 100 }
    } as any;

    const secrets = { getSecretsForIntegration: async () => ({ token: 'abc' }) } as any;
    const dataFiles = [{ id: 'a', data: { x: 1 } }];
    const res = await runner.run(integration, { url: 'https://x', type: 'github' }, secrets, dataFiles, 5000);
    expect(res).toEqual([{ type: 'text', content: 'abc:1' }]);
  });

  it('provides global cache facade with namespacing', async () => {
    const { logger } = createMockLogger();
    const runner = new VMRunner({ logger });
    const integration = {
      id: 'i',
      code: `
        module.exports.shouldRun = async () => true;
        module.exports.run = async () => {
          await global.cache.set('k', 1, 60);
          await global.cache.get('k');
          return [];
        };
      `,
      metadata: { name: 'nsint', match: { contextType: 'github', context: {} }, cache: 10, requiredSecrets: [], priority: 100 }
    } as any;
    const get = vi.fn(async () => undefined);
    const set = vi.fn(async () => {});
    const cache = { get, set };

    await runner.run(integration, { url: 'https://x', type: 'github' }, { getSecretsForIntegration: async () => ({}) } as any, [], 5000, { globals: { cache } });
    expect(set).toHaveBeenCalledWith('i:nsint:k', 1, 60);
    expect(get).toHaveBeenCalledWith('i:nsint:k');
  });

  it('exposes fetch and built-in require in VM', async () => {
    const { logger } = createMockLogger();
    const runner = new VMRunner({ logger });
    const integration = {
      id: 'i',
      code: `
        const p = require('path');
        module.exports.shouldRun = async () => true;
        module.exports.run = async () => {
          const f = typeof fetch;
          const hasJoin = typeof p.join === 'function';
          return [f, hasJoin];
        };
      `,
      metadata: { name: 'glob', match: { contextType: 'github', context: {} }, cache: 10, requiredSecrets: [], priority: 100 }
    } as any;
    const res = await runner.run(integration, { url: 'https://x', type: 'github' }, { getSecretsForIntegration: async () => ({}) } as any);
    expect(res[0]).toBe('function');
    expect(res[1]).toBe(true);
  });

  it('times out long-running run and logs error', async () => {
    const { logger, error } = createMockLogger();
    const runner = new VMRunner({ logger });
    const integration = {
      id: 'i',
      code: `
        module.exports.shouldRun = async () => true;
        module.exports.run = async () => {
          // Never resolve; rely on outer timeout mechanism
          await new Promise(() => {});
        };
      `,
      metadata: { name: 'slow', match: { contextType: 'github', context: {} }, cache: 10, requiredSecrets: [], priority: 100 }
    } as any;
    await expect(runner.run(integration, { url: 'https://x', type: 'github' }, { getSecretsForIntegration: async () => ({}) } as any, [], 10)).rejects.toThrow('Operation timed out');
    expect(error).toHaveBeenCalled();
  });

  it('logs and throws when run raises error', async () => {
    const { logger, error } = createMockLogger();
    const runner = new VMRunner({ logger });
    const integration = {
      id: 'i',
      code: `
        module.exports.shouldRun = async () => true;
        module.exports.run = () => { throw new Error('boom'); };
      `,
      metadata: { name: 'thrower', match: { contextType: 'github', context: {} }, cache: 10, requiredSecrets: [], priority: 100 }
    } as any;
    await expect(runner.run(integration, { url: 'https://x', type: 'github' }, { getSecretsForIntegration: async () => ({}) } as any)).rejects.toThrow('boom');
    expect(error).toHaveBeenCalled();
  });
});
