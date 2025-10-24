import { getHashAsURL, sanitizeHtmlContent } from "../../../utils/utils";
import { Collector, Context } from "../../types";
import { set } from 'lodash';

export class AWSDynamoDBCollector implements Collector {
  name = 'AWSDynamoDB';

  shouldRun(): boolean {
    return window.location.pathname.startsWith('/dynamodb') 
      && (window.location.hash.startsWith('#table') 
            || window.location.hash.startsWith('#item-explorer')
            || window.location.hash.startsWith('#edit-item'));
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    set(context, 'service.name', 'dynamodb');
    set(context, 'service.section', 'tables');

    const { pathSegments, searchParams } = getHashAsURL();
    let resourceName: string | null = null;
    if (pathSegments[0] === 'table') {
      resourceName = searchParams.get('name');
    } else if (pathSegments[0] === 'item-explorer' || pathSegments[0] === 'edit-item') {
      resourceName = searchParams.get('table');
    }

    if (!resourceName) {
      return;
    }

    set(context, 'service.resourceName', resourceName);

    // Search for ARN in the page content with sanitization
    let arn: string | undefined = undefined;
    const arnPattern = /arn:aws:dynamodb:[a-z0-9-]+:[0-9]{12}:table\/[a-zA-Z0-9-_]+/;
    const mainElement = document.querySelector('main');
    
    if (mainElement) {
      // Sanitize HTML content before regex matching
      const sanitizedContent = sanitizeHtmlContent(mainElement.innerHTML);
      const match = sanitizedContent.match(arnPattern);
      
      if (match && match[0]) {
        // Validate the extracted ARN format
        const extractedArn = match[0];
        if (this.isValidDynamoDBArn(extractedArn)) {
          arn = extractedArn;
        }
      }
    }

    // If no ARN is found, use the previous context if the table name is the same
    if (!arn) {
      if (previousContext?.service.resourceName === resourceName && previousContext.service.arn) {
        arn = previousContext.service.arn;
      }
    }

    if (arn) {
      set(context, 'service.arn', arn);
    }
  }

  /**
   * Validates that the extracted ARN is a valid DynamoDB table ARN
   */
  private isValidDynamoDBArn(arn: string): boolean {
    // Basic validation: ensure it's a string and matches the expected pattern
    if (typeof arn !== 'string' || arn.length === 0) {
      return false;
    }

    // Validate the ARN structure
    const arnParts = arn.split(':');
    if (arnParts.length !== 6) {
      return false;
    }

    // Check ARN format: arn:aws:dynamodb:region:account:table/name
    const [arnPrefix, partition, service, region, account, resource] = arnParts;
    
    // Validate each part individually
    if (arnPrefix !== 'arn') return false;
    if (partition !== 'aws') return false;
    if (service !== 'dynamodb') return false;
    if (!region || !/^[a-z0-9-]+$/.test(region)) return false;
    if (!account || !/^\d{12}$/.test(account)) return false;
    if (!resource || !resource.startsWith('table/')) return false;
    
    // Validate table name part
    const tableName = resource.substring(6); // Remove 'table/' prefix
    if (!tableName || !/^[a-zA-Z0-9-_]+$/.test(tableName)) return false;
    
    return true;
  }
} 