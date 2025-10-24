import { get } from 'lodash';
import { logger } from './logger';
import sanitizeHtml from 'sanitize-html';

export async function waitFor<T>(callback: () => T | null, timeout: number): Promise<T | undefined> {
  const interval = 300;
  const start = Date.now();

  return new Promise<T | undefined>((resolve) => {
    const check = () => {
      const result = callback();
      if (result !== null && result !== undefined) {
        resolve(result);
      } else if (Date.now() - start >= timeout) {
        resolve(undefined);
      } else {
        setTimeout(check, interval);
      }
    };
    check();
  });
}

export function getHashAsURL(): { pathname: string, pathSegments: string[], searchParams: URLSearchParams } {
  const hash = window.location.hash;
  
  // Validate and sanitize hash content
  const sanitizedHash = sanitizeHashContent(hash);
  
  try {
    // Create URL with proper encoding and validation
    // Use base + relative form to avoid accidental double slashes
    const url = new URL(sanitizedHash, 'http://does-not-matter.local');
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    return {
      pathname: url.pathname,
      pathSegments,
      searchParams: url.searchParams,
    };
  } catch (error) {
    // Fallback to safe default values if URL creation fails
    logger.warn('Utils', 'Failed to parse hash as URL, using safe defaults', error);
    return {
      pathname: '/',
      pathSegments: [],
      searchParams: new URLSearchParams(),
    };
  }
}

/**
 * Sanitizes hash content to prevent URL manipulation and injection attacks
 */
function sanitizeHashContent(hash: string): string {
  try {
    // Remove leading #
    hash = hash.replace(/^#/, '');

    // Check for dangerous schemes first
    if (hash.match(/^(javascript|data|vbscript|file|ftp|about|chrome|chrome-extension):/i)) {
      return '/';
    }

    // Check for very long URLs (potential DoS)
    if (hash.length > 2000) {
      return '/';
    }

    // Check for malformed URLs that don't start with /
    if (!hash.startsWith('/') && hash.length > 0) {
      return '/';
    }

    // Decode once to canonicalize (avoid double-encoding bypasses)
    const decoded = decodeURIComponent(hash);

    // Check for script injection patterns after decoding
    if (decoded.match(/<script|<\/script|javascript:|data:|vbscript:|on\w+\s*=/i)) {
      return '/';
    }

    // Check for path traversal patterns
    if (decoded.match(/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c/i)) {
      return '/';
    }

    // Check for SQL injection patterns
    if (decoded.match(/('|(\\')|(;)|(\\;)|(\\x27)|(\\x3b)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(exec)|(execute))/i)) {
      return '/';
    }

    // Check for control characters and null bytes
    if (decoded.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/)) {
      return '/';
    }

    // Check for unicode characters (potential security issues)
    if (decoded.match(/[^\x00-\x7F]/)) {
      return '/';
    }

    // Reconstruct as a safe URL path
    const url = new URL(decoded, 'https://example.com');

    // Ensure the pathname only contains safe characters (alphanumeric, hyphens, underscores, forward slashes, spaces, URL-encoded chars)
    // Allow spaces for URL-encoded characters like "john doe"
    if (!/^[\/a-zA-Z0-9\-_\s%]*$/.test(url.pathname)) {
      return '/';
    }

    // Validate search parameters for dangerous content
    if (url.search) {
      const searchParams = new URLSearchParams(url.search);
      for (const [key, value] of searchParams.entries()) {
        // Check for script injection in parameter names or values
        if (key.match(/<script|<\/script|javascript:|data:|vbscript:|on\w+\s*=/i) ||
            value.match(/<script|<\/script|javascript:|data:|vbscript:|on\w+\s*=/i)) {
          return '/';
        }
        // Check for SQL injection in parameter values
        if (value.match(/('|(\\')|(;)|(\\;)|(\\x27)|(\\x3b)|(union)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(exec)|(execute))/i)) {
          return '/';
        }
        // Check for special characters that might be dangerous, but allow some safe ones
        if (value.match(/[<>"']/)) {
          return '/';
        }
      }
    }

    // Return the full path including search parameters
    return url.pathname + url.search;
  } catch {
    return '/';
  }
}

/**
 * Sanitizes HTML content by removing script tags and other potentially dangerous elements
 * This function should be used before processing innerHTML content to prevent XSS attacks
 */
export function sanitizeHtmlContent(input: string): string {
  if (!input || typeof input !== 'string') return '';

  // Allowed tags and attributes (customize as needed)
  const allowedTags = new Set([
    'div', 'span', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'a', 'button', 'img', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
    'blockquote', 'code', 'pre', 'hr', 'details', 'summary', 'audio', 'video', 'source',
    'html', 'head', 'body' // Allow document structure tags
  ]);

  const allowedAttributes = {
    'a': new Set(['href', 'title']),
    'img': new Set(['src', 'alt', 'title']),
    'button': new Set(['type', 'disabled']),
    '*': new Set(['class', 'id']) // wildcard for global allowed attrs
  };

  const parser = new DOMParser();
  const doc = parser.parseFromString(input, 'text/html');

  const sanitizeNode = (node: any) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      
      // Remove script tags and their content completely
      if (tag === 'script') {
        node.remove();
        return;
      }
      
      // Remove disallowed tags
      if (!allowedTags.has(tag)) {
        node.remove();
        return;
      }

      // Sanitize attributes
      const attributesToRemove = [];
      [...node.attributes].forEach(attr => {
        const attrName = attr.name.toLowerCase();

        // Remove all event handlers (onclick, onload, etc.)
        if (attrName.startsWith('on')) {
          attributesToRemove.push(attrName);
          return;
        }

        const allowedForTag =
          allowedAttributes[tag as keyof typeof allowedAttributes]?.has(attrName) ||
          allowedAttributes['*'].has(attrName);

        if (!allowedForTag) {
          attributesToRemove.push(attrName);
          return;
        }

        // Prevent javascript:, data:, vbscript:
        const value = attr.value.trim().toLowerCase();
        if (
          (attrName === 'href' || attrName === 'src') &&
          (value.startsWith('javascript:') || value.startsWith('data:') || value.startsWith('vbscript:'))
        ) {
          attributesToRemove.push(attrName);
        }
      });

      // Remove the identified dangerous attributes
      attributesToRemove.forEach(attrName => {
        node.removeAttribute(attrName);
      });
    }

    // Recursively clean children - use a copy of the array to avoid issues with live collections
    const children = Array.from(node.childNodes);
    children.forEach(child => {
      sanitizeNode(child);
    });
  };

  // Handle both body element and document element
  const targetElement = doc.body || doc.documentElement;
  if (targetElement) {
    sanitizeNode(targetElement);
  }

  const result = targetElement?.innerHTML || '';
  return result;
}

/**
 * Safely parses JSON content and extracts a value using lodash.get with validation
 * @param content - The JSON string to parse
 * @param path - The lodash.get compatible path to extract the value
 * @param validator - Callback function to validate the extracted value
 * @returns The validated value or undefined if parsing/validation fails
 */
export function safeParseJSON<T>(
  content: string | null | undefined,
  path: string,
  validator: (value: any) => value is T
): T | undefined {
  // Validate input content
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return undefined;
  }

  // Safe JSON parsing with error handling
  let parsedData: any;
  try {
    parsedData = JSON.parse(content);
  } catch (parseError) {
    logger.warn('Utils', 'Invalid JSON content', parseError);
    return undefined;
  }

  // Validate the parsed object structure
  if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
    return undefined;
  }

  // Use lodash.get for safe property access
  const value = get(parsedData, path);

  // Validate the extracted value using the provided callback
  if (validator(value)) {
    return value;
  }

  return undefined;
}
