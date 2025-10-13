import { Collector, Context } from '../../types';
import { merge } from 'lodash';

export class GitHubUserCollector implements Collector {
  name = 'GitHubUser';

  shouldRun(): boolean {
    return true;
  }

  async run(context: Context, previousContext: Context | null): Promise<void> {
    const userEl = document.querySelector('[data-login]');
    if (!userEl) {
      return;
    }

    const user = userEl.getAttribute('data-login');
    if (!user) {
      return;
    }

    merge(context, {
      global: {
        user
      }
    });
  }
}
