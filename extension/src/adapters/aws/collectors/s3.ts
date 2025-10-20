import { Collector, Context } from "../../types";
import { set } from 'lodash';

export class AWSS3Collector implements Collector {
  name = 'AWSS3';

  shouldRun(): boolean {
    return window.location.pathname.startsWith('/s3/buckets') || window.location.pathname.startsWith('/s3/upload') || window.location.pathname.startsWith('/s3/object');
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    set(context, 'service.name', 's3');
    set(context, 'service.section', 'buckets'); 

    const resourceName = location.pathname.split('/')[3];
    if (!resourceName) {
      return;
    }

    set(context, 'service.resourceName', resourceName);
    set(context, 'service.arn', `arn:aws:s3:::${resourceName}`);

    const url = new URL(window.location.href);
    const prefix = url.searchParams.get('prefix');
    if (prefix) {
      set(context, 'service.objectPath', prefix);
    }
  }
} 