import { Collector, Context } from '../../types';
import { merge, set } from 'lodash';

export class GitHubIssuesCollector implements Collector {
  name = 'GitHubIssues';

  shouldRun(): boolean {
    return location.pathname.split('/').filter(Boolean)[2] === 'issues';
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    const [, , issues, issueId] = location.pathname.split('/').filter(Boolean);

    if (issues === 'issues') {
      set(context, 'page.section.name', 'issues');

      if (issueId) {
        set(context, 'page.section.issue', issueId);
      }
    }
  }
}
