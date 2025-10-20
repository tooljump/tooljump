import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import * as fsp from 'fs/promises';
import { FsIntegrations } from '../src/index';
import { DEFAULT_CONFIG, Integration, metadataSchema } from '@tooljump/common';

function createMockLogger() {
  const debug = vi.fn();
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const child = vi.fn(() => ({ debug, info, warn, error, child }));
  const logger = { debug, info, warn, error, child } as any;
  return { logger, debug, info, warn, error, child };
}

function createMockRunner(metaByFile: Record<string, any>) {
  return {
    getMetadata: vi.fn(async (_code: string, filePath?: string) => {
      const base = path.basename(filePath || '');
      const meta = metaByFile[base];
      if (!meta) throw new Error('No metadata for file ' + base);
      return meta;
    })
  } as any;
}

const createdDirs: string[] = [];

async function setupDir(files: Record<string, string>): Promise<string> {
  const root = path.join(process.cwd(), 'tests', `fs-fixtures-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await fs.mkdir(root, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    const fp = path.join(root, name);
    await fs.writeFile(fp, content, 'utf-8');
  }
  createdDirs.push(root);
  return root;
}

afterAll(async () => {
  // Best-effort cleanup of any temp directories created during tests
  await Promise.all(
    createdDirs.map(async (dir) => {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    })
  );
});

describe('FsIntegrations - load files and caching', () => {
  it('loads valid integration and data files, clears cache, and logs counts', async () => {
    const dir = await setupDir({
      'ok.integration.js': '/* code */',
      'data1.data.yml': 'a: 1',
      'data2.data.json': '{"b":2}'
    });
    const { logger, info, debug, warn } = createMockLogger();

    const metaValid = {
      name: 'fsok1',
      match: { contextType: 'github', context: {} },
      cache: 10,
      requiredSecrets: [],
      priority: 150
    } satisfies ReturnType<typeof metadataSchema['parse']> as any;

    const runner = createMockRunner({ 'ok.integration.js': metaValid });
    const cache = { clear: vi.fn(async () => {}) } as any;
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, cache, config: DEFAULT_CONFIG });
    await svc.load(runner);

    const integrations = await svc.getIntegrations();
    expect(integrations).toHaveLength(1);
    const dataFiles = await svc.getDataFiles();
    expect(dataFiles).toHaveLength(2);
    expect(cache.clear).toHaveBeenCalledTimes(1);

    // Info log about loaded counts
    expect(info).toHaveBeenCalled();
    const loadInfo = info.mock.calls.find((c: any[]) => c[0]?.operation === 'load-files');
    expect(loadInfo).toBeTruthy();
    expect(loadInfo![0].integrationsLoaded).toBe(1);
    expect(loadInfo![0].dataFilesLoaded).toBe(2);
  });
});

describe('FsIntegrations - integration metadata validation', () => {
  it('skips integration when schema validation fails', async () => {
    const dir = await setupDir({ 'bad.integration.js': '/* code */' });
    const { logger, warn } = createMockLogger();
    // Invalid: name does not match regex (starts with digit)
    const badMeta = { name: '1bad', match: { contextType: 'github', context: {} }, cache: 10, requiredSecrets: [] } as any;
    const runner = createMockRunner({ 'bad.integration.js': badMeta });
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    await svc.load(runner);
    const integrations = await svc.getIntegrations();
    expect(integrations).toHaveLength(0);
    const warnCall = warn.mock.calls.find((c: any[]) => c[0]?.operation === 'load-integration' && c[0]?.issue === 'schema-validation-failed');
    expect(warnCall).toBeTruthy();
  });

  it('skips integration when contextType not allowed', async () => {
    const dir = await setupDir({ 'na.integration.js': '/* code */' });
    const { logger, warn } = createMockLogger();
    const naMeta = { name: 'fsna1', match: { contextType: 'notallowed', context: {} }, cache: 10, requiredSecrets: [] } as any;
    const runner = createMockRunner({ 'na.integration.js': naMeta });
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    await svc.load(runner);
    const integrations = await svc.getIntegrations();
    expect(integrations).toHaveLength(0);
    const warnCall = warn.mock.calls.find((c: any[]) => c[0]?.issue === 'context-type-not-allowed');
    expect(warnCall).toBeTruthy();
  });

  it('enforces generic context url presence and validity', async () => {
    const dir = await setupDir({ 'gen.integration.js': '/* code */' });
    const { logger, warn } = createMockLogger();
    // Missing url in generic context
    const metaMissingUrl = { name: 'genok1', match: { contextType: 'generic', context: {} }, cache: 10 } as any;
    const runner = createMockRunner({ 'gen.integration.js': metaMissingUrl });
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    await svc.load(runner);
    const integrations = await svc.getIntegrations();
    expect(integrations).toHaveLength(0);
    const warnCall = warn.mock.calls.find((c: any[]) => c[0]?.issue === 'schema-validation-failed');
    expect(warnCall).toBeTruthy();
  });
});

describe('FsIntegrations - data files parsing', () => {
  it('parses YAML and JSON data files', async () => {
    const dir = await setupDir({ 
      'test.integration.js': '/* code */',
      'x.data.yml': 'k: v', 
      'y.data.json': '{"n":3}' 
    });
    const { logger } = createMockLogger();
    const meta = { name: 'okok1', match: { contextType: 'github', context: {} }, cache: 10 } as any;
    const runner = createMockRunner({ 'test.integration.js': meta });
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    // includes integration file to satisfy new requirement
    await (svc as any).loadFiles();
    const dataFiles = await svc.getDataFiles();
    expect(dataFiles.map(d => d.id).sort()).toEqual(['x', 'y']);
    const x = await svc.getDataFileById('x');
    const y = await svc.getDataFileById('y');
    expect(x!.data).toEqual({ k: 'v' });
    expect(y!.data).toEqual({ n: 3 });
  });

  it('logs warn and skips invalid JSON', async () => {
    const dir = await setupDir({ 
      'test.integration.js': '/* code */',
      'bad.data.json': '{not-json}' 
    });
    const { logger, warn } = createMockLogger();
    const meta = { name: 'test1', match: { contextType: 'github', context: {} }, cache: 10 } as any;
    const runner = createMockRunner({ 'test.integration.js': meta });
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    await (svc as any).loadFiles();
    const dataFiles = await svc.getDataFiles();
    expect(dataFiles).toHaveLength(0);
    const warnCall = warn.mock.calls.find((c: any[]) => c[0]?.operation === 'load-data-file');
    expect(warnCall).toBeTruthy();
  });
});

describe('FsIntegrations - path validation via safePath', () => {
  it('rejects traversal, absolute, invalid extension, and multiple slashes', async () => {
    const dir = await setupDir({});
    const { logger, warn, debug } = createMockLogger();
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });

    // traversal
    const p1 = await (svc as any).safePath('../evil.integration.js');
    expect(p1).toBeNull();
    // encoded traversal variants
    const p1b = await (svc as any).safePath('..%2Fevil.integration.js');
    expect(p1b).toBeNull();
    const p1c = await (svc as any).safePath('..%5Cevil.integration.js');
    expect(p1c).toBeNull();
    // absolute
    const p2 = await (svc as any).safePath(path.sep + 'abs.integration.js');
    expect(p2).toBeNull();
    // invalid extension
    const p3 = await (svc as any).safePath('file.txt');
    expect(p3).toBeNull();
    // multiple slashes
    const p4 = await (svc as any).safePath('a//b.integration.js');
    expect(p4).toBeNull();
  });

  it('accepts valid file and still succeeds if realpath fails', async () => {
    const dir = await setupDir({});
    const { logger, debug } = createMockLogger();
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    // File does not exist so realpath will fail naturally
    const p = await (svc as any).safePath('missing.integration.js');
    expect(p).toBe(path.join(dir, 'missing.integration.js'));
    const dbg = debug.mock.calls.find((c: any[]) => c[0]?.operation === 'validate-path' && c[0]?.issue === 'realpath-failed');
    expect(dbg).toBeTruthy();
  });

  it('accepts valid .data.yml and .data.json paths', async () => {
    const dir = await setupDir({});
    const { logger } = createMockLogger();
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    const pYaml = await (svc as any).safePath('good.data.yml');
    expect(pYaml).toBe(path.join(dir, 'good.data.yml'));
    const pJson = await (svc as any).safePath('good.data.json');
    expect(pJson).toBe(path.join(dir, 'good.data.json'));
  });
});

describe('FsIntegrations - getIntegrationsByContext filtering and sorting', () => {
  it('returns [] and logs when context.url missing', async () => {
    const dir = await setupDir({});
    const { logger, debug } = createMockLogger();
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    const out = await svc.getIntegrationsByContext({});
    expect(out).toEqual([]);
    const call = debug.mock.calls.find((c: any[]) => c[0]?.issue === 'missing-context-url');
    expect(call).toBeTruthy();
  });

  it('filters by contextType and validates rules; sorts by priority desc', async () => {
    const dir = await setupDir({
      'a.integration.js': '/* a */',
      'b.integration.js': '/* b */'
    });
    const { logger } = createMockLogger();
    const metaA = { name: 'intaa', match: { contextType: 'github', context: { 'env': { equals: 'prod' } } }, priority: 50, cache: 10 } as any;
    const metaB = { name: 'intbb', match: { contextType: '*', context: { 'env': { in: ['dev', 'prod'] } } }, priority: 200, cache: 10 } as any;
    const runner = createMockRunner({ 'a.integration.js': metaA, 'b.integration.js': metaB });
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    await svc.load(runner);

    const out = await svc.getIntegrationsByContext({ url: 'https://github.com/x', type: 'github', env: 'prod' });
    // Both valid; metaB has higher priority
    expect(out.map(o => o.metadata.name)).toEqual(['intbb', 'intaa']);

    const out2 = await svc.getIntegrationsByContext({ url: 'https://example.com', type: 'other', env: 'prod' });
    // contextType check will drop A (github) and B '*' matches contextType but rules still match, so only B
    expect(out2.map(o => o.metadata.name)).toEqual(['intbb']);
  });

  it('skips integrations with invalid metadata at runtime', async () => {
    const dir = await setupDir({});
    const { logger, error } = createMockLogger();
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: false, config: DEFAULT_CONFIG });
    // Inject an invalid integration (no metadata.match)
    (svc as any).integrations = [
      { id: 'bad', code: '', metadata: {} as any }
    ];
    const out = await svc.getIntegrationsByContext({ url: 'https://x', type: 'github' });
    expect(out).toEqual([]);
    const err = error.mock.calls.find((c: any[]) => c[0]?.issue === 'invalid-metadata-at-runtime');
    expect(err).toBeTruthy();
  });
});

describe('FsIntegrations - watch lifecycle', () => {
  it('starts and stops watching when enabled', async () => {
    const dir = await setupDir({ 'test.integration.js': '/* code */' });
    const { logger, info } = createMockLogger();
    const meta = { name: 'test1', match: { contextType: 'github', context: {} }, cache: 10 } as any;
    const runner = createMockRunner({ 'test.integration.js': meta });
    const svc = new FsIntegrations({ logger, path: dir, watchFiles: true, config: DEFAULT_CONFIG });
    await svc.load(runner);
    // Started watching
    const start = info.mock.calls.find((c: any[]) => c[0]?.operation === 'start-watching');
    expect(start).toBeTruthy();
    svc.stopWatching();
    const stop = info.mock.calls.find((c: any[]) => c[0]?.operation === 'stop-watching');
    expect(stop).toBeTruthy();
  });
});
