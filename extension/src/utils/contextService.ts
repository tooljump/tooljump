import { Context } from '../adapters/types';
import { DataItem } from '../types';
import { logger } from './logger';
import { setIconFromContentScript } from './iconMessaging';
import { DEMO_DATA, isDemoModeUrl } from './demoData';

// Define settings type
export type Settings = {
  host?: string;
  secureToken?: string;
  demoMode?: boolean;
  displayMode?: string;
};

// Response format from server
export interface ContextResponse {
  data: DataItem[];
  count: number;
  cacheHits: number;
  failedCount: number;
  timestamp: string;
  integrationNames: string[];
}

// Context service class to handle common functionality
export class ContextService {
  /**
   * Get settings from Chrome storage
   */
  static async getSettings(): Promise<Settings> {
    return new Promise<Settings>((resolve) => {
      chrome.storage.local.get(['host', 'secureToken', 'demoMode', 'displayMode'], (result: Settings) => {
        resolve(result);
      });
    });
  }

  /**
   * Send context to server and return data
   * @param context - The context to send
   * @param componentName - Name of the calling component for logging
   * @returns Promise<DataItem[]> - Array of data items or empty array if no data
   */
  static async sendContext(context: Context, componentName: string): Promise<DataItem[]> {
    logger.debug(componentName, 'sendContext called with', context);

    try {
      // Get settings from Chrome storage first
      const settings = await this.getSettings();

      // Check if demo mode is enabled - if enabled, use demo data on any URL
      // Demo mode is enabled by default (undefined = first install), only disabled when explicitly set to false
      const isDemoMode = settings.demoMode !== false;

      if (isDemoMode && isDemoModeUrl(window.location.href)) {
        logger.debug(componentName, 'Demo mode enabled for this URL, using hardcoded data instead of server response');
        logger.debug(componentName, `Demo mode returning ${DEMO_DATA.length} demo items`);
        setIconFromContentScript('green'); // Demo mode is considered successful
        return DEMO_DATA;
      } else if (isDemoMode) {
        return [];
      }

      // Only send context if it has a valid type (meaning an adapter matched)
      if (!context.type) {
        logger.debug(componentName, 'No adapter matched for this site, skipping context request');
        setIconFromContentScript('red'); // No adapter matched, considered a failure
        return [];
      }

      logger.debug(componentName, 'Valid context type detected, sending to server', context.type);

      // Use stored host or fallback to localhost
      const host = settings.host || 'http://localhost:3000';
      
      logger.debug(componentName, 'Sending request to', `${host}/context`);
      
      const res = await fetch(`${host}/context`, {
        method: 'POST',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        headers: { 
          'Content-Type': 'application/json',
          ...(settings.secureToken && { 'Authorization': `Bearer ${settings.secureToken}` })
        },
        body: JSON.stringify(context),
      });
      
      const responseData: ContextResponse | DataItem[] = await res.json();
      
      logger.debug(componentName, 'Response received', responseData);
      
      // Handle new response format with metadata
      if (responseData && typeof responseData === 'object' && 'data' in responseData && Array.isArray(responseData.data)) {
        const typedResponse = responseData as ContextResponse;
        logger.debug(componentName, `Response contains ${typedResponse.data.length} items`);
        
        // Log metadata for debugging
        logger.debug(componentName, 'Response metadata', {
          count: typedResponse.count,
          cacheHits: typedResponse.cacheHits,
          failedCount: typedResponse.failedCount,
          timestamp: typedResponse.timestamp,
          integrationNames: typedResponse.integrationNames
        });
        
        setIconFromContentScript('green'); // API call successful
        return typedResponse.data;
      } else if (Array.isArray(responseData)) {
        // Fallback for backward compatibility
        logger.debug(componentName, `Using legacy format with ${responseData.length} items`);
        setIconFromContentScript('green'); // API call successful
        return responseData;
      } else {
        logger.warn(componentName, 'Unexpected response format', responseData);
        setIconFromContentScript('red'); // Unexpected response format
        return [];
      }
    } catch (err) {
      logger.error(componentName, 'Failed to send context', err);
      setIconFromContentScript('red'); // API call failed
      return [];
    }
  }

  /**
   * Check if context should be processed (has valid type)
   * @param context - The context to check
   * @returns boolean - Whether the context should be processed
   */
  static shouldProcessContext(context: Context): boolean {
    return !!context.type;
  }

  /**
   * Get the appropriate host URL from settings
   * @returns Promise<string> - The host URL
   */
  static async getHost(): Promise<string> {
    const settings = await this.getSettings();
    return settings.host || 'http://localhost:3000';
  }
}
