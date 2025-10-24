import { Collector, Context } from '../../types';
import { merge } from 'lodash';

export class GitHubCodeCollector implements Collector {
  name = 'GitHubCode';

  shouldRun(): boolean {
    return !!document.querySelector('#code-tab.selected');
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    const { pathname } = window.location;
    const segments = pathname.split('/').filter(Boolean);

    let resource: string = '';
    let hash: string = '';

    if (segments.length >= 4 && (segments[2] === 'tree' || segments[2] === 'blob')) {
      hash = segments[3] || '';
      // resource is the file/folder path after the hash
      resource = segments.slice(4).join('/');
    } else if (segments.length === 2) {
      // Fallback for main repo page
      hash = 'main'; // default branch
      resource = '';
    }

    const isCommitPage = segments[2] === 'commit' && segments[3];

    if (isCommitPage) {
      hash = segments[3];
    }

    // Merge file information into existing page structure
    merge(context, {
      page: {
        section: {
          name: isCommitPage ? 'commit' : 'code',
          resource,
          hash
        }
      }
    });
  }
}
