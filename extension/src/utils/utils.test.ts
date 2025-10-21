import { describe, it, expect } from 'vitest';
import { sanitizeHtmlContent, safeParseJSON, getHashAsURL, waitFor } from './utils';

describe('sanitizeHtmlContent', () => {
  it('removes script tags and their content', () => {
    const html = '<div>Text<script>alert(1)</script></div>';
    expect(sanitizeHtmlContent(html)).toBe('<div>Text</div>');
  });

  it('removes inline event handlers', () => {
    const html = '<button onclick="doBad()">Click</button>';
    expect(sanitizeHtmlContent(html)).toBe('<button>Click</button>');
  });

  it('strips javascript: and data: URLs', () => {
    const html = '<a href="javascript:alert(1)">a</a><img src="data:abc">';
    const out = sanitizeHtmlContent(html);
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('data:');
  });

  it('returns empty string for non-string input', () => {
    // @ts-expect-error testing runtime behavior
    expect(sanitizeHtmlContent(undefined)).toBe('');
  });
});

describe('safeParseJSON', () => {
  it('parses valid JSON and validates value', () => {
    const json = JSON.stringify({ a: { b: 42 } });
    const v = safeParseJSON<number>(json, 'a.b', (x): x is number => typeof x === 'number');
    expect(v).toBe(42);
  });

  it('returns undefined for invalid JSON', () => {
    const v = safeParseJSON<number>('{not-json}', 'a.b', (x): x is number => typeof x === 'number');
    expect(v).toBeUndefined();
  });

  it('returns undefined when validator fails', () => {
    const json = JSON.stringify({ a: { b: 'nope' } });
    const v = safeParseJSON<number>(json, 'a.b', (x): x is number => typeof x === 'number');
    expect(v).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    const v = safeParseJSON<number>('', 'a', (x): x is number => typeof x === 'number');
    expect(v).toBeUndefined();
  });
});

describe('getHashAsURL', () => {
  it('parses pathname, segments, and search params', () => {
    window.location.hash = '#/user/acme/repo?x=1&y=two';
    const { pathname, pathSegments, searchParams } = getHashAsURL();
    expect(pathname).toBe('/user/acme/repo');
    expect(pathSegments).toEqual(['user', 'acme', 'repo']);
    expect(searchParams.get('x')).toBe('1');
    expect(searchParams.get('y')).toBe('two');
  });

  it('sanitizes potentially unsafe hash content', () => {
    window.location.hash = '#javascript:alert(1)';
    const { pathname, pathSegments } = getHashAsURL();
    expect(pathname).toBe('/');
    expect(pathSegments).toEqual([]);
  });
});

describe('waitFor', () => {
  it('resolves when callback returns a value', async () => {
    let ready = false;
    setTimeout(() => { ready = true; }, 30);
    const result = await waitFor(() => (ready ? 'ok' : null), 200);
    expect(result).toBe('ok');
  });

  it('times out and returns undefined', async () => {
    const result = await waitFor(() => null, 50);
    expect(result).toBeUndefined();
  });
});

