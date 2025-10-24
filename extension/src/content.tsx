// The best way to see if content script is already injected is to send a message to the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ARE_YOU_INJECTED') {
    sendResponse({ type: 'YES_IM_INJECTED' });
    return true;
  }
});

import { injectComponents } from './inject';
import { logger } from './utils/logger';

// Initialize the extension
injectComponents().catch((error) => logger.error('Content', 'Failed to initialize extension', error));
