import { get } from 'lodash';
import { logger } from './logger';

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
  if (!hash || typeof hash !== 'string') {
    return '';
  }

  // Remove the leading '#' if present
  let sanitized = hash.startsWith('#') ? hash.substring(1) : hash;
  
  // Remove any protocol attempts (http://, https://, ftp://, etc.)
  sanitized = sanitized.replace(/^[a-zA-Z]+:\/\//, '');
  
  // Remove any attempts to escape the base path (../../../, etc.)
  sanitized = sanitized.replace(/\.\.\//g, '');
  sanitized = sanitized.replace(/\.\.\\/g, '');
  
  // Remove any null bytes or control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Ensure the path starts with a forward slash
  if (!sanitized.startsWith('/')) {
    sanitized = '/' + sanitized;
  }
  
  // Limit the length to prevent DoS attacks
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  // Validate that the path only contains safe characters
  const safePathPattern = /^[\/a-zA-Z0-9\-_\.\?=&%]+$/;
  if (!safePathPattern.test(sanitized)) {
    // If unsafe characters found, return a safe default
    return '/';
  }
  
  return sanitized;
}

/**
 * Sanitizes HTML content by removing script tags and other potentially dangerous elements
 * This function should be used before processing innerHTML content to prevent XSS attacks
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handler attributes
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs (potential for data injection)
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Remove vbscript: URLs
  sanitized = sanitized.replace(/vbscript:/gi, '');
  
  return sanitized;
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
