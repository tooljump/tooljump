import { describe, it, expect, vi } from 'vitest';
import { HasLogger } from '../src/HasLogger';
import { Auth } from '../src/Auth';
import { Cache } from '../src/Cache';
import { Secrets } from '../src/Secrets';

function createMockLogger() {
  const debug = vi.fn();
  const info = vi.fn();
  const warn = vi.fn();
  const error = vi.fn();
  const child = vi.fn(() => ({ debug, info, warn, error, child }));
  const logger = { debug, info, warn, error, child } as any;
  return { logger, debug, info, warn, error, child };
}

describe('Base classes', () => {
  it('HasLogger sets child component name', () => {
    const { logger, child } = createMockLogger();
    class X extends HasLogger { constructor() { super(logger); } }
    const x = new X();
    expect(child).toHaveBeenCalled();
    const [ctx] = child.mock.calls[0];
    expect(ctx.component).toBe('x');
  });

  it('Auth subclass can be constructed and middleware abstract is callable', async () => {
    const { logger } = createMockLogger();
    class A extends Auth { async middleware() {} }
    const a = new A(logger);
    expect(a).toBeTruthy();
    await a.middleware({}, {}, () => {});
  });

  it('Cache subclass can be constructed and methods can be defined', async () => {
    const { logger } = createMockLogger();
    class C extends Cache { async get() { return 1; } async set() {} async clear() {} }
    const c = new C(logger);
    expect(await c.get('k')).toBe(1);
  });

  it('Secrets.getSecretsForIntegration returns secrets and throws on missing', async () => {
    const { logger } = createMockLogger();
    class S extends Secrets { get(k:string){ return this[k as any]; } async load(){} foo='x'; }
    const s = new S(logger);
    const integration = { id:'i', code:'', metadata: { name:'nameok', match:{ contextType:'github', context:{} }, cache:10, requiredSecrets:['foo'], priority:100 } } as any;
    const map = await s.getSecretsForIntegration(integration);
    expect(map.foo).toBe('x');

    const integration2 = { id:'i', code:'', metadata: { name:'nameok', match:{ contextType:'github', context:{} }, cache:10, requiredSecrets:['missing'], priority:100 } } as any;
    await expect(s.getSecretsForIntegration(integration2)).rejects.toThrow('undefined');
  });
});
