import { IconColor } from './iconService';
import { logger } from './logger';

/**
 * Sends a message to the background script to set the extension icon
 * This function can be called from content scripts
 * @param color - The color of the icon ('red', 'green', or 'default')
 * @returns Promise<boolean> - Whether the message was sent successfully
 */
export const setIconFromContentScript = async (color: IconColor): Promise<boolean> => {
  try {
    // Check if chrome API is available (e.g., in test environment)
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      logger.debug('IconMessaging', `Chrome API not available, skipping icon change to ${color}`);
      return false;
    }

    const response = await chrome.runtime.sendMessage({
      type: 'SET_ICON',
      color: color
    });
    
    if (response && response.success) {
      logger.debug('IconMessaging', `Successfully requested icon change to ${color}`);
      return true;
    } else {
      logger.warn('IconMessaging', `Failed to set icon to ${color}: No success response`);
      return false;
    }
  } catch (error) {
    logger.error('IconMessaging', `Failed to send icon change message to background script`, error);
    return false;
  }
};
