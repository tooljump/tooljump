import { logger } from './logger';

export type IconColor = 'red' | 'green' | 'default';

/**
 * Sets the extension icon to the specified color
 * @param color - The color of the icon ('red', 'green', or 'default')
 */
export const setExtensionIcon = (color: IconColor): void => {
  if (!chrome?.action?.setIcon) {
    logger.warn('IconService', 'Chrome action API not available');
    return;
  }

  const iconPaths = color === 'default' 
    ? {
        "16": "/icons/icon16.png",
        "32": "/icons/icon32.png", 
        "48": "/icons/icon48.png",
        "128": "/icons/icon128.png"
      }
    : {
        "16": `/icons/icon-${color}-16.png`,
        "32": `/icons/icon-${color}-32.png`,
        "48": `/icons/icon-${color}-48.png`,
        "128": `/icons/icon-${color}-128.png`
      };

  chrome.action.setIcon({
    path: iconPaths
  }, () => {
    if (chrome.runtime.lastError) {
      logger.error('IconService', `Failed to set extension icon to ${color}`, chrome.runtime.lastError);
    } else {
      logger.info('IconService', `Successfully set extension icon to ${color}`);
    }
  });
};
