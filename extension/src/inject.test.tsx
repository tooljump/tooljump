import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from './utils/utils';

declare global { var chrome: any; }

function mockServerResponse() {
  const mockedResponse = {
      "data": [
          {
              "type": "text",
              "content": "Some unique text 12340000000000()"
          }
      ],
      "count": 8,
      "cacheHits": 1,
      "failedCount": 0,
      "timestamp": "2025-09-14T17:03:12.611Z",
      "integrationNames": ["add-repos-stars"]
  };

  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => mockedResponse,
    text: async () => JSON.stringify(mockedResponse),
  });
}

function mockChrome() {
  globalThis.chrome = {
    storage: {
      local: {
        get: vi.fn((keys: any, cb: Function) => {
          // default to integrated display and no debug overlay
          cb({ displayMode: 'integrated', debugShowContext: false });
        }),
      },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  };
}

describe('inject.tsx', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
    mockChrome();
    mockServerResponse();
  });

  it('injects main bar container and overlay container when valid context emitted', async () => {
    // Simulate a GitHub repo page to make the GitHubAdapter match
    Object.defineProperty(window, 'location', { value: new URL('https://github.com/acme/widgets'), writable: true });
    // Add code-tab so the repository collector shouldRun returns true
    const codeTab = document.createElement('div');
    codeTab.id = 'code-tab';
    document.body.appendChild(codeTab);

    const mod = await import('./inject');
    await mod.injectComponents();

    // Wait for main bar container to be injected
    const main = await waitFor(() => document.querySelector('#tooljump-bar-container') as HTMLElement | null, 2000);
    expect(main).toBeTruthy();

    // Wait for overlay container to be injected
    const overlay = await waitFor(() => document.querySelector('#context-overlay-container') as HTMLElement | null, 2000);
    expect(overlay).toBeTruthy();

    // Wait for the bar to render with the mock response from the server
    const rendered = await waitFor(() => document.body.innerHTML.includes('Some unique text 12340000000000()') || undefined, 2000);
    expect(rendered).toBeTruthy();
  });

  it('injectComponents populates latest context for a GitHub URL', async () => {
    // Configure environment for GitHub
    Object.defineProperty(window, 'location', { value: new URL('https://github.com/foo/bar'), writable: true });
    const codeTab = document.createElement('div');
    codeTab.id = 'code-tab';
    document.body.appendChild(codeTab);

    const mod = await import('./inject');
    await mod.injectComponents();

    // Subscribe to contextEmitter and await first emission
    const emitted = await new Promise<any>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('timeout waiting for context emission')), 2000);
      const unsubscribe = mod.contextEmitter.subscribe((ctx: any) => {
        clearTimeout(timeout);
        unsubscribe();
        resolve(ctx);
      });
    });

    expect(emitted.type).toBe('github');
    expect(emitted.page?.name).toBe('repository');
    expect(emitted.page?.repository).toBe('foo/bar');
    expect(emitted.url).toContain('https://github.com/foo/bar');
  });

  it('emits contexts on DOM and URL changes', async () => {
    // Initial location: random GitHub repo
    Object.defineProperty(window, 'location', { value: new URL('https://github.com/acme/one'), writable: true });
    // Ensure GitHub collectors can run
    const codeTab = document.createElement('div');
    codeTab.id = 'code-tab';
    document.body.appendChild(codeTab);

    const mod = await import('./inject');

    const emissions: any[] = [];
    const unsubscribe = mod.contextEmitter.subscribe((ctx: any) => {
      emissions.push(ctx);
    });

    // Call the exported inject function explicitly
    await mod.injectComponents();

    // debounce time in the extension is set to 400ms, so let's leave a little buffer
    const WAIT_CONST = 700;

    // After 1s, change something in the DOM (remove the code-tab to force a context difference)
    await new Promise((r) => setTimeout(r, WAIT_CONST));
    document.getElementById('code-tab')?.remove();

    // After another 1s, change the URL to another bogus repo
    await new Promise((r) => setTimeout(r, WAIT_CONST));
    // Re-add code-tab so repository collector can run again (optional)
    const codeTab2 = document.createElement('div');
    codeTab2.id = 'code-tab';
    document.body.appendChild(codeTab2);
    // Use pushState to trigger manager's URL-change detection
    location.pathname = '/acme/two';
    // history.pushState({}, '', '/acme/two');

    await new Promise((r) => setTimeout(r, WAIT_CONST));

    expect(emissions.length).toBe(3);
    expect(emissions[0].type).toBe('github');
    expect(emissions[1].type).toBe('github');
    expect(emissions[2].type).toBe('github');

    // // First and second reflect first location
    expect(emissions[0].url).toContain('https://github.com/acme/one');
    expect(emissions[0].page?.name).toBe('repository');
    expect(emissions[0].page?.repository).toBe('acme/one');
    expect(emissions[1].url).toContain('https://github.com/acme/one');
    expect(emissions[1].page?.name).toBe(undefined); // no page name
    expect(emissions[1].page?.repository).toBe(undefined); // no repository
    expect(emissions[2].url).toContain('https://github.com/acme/two');
    expect(emissions[2].page?.name).toBe('repository');
    expect(emissions[2].page?.repository).toBe('acme/two');

    unsubscribe();
  });


  describe('adapters and collectors', () => {

    async function getContextByUrl(url: string, cb: () => void) {
      Object.defineProperty(window, 'location', { value: new URL(url), writable: true });
      cb();
      const mod = await import('./inject');
      await mod.injectComponents();

      // Subscribe to contextEmitter and await first emission
      const emitted = await new Promise<any>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout waiting for context emission')), 2000);
        const unsubscribe = mod.contextEmitter.subscribe((ctx: any) => {
          clearTimeout(timeout);
          unsubscribe();
          resolve(ctx);
        });
      });

      return emitted;
    }

    describe('github', () => {
      it('should detect the repository code tab', async () => {
        const ctx = await getContextByUrl('https://github.com/acme/widgets', () => {
          const codeTab = document.createElement('div');
          codeTab.id = 'code-tab';
          document.body.appendChild(codeTab);
        });

        expect(ctx.page?.name).toBe('repository');
        expect(ctx.page?.repository).toBe('acme/widgets');
      });

      it('should detect the repository code tab with a specific file', async () => {
        const ctx = await getContextByUrl('https://github.com/acme/widgets/blob/main/README.md', () => {
          const codeTab = document.createElement('div');
          codeTab.id = 'code-tab';
          codeTab.classList.add('selected');
          document.body.appendChild(codeTab);
        });

        expect(ctx.page?.name).toBe('repository');
        expect(ctx.page?.section?.name).toBe('code');
        expect(ctx.page?.section?.resource).toBe('README.md');
        expect(ctx.page?.section?.hash).toBe('main');
      });

      it('should detect the repository code tab with commit url', async () => {
        const ctx = await getContextByUrl('https://github.com/acme/widgets/commit/123', () => {
          const codeTab = document.createElement('div');
          codeTab.id = 'code-tab';
          codeTab.classList.add('selected');
          document.body.appendChild(codeTab);
        });

        expect(ctx.page?.name).toBe('repository');
        expect(ctx.page?.section?.name).toBe('commit');
        expect(ctx.page?.section?.hash).toBe('123');
      });

      it('should detect the issues tab', async () => {
        const ctx = await getContextByUrl('https://github.com/acme/widgets/issues/123', () => {
          const codeTab = document.createElement('div');
          codeTab.id = 'code-tab';
          document.body.appendChild(codeTab);
        });

        expect(ctx.page?.name).toBe('repository');
        expect(ctx.page?.section?.name).toBe('issues');
        expect(ctx.page?.section?.issue).toBe('123');
      });

      it('should detect the pull requests tab', async () => {
        const ctx = await getContextByUrl('https://github.com/acme/widgets/pull/123', () => {
          const codeTab = document.createElement('div');
          codeTab.id = 'code-tab';
          document.body.appendChild(codeTab);
        });

        expect(ctx.page?.name).toBe('repository');
        expect(ctx.page?.section?.name).toBe('pulls');
        expect(ctx.page?.section?.pull).toBe('123');
      });
    })
  })
});
