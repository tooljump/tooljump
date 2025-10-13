
import { getHashAsURL, sanitizeHtmlContent } from "../../../utils/utils";
import { Collector, Context } from "../../types";
import { set } from 'lodash';

export class AWSLambdaCollector implements Collector {
  name = 'AWSLambda';

  shouldRun(): boolean {
    return window.location.pathname.startsWith('/lambda') 
      && window.location.hash.startsWith('#/functions');
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    set(context, 'service.name', 'lambda');
    set(context, 'service.section', 'functions');

    const { pathSegments } = getHashAsURL();

    if (!pathSegments[1]) {
      return;
    }

    const resourceName = pathSegments[1];
    set(context, 'service.resourceName', resourceName);

    // Search for ARN in the page content with sanitization
    let arn: string | undefined = undefined;
    const arnPattern = /arn:aws:lambda:[a-z0-9-]+:[0-9]{12}:function:[a-zA-Z0-9-_]+/;
    const mainElement = document.querySelector('main');
    
    if (mainElement) {
      // Sanitize HTML content before regex matching
      const sanitizedContent = sanitizeHtmlContent(mainElement.innerHTML);
      const match = sanitizedContent.match(arnPattern);
      
      if (match && match[0]) {
        // Validate the extracted ARN format
        const extractedArn = match[0];
        if (this.isValidLambdaArn(extractedArn)) {
          arn = extractedArn;
        }
      }
    }

    // If no ARN is found, use the previous context if the function name is the same
    if (!arn) {
      if (previousContext?.service?.resourceName === resourceName && previousContext?.service?.arn && previousContext?.service?.arn) {
        arn = previousContext.service.arn;
      }
    }

    if (arn) {
      set(context, 'service.arn', arn);
    }
  }

  /**
   * Validates that the extracted ARN is a valid Lambda function ARN
   */
  private isValidLambdaArn(arn: string): boolean {
    // Basic validation: ensure it's a string and matches the expected pattern
    if (typeof arn !== 'string' || arn.length === 0) {
      return false;
    }

    // Validate the ARN structure
    const arnParts = arn.split(':');
    if (arnParts.length !== 7) {
      return false;
    }

    // Check ARN format: arn:aws:lambda:region:account:function:name
    const [arnPrefix, partition, service, region, account, resourceType, functionName] = arnParts;
    
    // Validate each part individually
    if (arnPrefix !== 'arn') return false;
    if (partition !== 'aws') return false;
    if (service !== 'lambda') return false;
    if (!region || !/^[a-z0-9-]+$/.test(region)) return false;
    if (!account || !/^\d{12}$/.test(account)) return false;
    if (resourceType !== 'function') return false;
    if (!functionName || !/^[a-zA-Z0-9-_]+$/.test(functionName)) return false;
    
    return true;
  }
}