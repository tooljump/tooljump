import { Collector, Context } from '../../types';
import { set } from 'lodash';

export class GitHubProfileCollector implements Collector {
  name = 'GitHubProfile';

  shouldRun(): boolean {
    const { pathname } = window.location;
    const segments = pathname.split('/').filter(Boolean);
    
    // Check if we have exactly one path segment and the repositories tab is present
    return segments.length === 1 && document.querySelector('#repositories-tab') !== null;
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    const { pathname } = window.location;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length === 1) {
      const username = segments[0];
      set(context, 'page.name', 'profile');
      set(context, 'page.username', username);
      if (document.querySelector('#people-tab')) {
        set(context, 'page.isOrg', 'true');
      }

      if (location.search.includes('tab=repositories')) {
        set(context, 'page.section.name', 'repositories');
      }

      if (location.search.includes('tab=packages')) {
        set(context, 'page.section.name', 'packages');
      }

      if (document.querySelector('#overview-tab.selected')) {
        set(context, 'page.section.name', 'overview');
      }
    }
  }
} 