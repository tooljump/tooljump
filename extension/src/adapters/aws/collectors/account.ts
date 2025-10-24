import { Collector, Context } from "../../types";
import { merge } from 'lodash';
import { safeParseJSON } from "../../../utils/utils";
import { logger } from "../../../utils/logger";

export class AWSAccountCollector implements Collector {
    name = 'AWSAccount';
  
    shouldRun(): boolean {
      return true; // run on all pages
    }
  
    async run(context: Context, previousContext: Context | null): Promise<void> {
      try {
        // Try to find account ID in the page content
        const accountElement = document.querySelector('meta[name="awsc-session-data"]');
  
        if (accountElement && accountElement.getAttribute('content')) {
          const content = accountElement.getAttribute('content');
          
          const accountId = safeParseJSON(content, 'accountId', (value): value is string => 
            typeof value === 'string' && /^\d{12}$/.test(value)
          );
          
          if (accountId) {
            merge(context, {
              global: {
                accountId
              }
            });
          }
        }
      } catch (error) {
        logger.error('AWSAccountCollector', 'Error collecting account data', error);
      }
    }
  }