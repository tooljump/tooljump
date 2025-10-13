import { Collector, Context } from '../../types';
import { set } from 'lodash';

export class GitHubActionsCollector implements Collector {
  name = 'GitHubActions';

  shouldRun(): boolean {
    const { pathname } = window.location;
    const segments = pathname.split('/').filter(Boolean);
    
    // Check if we're on GitHub Actions pages
    return segments.length >= 3 && segments[2] === 'actions';
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    const { pathname } = window.location;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length >= 3 && segments[2] === 'actions') {
      set(context, 'page.section.name', 'actions');
      
      // Extract workflow name if present
      if (segments.length >= 5) {
        set(context, 'page.section.workflow', segments[4]);
      }
      
      // Extract run ID if present (usually a number)
      if (segments.length >= 6) {
        const runId = segments[5];
        if (/^\d+$/.test(runId)) {
          set(context, 'page.section.run', runId);
        }
      }
      
      // Extract job name if present
      if (segments.length >= 7) {
        set(context, 'page.section.job', segments[6]);
      }
    }
  }
} 