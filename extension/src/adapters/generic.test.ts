import { describe, it, expect, beforeEach } from 'vitest';
import { GenericAdapter } from './generic';

describe('GenericAdapter', () => {
  let adapter: GenericAdapter;

  beforeEach(() => {
    adapter = new GenericAdapter();
    // Reset body for each test
    document.body.innerHTML = '<div id="first"></div><div id="second"></div>';
  });

  it('getContextType returns generic', () => {
    expect(adapter.getContextType()).toBe('generic');
  });

  it('getStyle returns sticky top style', () => {
    const style = adapter.getStyle();
    expect(style.position).toBe('sticky');
    expect(style.top).toBe(0);
  });

  it('inject inserts container before first body child', async () => {
    const container = document.createElement('div');
    container.id = 'injected';

    await adapter.inject(container);

    const first = document.body.firstChild as HTMLElement;
    expect(first).toBe(container);
    expect(document.body.children[1].id).toBe('first');
  });
});

