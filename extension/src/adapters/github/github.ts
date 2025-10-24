import { Collector, SiteAdapter } from '../types';
import { GitHubRepositoryCollector } from './collectors/repository';
import { GitHubCodeCollector } from './collectors/code';
import { GitHubUserCollector } from './collectors/user';
import { GitHubIssuesCollector } from './collectors/issues';
import { GitHubPullRequestsCollector } from './collectors/pull-requests';
import { GitHubActionsCollector } from './collectors/actions';
import { GitHubProfileCollector } from './collectors/profile';

// GitHub Adapter that combines injection, styling, and collectors
export class GitHubAdapter implements SiteAdapter {
  getDescription(): string {
    return 'GitHub adapter, collecting information about repositories, code, users, issues, pull requests, actions, and more';
  }

  async matches(): Promise<boolean> {
    const matches = window.location.hostname === 'github.com';
    return matches;
  }

  async inject(container: HTMLElement): Promise<void> {
    // Inject at the very top of the body, before the first child
    document.body.insertBefore(container, document.body.firstChild);
  }

  getStyle(): React.CSSProperties {
    return {
      position: 'sticky',
      top: 0,
      /* GitHub has a header that's about 60px, so we position at the very top */
      /* Override any existing sticky headers */
      zIndex: 99999,
      /* GitHub specific adjustments */
      borderRadius: 0,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    };
  }

  getContextType(): string {
    return 'github';
  }

  getCollectors(): Collector[] {
    return [
      new GitHubRepositoryCollector(),
      new GitHubCodeCollector(),
      new GitHubUserCollector(),
      new GitHubIssuesCollector(),
      new GitHubPullRequestsCollector(),
      new GitHubActionsCollector(),
      new GitHubProfileCollector(),
    ];
  }
}
