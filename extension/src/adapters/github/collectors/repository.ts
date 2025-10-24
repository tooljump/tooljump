import { Collector, Context } from '../../types';
import { set } from 'lodash';

export class GitHubRepositoryCollector implements Collector {
  name = 'GitHubRepository';

  shouldRun(): boolean {
    return !!document.getElementById('code-tab');
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    const { pathname } = window.location;
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length >= 2) {
      const repository = `${segments[0]}/${segments[1]}`;
      set(context, 'page.name', 'repository');
      set(context, 'page.repository', repository);
    }
  }
}
