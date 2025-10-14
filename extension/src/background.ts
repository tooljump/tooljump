import { logger } from './utils/logger';
import { setExtensionIcon, IconColor } from './utils/iconService';

// Listen for messages from content scripts to set the icon
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SET_ICON') {
    const color = message.color as IconColor;
    logger.debug('Background', `Received request to set icon to ${color}`);
    setExtensionIcon(color);
    sendResponse({ success: true });
  } else if (message.type === 'OPEN_POPUP') {
    logger.debug('Background', 'Received request to open popup');
    // Open the extension popup by simulating a click on the extension icon
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Ensure the page is fully loaded and has a URL before injecting.
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    const currentUrl = tab.url;
    
    // Check if content script is already injected by sending a message
    let isAlreadyInjected = false;
    
    try {
      // check if content script is already injected by sending it a message
      const response = await chrome.tabs.sendMessage(tabId, { type: 'ARE_YOU_INJECTED' });
      if (response && response.type === 'YES_IM_INJECTED') {
        isAlreadyInjected = true;
        logger.debug('Background', `Content script already injected in tab ${tabId}`);
      }
    } catch (e) {
      // No response means content script is not injected - this is expected for new tabs
      isAlreadyInjected = false;
    }

    // Only inject if not already injected
    if (!isAlreadyInjected) {
      const url = new URL(currentUrl);
      const origin = `${url.protocol}//${url.hostname}/*`;

      try {
        const hasPermission = await chrome.permissions.contains({
          origins: [origin],
        });

        if (hasPermission) {
          // If permission exists, inject the content script.
          logger.info('Background', `Injecting content script into ${currentUrl} (permission found for ${origin})`);
          // Use 'dist/content.js' in development (loading from root), 'content.js' in production (loading from dist/)
          const contentScriptPath = process.env.NODE_ENV === 'development' ? 'dist/content.js' : 'content.js';
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: [contentScriptPath],
          });
        }
      } catch (e) {
        logger.error('Background', `Failed to inject script into ${currentUrl}`, e);
      }
    }
  }
});