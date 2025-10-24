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

  // Evil tag and attribute tests
  it('removes dangerous script variants', () => {
    const evilScripts = [
      '<script>alert("xss")</script>',
      '<SCRIPT>alert("xss")</SCRIPT>',
      '<script type="text/javascript">alert("xss")</script>',
      '<script src="evil.js"></script>',
      '<script>var x = "evil";</script>',
      '<script><!--\nalert("xss")\n//--></script>'
    ];

    evilScripts.forEach(script => {
      const result = sanitizeHtmlContent(script);
      expect(result).toBe('');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('<SCRIPT');
    });
  });

  it('removes all dangerous HTML tags', () => {
    const evilTags = [
      { input: '<iframe src="evil.html"></iframe>', shouldNotContain: '<iframe' },
      { input: '<object data="evil.swf"></object>', shouldNotContain: '<object' },
      { input: '<embed src="evil.swf">', shouldNotContain: '<embed' },
      { input: '<form action="evil.php"><input type="submit"></form>', shouldNotContain: '<form' },
      { input: '<meta http-equiv="refresh" content="0;url=evil.com">', shouldNotContain: '<meta' },
      { input: '<link rel="stylesheet" href="evil.css">', shouldNotContain: '<link' },
      { input: '<style>body{background:red;}</style>', shouldNotContain: '<style' },
      { input: '<applet code="Evil.class"></applet>', shouldNotContain: '<applet' },
      { input: '<frameset><frame src="evil.html"></frame></frameset>', shouldNotContain: '<frameset' },
      { input: '<input type="hidden" name="evil" value="xss">', shouldNotContain: '<input' }
    ];

    evilTags.forEach(({ input, shouldNotContain }) => {
      const result = sanitizeHtmlContent(input);
      expect(result).not.toContain(shouldNotContain);
    });
  });

  it('removes all inline event handlers', () => {
    const evilEvents = [
      '<div onclick="alert(1)">Click me</div>',
      '<img onload="alert(1)" src="image.jpg">',
      '<a onmouseover="alert(1)" href="test.html">Link</a>',
      '<button ondblclick="alert(1)">Double click</button>',
      '<span onfocus="alert(1)" tabindex="1">Focus me</span>',
      '<div onkeydown="alert(1)">Key down</div>',
      '<p onsubmit="alert(1)">Submit</p>',
      '<div onchange="alert(1)">Change</div>',
      '<span onresize="alert(1)">Resize</span>',
      '<div onscroll="alert(1)">Scroll</div>'
    ];

    evilEvents.forEach(html => {
      const result = sanitizeHtmlContent(html);
      expect(result).not.toContain('onclick=');
      expect(result).not.toContain('onload=');
      expect(result).not.toContain('onmouseover=');
      expect(result).not.toContain('ondblclick=');
      expect(result).not.toContain('onfocus=');
      expect(result).not.toContain('onkeydown=');
      expect(result).not.toContain('onsubmit=');
      expect(result).not.toContain('onchange=');
      expect(result).not.toContain('onresize=');
      expect(result).not.toContain('onscroll=');
    });
  });

  it('removes dangerous URL schemes', () => {
    const evilUrls = [
      '<a href="javascript:alert(1)">Click</a>',
      '<a href="vbscript:alert(1)">Click</a>',
      '<a href="data:text/html,<script>alert(1)</script>">Click</a>',
      '<img src="javascript:alert(1)">',
      '<img src="data:text/html,<script>alert(1)</script>">',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<object data="javascript:alert(1)"></object>',
      '<embed src="javascript:alert(1)">'
    ];

    evilUrls.forEach(html => {
      const result = sanitizeHtmlContent(html);
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('vbscript:');
      expect(result).not.toContain('data:');
    });
  });

  it('removes dangerous attributes', () => {
    const evilAttributes = [
      '<div style="background:url(javascript:alert(1))">Styled</div>',
      '<img src="image.jpg" style="background:url(javascript:alert(1))">',
      '<div class="normal" style="expression(alert(1))">IE Expression</div>',
      '<div style="-moz-binding:url(javascript:alert(1))">Mozilla Binding</div>',
      '<input type="text" value="test" style="behavior:url(javascript:alert(1))">',
      '<div style="background-image:url(javascript:alert(1))">Background</div>',
      '<span style="list-style-image:url(javascript:alert(1))">List</span>'
    ];

    evilAttributes.forEach(html => {
      const result = sanitizeHtmlContent(html);
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('expression(');
      expect(result).not.toContain('-moz-binding');
      expect(result).not.toContain('behavior:');
    });
  });

  it('handles mixed case and encoded attacks', () => {
    const mixedCaseAttacks = [
      '<ScRiPt>alert("xss")</ScRiPt>',
      '<SCRIPT SRC="evil.js"></SCRIPT>',
      '<Div OnClIcK="alert(1)">Click</Div>',
      '<a HrEf="javascript:alert(1)">Link</a>',
      '<IMG SRC="javascript:alert(1)">',
      '<div onCLICK="alert(1)">Mixed case</div>'
    ];

    mixedCaseAttacks.forEach(html => {
      const result = sanitizeHtmlContent(html);
      expect(result.toLowerCase()).not.toContain('<script');
      expect(result.toLowerCase()).not.toContain('onclick');
      expect(result.toLowerCase()).not.toContain('javascript:');
    });
  });

  it('removes nested dangerous content', () => {
    const testCases = [
      {
        html: '<div><script>alert(1)</script><p>Text</p></div>',
        expectedContent: ['Text'],
        dangerousContent: ['<script', 'alert(1)']
      },
      {
        html: '<button onclick="alert(1)"><span>Click</span></button>',
        expectedContent: ['Click'], // Button content should be preserved
        dangerousContent: ['onclick=', 'alert(1)']
      },
      {
        html: '<a href="javascript:alert(1)"><strong>Link</strong></a>',
        expectedContent: ['Link'], // Link content should be preserved
        dangerousContent: ['javascript:', 'alert(1)']
      },
      {
        html: '<div><iframe src="evil.html"></iframe><div>Content</div></div>',
        expectedContent: ['Content'],
        dangerousContent: ['<iframe', 'evil.html']
      },
      {
        html: '<p><object data="evil.swf"></object><span>Text</span></p>',
        expectedContent: ['Text'],
        dangerousContent: ['<object', 'evil.swf']
      }
    ];

    testCases.forEach(({ html, expectedContent, dangerousContent }) => {
      const result = sanitizeHtmlContent(html);
      
      // Should remove dangerous content
      dangerousContent.forEach(dangerous => {
        expect(result).not.toContain(dangerous);
      });
      
      // Should preserve safe content
      expectedContent.forEach(content => {
        expect(result).toContain(content);
      });
    });
  });

  it('handles complex XSS payloads', () => {
    const complexPayloads = [
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      '<img src="x" onerror="alert(1)">',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<body onload=alert(1)>',
      '<input type="image" src="x" onerror="alert(1)">',
      '<details open ontoggle=alert(1)>',
      '<marquee onstart=alert(1)>',
      '<video><source onerror="alert(1)">',
      '<audio src=x onerror=alert(1)>'
    ];

    complexPayloads.forEach(html => {
      const result = sanitizeHtmlContent(html);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('onload');
      expect(result).not.toContain('ontoggle');
      expect(result).not.toContain('onstart');
      expect(result).not.toContain('javascript:');
    });
  });

  it('preserves safe content while removing dangerous elements', () => {
    const mixedContent = `
      <div class="container">
        <h1>Safe Title</h1>
        <p>This is <strong>safe</strong> content with <em>formatting</em>.</p>
        <a href="https://example.com">Safe Link</a>
        <img src="https://example.com/image.jpg" alt="Safe Image">
        <button type="button">Safe Button</button>
        <script>alert("evil")</script>
        <div onclick="alert('evil')">Evil div</div>
        <iframe src="evil.html"></iframe>
        <ul>
          <li>Safe list item 1</li>
          <li>Safe list item 2</li>
        </ul>
      </div>
    `;

    const result = sanitizeHtmlContent(mixedContent);
    
    // Should preserve safe content
    expect(result).toContain('Safe Title');
    expect(result).toContain('This is');
    expect(result).toContain('safe');
    expect(result).toContain('content');
    expect(result).toContain('formatting');
    expect(result).toContain('Safe Link');
    expect(result).toContain('Safe Image');
    expect(result).toContain('Safe Button');
    expect(result).toContain('Safe list item 1');
    expect(result).toContain('Safe list item 2');
    
    // Should remove dangerous content
    expect(result).not.toContain('<script');
    expect(result).not.toContain('onclick=');
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('alert("evil")');
    expect(result).not.toContain("alert('evil')");
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
  // Store original location.hash to restore after tests
  let originalHash: string;
  
  beforeEach(() => {
    originalHash = window.location.hash;
  });
  
  afterEach(() => {
    window.location.hash = originalHash;
  });

  describe('valid URL formats', () => {
    it('parses pathname, segments, and search params', () => {
      window.location.hash = '#/user/acme/repo?x=1&y=two';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/user/acme/repo');
      expect(pathSegments).toEqual(['user', 'acme', 'repo']);
      expect(searchParams.get('x')).toBe('1');
      expect(searchParams.get('y')).toBe('two');
    });

    it('handles root path', () => {
      window.location.hash = '#/';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('handles single segment path', () => {
      window.location.hash = '#/dashboard';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/dashboard');
      expect(pathSegments).toEqual(['dashboard']);
      expect(searchParams.size).toBe(0);
    });

    it('handles multiple segments', () => {
      window.location.hash = '#/org/team/project/settings';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/org/team/project/settings');
      expect(pathSegments).toEqual(['org', 'team', 'project', 'settings']);
    });

    it('handles search params only', () => {
      window.location.hash = '#/?tab=settings&mode=edit';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.get('tab')).toBe('settings');
      expect(searchParams.get('mode')).toBe('edit');
    });

    it('handles complex search params', () => {
      window.location.hash = '#/search?q=test&category=all&sort=date&page=1&filters[status]=active&filters[type]=bug';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/search');
      expect(pathSegments).toEqual(['search']);
      expect(searchParams.get('q')).toBe('test');
      expect(searchParams.get('category')).toBe('all');
      expect(searchParams.get('sort')).toBe('date');
      expect(searchParams.get('page')).toBe('1');
      expect(searchParams.get('filters[status]')).toBe('active');
      expect(searchParams.get('filters[type]')).toBe('bug');
    });

    it('handles URL-encoded characters', () => {
      window.location.hash = '#/user/john%20doe?message=hello%20world&special=%21%40';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/user/john%20doe');
      expect(pathSegments).toEqual(['user', 'john%20doe']);
      expect(searchParams.get('message')).toBe('hello world');
      expect(searchParams.get('special')).toBe('!@');
    });

    it('handles empty hash', () => {
      window.location.hash = '';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('handles hash with only #', () => {
      window.location.hash = '#';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });
  });

  describe('malicious and unsafe inputs', () => {
    it('sanitizes javascript: URLs', () => {
      window.location.hash = '#javascript:alert(1)';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes data: URLs', () => {
      window.location.hash = '#data:text/html,<script>alert(1)</script>';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes vbscript: URLs', () => {
      window.location.hash = '#vbscript:msgbox("xss")';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes file: URLs', () => {
      window.location.hash = '#file:///etc/passwd';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes ftp: URLs', () => {
      window.location.hash = '#ftp://evil.com/malware.exe';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes URLs with script injection in path', () => {
      window.location.hash = '#/path/<script>alert(1)</script>/end';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes URLs with script injection in search params', () => {
      window.location.hash = '#/path?x=<script>alert(1)</script>&y=normal';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes URLs with HTML entities', () => {
      window.location.hash = '#/path?x=%3Cscript%3Ealert(1)%3C/script%3E';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes URLs with null bytes', () => {
      window.location.hash = '#/path%00<script>alert(1)</script>';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes URLs with control characters', () => {
      window.location.hash = '#/path\x00\x01\x02<script>alert(1)</script>';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes URLs with SQL injection attempts', () => {
      window.location.hash = '#/path?id=1%27%20OR%201=1--';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes URLs with path traversal attempts', () => {
      window.location.hash = '#/../../../etc/passwd';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes URLs with encoded path traversal', () => {
      window.location.hash = '#/..%2F..%2F..%2Fetc%2Fpasswd';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('sanitizes URLs with double encoding', () => {
      window.location.hash = '#/path%252F..%252F..%252Fetc%252Fpasswd';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });
  });

  describe('edge cases and malformed inputs', () => {
    it('handles malformed URLs gracefully', () => {
      window.location.hash = '#not-a-valid-url-format';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('handles URLs with only special characters', () => {
      window.location.hash = '#!@#$%^&*()';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('handles URLs with excessive slashes', () => {
      window.location.hash = '#/////////path';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('handles URLs with spaces and special characters', () => {
      window.location.hash = '#/path with spaces!@#$%';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('handles very long URLs', () => {
      const longPath = '/path/' + 'a'.repeat(2000);
      window.location.hash = '#' + longPath;
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('handles URLs with unicode characters', () => {
      window.location.hash = '#/path/测试/中文/🚀';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('handles URLs with mixed valid and invalid characters', () => {
      window.location.hash = '#/valid/path<script>alert(1)</script>/end';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });

    it('handles URLs that cause URL constructor to throw', () => {
      // This should trigger the catch block in sanitizeHashContent
      window.location.hash = '#\x00\x01\x02\x03\x04\x05';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/');
      expect(pathSegments).toEqual([]);
      expect(searchParams.size).toBe(0);
    });
  });

  describe('search parameter edge cases', () => {
    it('handles empty search parameters', () => {
      window.location.hash = '#/path?';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/path');
      expect(pathSegments).toEqual(['path']);
      expect(searchParams.size).toBe(0);
    });

    it('handles search parameters with empty values', () => {
      window.location.hash = '#/path?x=&y=value&z=';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/path');
      expect(pathSegments).toEqual(['path']);
      expect(searchParams.get('x')).toBe('');
      expect(searchParams.get('y')).toBe('value');
      expect(searchParams.get('z')).toBe('');
    });

    it('handles duplicate search parameters', () => {
      window.location.hash = '#/path?x=1&x=2&x=3';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/path');
      expect(pathSegments).toEqual(['path']);
      expect(searchParams.getAll('x')).toEqual(['1', '2', '3']);
    });

    it('handles search parameters with special characters', () => {
      window.location.hash = '#/path?message=hello%20world&symbols=%21%40';
      const { pathname, pathSegments, searchParams } = getHashAsURL();
      expect(pathname).toBe('/path');
      expect(pathSegments).toEqual(['path']);
      expect(searchParams.get('message')).toBe('hello world');
      expect(searchParams.get('symbols')).toBe('!@');
    });
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

