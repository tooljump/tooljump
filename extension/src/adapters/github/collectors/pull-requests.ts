import { Collector, Context } from '../../types';
import { merge, set } from 'lodash';

export class GitHubPullRequestsCollector implements Collector {
  name = 'GitHubPullRequests';

  shouldRun(): boolean {
    return location.pathname.split('/').filter(Boolean)[2] === 'pulls' || location.pathname.split('/').filter(Boolean)[2] === 'pull';
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    const [, , pulls, pullId, section] = location.pathname.split('/').filter(Boolean);

    if (pulls === 'pulls' || pulls === 'pull') {
      set(context, 'page.section.name', 'pulls');

      if (pullId) {
        set(context, 'page.section.pull', pullId);

        if (section === 'files') {
          set(context, 'page.section.subsection', 'files');
        } else if (section === 'commits') {
          set(context, 'page.section.subsection', 'commits');
        } else {
          set(context, 'page.section.subsection', 'conversation');
        }
      }
    }
  }
}
