import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { DEFAULT_CONFIG } from '@tooljump/common';

// Track temp dirs for cleanup
const createdDirs: string[] = [];

async function makeTempDir(prefix = 'gh-int-tests-') {
  const base = path.join(process.cwd(), 'packages', 'tooljump-integrations-github', 'tests', `${prefix}${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await fs.mkdir(base, { recursive: true });
  createdDirs.push(base);
  return base;
}

afterAll(async () => {
  await Promise.all(createdDirs.map(async (d) => {
    try { await fs.rm(d, { recursive: true, force: true }); } catch {}
  }));
});

// Import SUT
import { GithubIntegrations } from '../src/index';

function createMockLogger() {
  const debug = vi.fn();
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const child = vi.fn(() => ({ debug, info, warn, error, child }));
  const logger = { debug, info, warn, error, child } as any;
  return { logger, debug, info, warn, error, child };
}

function createRunner(metaByBaseName: Record<string, any> = {}) {
  return {
    getMetadata: vi.fn(async (_code: string, filePath?: string) => {
      const name = filePath ? path.basename(filePath) : '';
      return (
        metaByBaseName[name] || {
          name: 'ghok1',
          match: { contextType: 'github', context: {} },
          cache: 60,
          requiredSecrets: [],
          priority: 100,
        }
      );
    }),
  } as any;
}

describe('GithubIntegrations - constructor validation', () => {
  it('throws when accessToken missing', () => {
    const { logger } = createMockLogger();
    expect(() => new GithubIntegrations({ logger, accessToken: '' as any, repoUrl: 'https://github.com/x/y', config: DEFAULT_CONFIG })).toThrow('GitHub access token is required');
  });

  it('throws when repoUrl missing', () => {
    const { logger } = createMockLogger();
    expect(() => new GithubIntegrations({ logger, accessToken: 't', repoUrl: '' as any, config: DEFAULT_CONFIG })).toThrow('Repository URL is required');
  });

  it('throws when watchInterval <= 0', () => {
    const { logger } = createMockLogger();
    expect(() => new GithubIntegrations({ logger, accessToken: 't', repoUrl: 'https://github.com/x/y', watchInterval: -1, config: DEFAULT_CONFIG })).toThrow('Watch interval must be greater than 0 seconds');
  });

  it('throws when tempDir not writable or missing', () => {
    const { logger } = createMockLogger();
    const badPath = path.join(process.cwd(), 'packages', 'tooljump-integrations-github', 'tests', 'nonexistent-dir', 'nope');
    expect(() => new GithubIntegrations({ logger, accessToken: 't', repoUrl: 'https://github.com/x/y', tempDir: badPath, config: DEFAULT_CONFIG })).toThrow('not writable');
  });
});

describe('GithubIntegrations - load flow and proxies', () => {
  it('clones repo, loads via FsIntegrations, and exposes data', async () => {
    const base = await makeTempDir('base-');
    const { logger, info } = createMockLogger();
    const gh = new GithubIntegrations({ logger, accessToken: 'token-123', repoUrl: 'https://github.com/u/r', repoPath: '', tempDir: base, enableWatching: false, config: DEFAULT_CONFIG });
    const runner = createRunner({});

    // Stub cloneRepository to avoid network and create expected files
    const cloneStub = vi.spyOn(gh as any, 'cloneRepository').mockImplementation(async () => {
      const dir = (gh as any).tempDir; // base/repo/<repoPath>
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'sample.integration.js'), '/* code */', 'utf-8');
      await fs.writeFile(path.join(dir, 'data1.data.yml'), 'a: 1', 'utf-8');
      await fs.writeFile(path.join(dir, 'data2.data.json'), '{"b":2}', 'utf-8');
    });

    await gh.load(runner);

    // integrations and data loaded through fs
    const integrations = await gh.getIntegrations();
    const dataFiles = await gh.getDataFiles();
    expect(integrations.length).toBe(1);
    expect(dataFiles.length).toBeGreaterThanOrEqual(2);

    cloneStub.mockRestore();
  });
});

describe('GithubIntegrations - watching and reload', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts watcher, schedules interval, and executes pull + reload callback', async () => {
    const base = await makeTempDir('watch-');
    const { logger, info, debug, error } = createMockLogger();
    const gh = new GithubIntegrations({ logger, accessToken: 'token-xyz', repoUrl: 'https://github.com/u/r', repoPath: '', tempDir: base, enableWatching: true, watchInterval: 1, config: DEFAULT_CONFIG });
    const runner = createRunner({});
    const cloneStub = vi.spyOn(gh as any, 'cloneRepository').mockImplementation(async () => {
      const dir = (gh as any).tempDir;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'sample.integration.js'), '/* code */', 'utf-8');
    });
    const pullStub = vi.spyOn(gh as any, 'pullRepository').mockImplementation(async () => {
      const dir = path.join((gh as any).baseTempDir, 'repo');
      await fs.writeFile(path.join(dir, 'pulled.data.json'), '{"pulled":true}', 'utf-8');
    });
    // Override reloadIntegrations before starting watcher so interval uses this function
    const reloadStub = vi.fn(async () => {});
    (gh as any).reloadIntegrations = reloadStub;

    // Capture interval callback
    let scheduled: (() => Promise<void> | void) | null = null;
    const si = vi.spyOn(globalThis, 'setInterval').mockImplementation(((fn: any, ms: any) => {
      scheduled = fn as any;
      return 1 as unknown as NodeJS.Timeout;
    }) as any);

    await gh.load(runner);

    expect(si).toHaveBeenCalled();
    expect(scheduled).toBeTruthy();

    await (scheduled as any)();

    expect(pullStub).toHaveBeenCalled();
    expect(reloadStub).toHaveBeenCalled();

    gh.stopWatching();
    const stop = info.mock.calls.find((c: any[]) => c[0]?.operation === 'stop-watching');
    expect(stop).toBeTruthy();
    cloneStub.mockRestore();
    pullStub.mockRestore();
    si.mockRestore();
    // no need to restore overridden instance method
  });

  it('logs and continues when scheduled pull fails', async () => {
    const base = await makeTempDir('watch-err-');
    const { logger, error } = createMockLogger();
    const gh = new GithubIntegrations({ logger, accessToken: 'token-xyz2', repoUrl: 'https://github.com/u/r', repoPath: '', tempDir: base, enableWatching: true, watchInterval: 1, config: DEFAULT_CONFIG });
    const runner = createRunner({});
    const cloneStub = vi.spyOn(gh as any, 'cloneRepository').mockImplementation(async () => {
      const dir = (gh as any).tempDir;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(path.join(dir, 'sample.integration.js'), '/* code */', 'utf-8');
    });
    const pullStub = vi.spyOn(gh as any, 'pullRepository');
    pullStub.mockRejectedValueOnce(new Error('pull failed'));
    pullStub.mockResolvedValueOnce();
    // Capture interval callback
    let scheduled: (() => Promise<void> | void) | null = null;
    const si = vi.spyOn(globalThis, 'setInterval').mockImplementation(((fn: any, ms: any) => {
      scheduled = fn as any;
      return 1 as unknown as NodeJS.Timeout;
    }) as any);

    await gh.load(runner);

    expect(si).toHaveBeenCalled();
    expect(scheduled).toBeTruthy();

    // First invocation will throw (mockRejectedValueOnce)
    await (scheduled as any)();

    const errCall = error.mock.calls.find((c: any[]) => c[0]?.operation === 'scheduled-pull');
    expect(errCall).toBeTruthy();

    gh.stopWatching();
    cloneStub.mockRestore();
    pullStub.mockRestore();
    si.mockRestore();
  });
});

describe('GithubIntegrations - error handling', () => {
  it('propagates errors when clone fails during load', async () => {
    const base = await makeTempDir('err-');
    const { logger } = createMockLogger();
    const gh = new GithubIntegrations({ logger, accessToken: 'token-err', repoUrl: 'https://github.com/u/r', tempDir: base, config: DEFAULT_CONFIG });
    const runner = createRunner({});

    // Force clone to fail
    const cloneStub = vi.spyOn(gh as any, 'cloneRepository').mockRejectedValueOnce(new Error('clone failed'));

    await expect(gh.load(runner)).rejects.toThrow('clone failed');
    cloneStub.mockRestore();
  });
});
