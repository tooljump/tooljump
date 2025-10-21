const { webcrypto, randomFillSync } = require('crypto');

if (typeof global.crypto === 'undefined') {
  global.crypto = webcrypto || {};
}

if (!global.crypto.getRandomValues) {
  global.crypto.getRandomValues = (view) => {
    if (!view || typeof view.byteLength !== 'number') {
      throw new TypeError('Expected an ArrayBufferView');
    }
    randomFillSync(view);
    return view;
  };
}

if (typeof global.fetch === 'undefined') {
  try {
    global.fetch = require('undici').fetch;
  } catch {}
}

