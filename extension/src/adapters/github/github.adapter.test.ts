import { describe, it, expect, beforeEach } from 'vitest';
import { GitHubAdapter } from './github';

function setLocation(url: string) {
  Object.defineProperty(window, 'location', {
    value: new URL(url),
    writable: true,
  });
}

describe('GitHubAdapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('matches only on github.com', async () => {
    const adapter = new GitHubAdapter();
    setLocation('https://github.com/foo/bar');
    await expect(adapter.matches()).resolves.toBe(true);

    setLocation('https://example.com/');
    await expect(adapter.matches()).resolves.toBe(false);
  });

  it('inject inserts container before first body child', async () => {
    const adapter = new GitHubAdapter();
    const a = document.createElement('div'); a.id = 'a';
    const b = document.createElement('div'); b.id = 'b';
    document.body.appendChild(a);
    document.body.appendChild(b);

    const container = document.createElement('div');
    await adapter.inject(container);

    expect(document.body.firstChild).toBe(container);
    expect(document.body.children[1].id).toBe('a');
  });
});

