// Provide a minimal Web Crypto polyfill for Node < 19
import { webcrypto } from 'node:crypto';
import { vi } from 'vitest';

if (typeof globalThis.crypto === 'undefined' || typeof (globalThis.crypto as Crypto).getRandomValues !== 'function') {
  // @ts-ignore
  globalThis.crypto = webcrypto as unknown as Crypto;
}

// Basic fetch stub if not present (older Node)
if (typeof globalThis.fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const undici = require('undici');
  // @ts-ignore
  globalThis.fetch = undici.fetch;
}

// Mock Chrome APIs for testing
declare global {
  var chrome: any;
}

// Set up comprehensive Chrome API mocking
const mockChrome = {
  storage: {
    local: {
      get: vi.fn((keys: any, cb: Function) => {
        cb({
          host: '',
          secureToken: '',
          displayMode: 'integrated',
          debugShowContext: false,
          debugMode: false,
        });
      }),
      set: vi.fn((_: any, cb: Function) => cb && cb()),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  permissions: {
    contains: vi.fn((_: any, cb: Function) => cb(false)),
    request: vi.fn((_: any, cb: Function) => cb(true)),
    remove: vi.fn((_: any, cb: Function) => cb(true)),
  },
  runtime: {
    lastError: null,
    sendMessage: vi.fn((message: any, cb?: Function) => {
      // Mock successful response for icon messaging
      if (message.type === 'SET_ICON') {
        const response = { success: true };
        if (cb) cb(response);
        return Promise.resolve(response);
      }
      // Default response for other messages
      const response = { success: true };
      if (cb) cb(response);
      return Promise.resolve(response);
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn((_: any, cb: Function) => cb([])),
    sendMessage: vi.fn((_: any, message: any, cb?: Function) => {
      if (cb) cb({ success: true });
      return Promise.resolve({ success: true });
    }),
  },
};

// Set up the global chrome object
globalThis.chrome = mockChrome;

// Also set up a more defensive approach by ensuring chrome is always available
Object.defineProperty(globalThis, 'chrome', {
  value: mockChrome,
  writable: true,
  configurable: true,
});

// Make sure chrome.runtime is always available
if (!globalThis.chrome?.runtime) {
  globalThis.chrome = { ...globalThis.chrome, ...mockChrome };
}

