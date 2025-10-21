import { Collector, Context } from "../../types";
import { merge } from 'lodash';

export class AWSRegionCollector implements Collector {
    name = 'AWSRegion';
  
    shouldRun(): boolean {
      return true; // run on all pages
    }
  
      async run(context: Context, previousContext: Context | null): Promise<void> {
    const { pathname, hostname } = window.location;
    
    // Extract region using regex pattern [a-z]+-[a-z]+-[0-9]
    const regionRegex = /[a-z]+-[a-z]+-[0-9]/;
    let region = 'us-east-1'; // default
    
    // Try to extract region from hostname first
    const hostnameMatch = hostname.match(regionRegex);
    if (hostnameMatch) {
      region = hostnameMatch[0];
    } else {
      // Try to extract region from pathname if not found in hostname
      const pathnameMatch = pathname.match(regionRegex);
      if (pathnameMatch) {
        region = pathnameMatch[0];
      }
    }

    merge(context, {
      scope: {
        region
      }
    });
  }
  }