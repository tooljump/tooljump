import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CollectorManager } from './manager';

declare global {
  // eslint-disable-next-line no-var
  var chrome: any;
}

function setHostname(url: string) {
  Object.defineProperty(window, 'location', {
    value: new URL(url),
    writable: true,
  });
}

function mockChrome(displayMode: string = 'integrated') {
  globalThis.chrome = {
    storage: {
      local: {
        get: vi.fn((keys: string[] | Record<string, any>, cb: Function) => {
          cb({ displayMode });
        }),
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
  };
}

describe('CollectorManager', () => {

  let mgr: CollectorManager | null = null;

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
    mgr?.stop();
  });

  it('detects GitHub context and invokes update callback with repository info', async () => {
    mockChrome('integrated');
    setHostname('https://github.com/acme/widgets');
    // Add a signal for repository collector shouldRun
    const codeTab = document.createElement('div');
    codeTab.id = 'code-tab';
    document.body.appendChild(codeTab);

    mgr = new CollectorManager();
    let received: any = null;
    mgr.start((ctx) => {
      received = ctx;
    });

    // Allow async flows to complete
    await new Promise((r) => setTimeout(r, 10));

    expect(received).toBeTruthy();
    expect(received.type).toBe('github');
    // repository collector should set page.repository
    expect(received.page?.repository).toBe('acme/widgets');
  });

  it('injectContainer uses site adapter when displayMode=integrated', async () => {
    mockChrome('integrated');
    setHostname('https://github.com/foo/bar');
    // Ensure GitHub collectors can run
    const codeTab = document.createElement('div');
    codeTab.id = 'code-tab';
    document.body.appendChild(codeTab);

    mgr = new CollectorManager();
    mgr.start();
    await new Promise((r) => setTimeout(r, 10));

    const container = document.createElement('div');
    await mgr.injectContainer(container);
    // GitHub adapter injects before first child
    expect(document.body.firstChild).toBe(container);
  });

  it('injectContainer appends to body when displayMode=floating', async () => {
    mockChrome('floating');
    setHostname('https://github.com/foo/bar');
    const codeTab = document.createElement('div');
    codeTab.id = 'code-tab';
    document.body.appendChild(codeTab);

    mgr = new CollectorManager();
    mgr.start();
    await new Promise((r) => setTimeout(r, 10));

    const container = document.createElement('div');
    await mgr.injectContainer(container);
    expect(document.body.lastChild).toBe(container);
  });

  it('revertUrlChangeDetection restores original state', () => {
    // Store original methods before creating manager
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Create a manager to set up observers
    mgr = new CollectorManager();
    
    // Verify that methods were overridden (they should be different functions now)
    expect(history.pushState).not.toBe(originalPushState);
    expect(history.replaceState).not.toBe(originalReplaceState);
    
    // Revert the setup
    mgr.revertUrlChangeDetection();
    
    // Verify that original methods are restored
    expect(history.pushState).toBe(originalPushState);
    expect(history.replaceState).toBe(originalReplaceState);
  });
});

