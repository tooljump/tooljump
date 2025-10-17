import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import {usePluginData} from '@docusaurus/useGlobalData';
import { getIcon } from '@site/src/icons/icons';
import styles from './styles.module.css';


type ProblemItem = {
  title: string;
  description: string;
};

type IntegrationItem = {
  title: string;
  subtitle: string;
  icons: string[];
  permalink: string;
};

export default function ProblemSolution(): ReactNode {
  const problems: ProblemItem[] = [
    {
      title: 'Too many tools, no context',
      description: 'Devs constantly jump between GitHub, AWS, Datadog, Terraform, CI/CD and need to constantly remember where things are which causes them slower debugging, mistakes, and many hours wasted.'
    },
    {
      title: 'Tribal knowledge & scattered docs',
      description: 'Links live in Slack threads, Notion pages, or in someone\'s memory. If your most senior engineers leave, you lose all that tribal knowledge and you have to start over. New team members struggle as knowledge does not scale.'
    },
    {
      title: 'High risk of mistakes',
      description: 'High risk of mistakes due to the lack of understanding how systems connect together. Clicking the wrong link or running the wrong command in production can cost millions'
    }
  ];

  // Get dynamically loaded integrations data from our custom plugin
  const pluginData = usePluginData('integrations-data-plugin') as {
    integrations: IntegrationItem[];
    demos: any[];
  } | undefined;
  
  const integrations = pluginData?.integrations || [];

  return (
    <section className={styles.problemSolution}>
      <div className="container">
        {/* Problems Section */}
        <div className="row">
          <div className="col col--12">
            <div className={styles.header}>
              <Heading as="h2" className={styles.title}>
                The <span className={styles.problemHighlight}>Problem</span>: Developer Context Switching
              </Heading>
              <p className={styles.subtitle}>
                Without ToolJump, developers face daily challenges that slow them down and increase risk:
              </p>
              <div className={clsx('row', styles.problemsRow)}>
                {problems.map((problem, idx) => (
                  <div key={idx} className="col col--4">
                    <div className={clsx('card', 'card--elevated', styles.problemSection)}>
                      <div className={styles.problemBadge}>❌</div>
                      <div className={styles.problemText}>
                        <h3>{problem.title}</h3>
                        <p>{problem.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div className="row">
          <div className="col col--12">
            <div className={styles.solutionHeader}>
              <Heading as="h2" className={styles.solutionTitle}>
                The <span className={styles.solutionHighlight}>Solution</span>: Improve Developer Experience with ToolJump
              </Heading>
              <p className={styles.solutionSubtitle}>
                ToolJump transforms developer experience by eliminating context switching, encoding tribal knowledge, and accelerating incident response - all within the tools you already use.
              </p>
              <Link
                className={styles.dxLink}
                to="/docs/developer-experience">
                Discover how ToolJump improves DX →
              </Link>
            </div>
          </div>
        </div>


        {/* Available Integrations Section */}
        <div className="row">
          <div className="col col--12">
            <div className={styles.integrationsHeader}>
              <Heading as="h4" className={styles.integrationsTitle}>
                Available Integrations
              </Heading>
              <p className={styles.integrationsSubtitle}>
                Connect your tools with pre-built integrations
              </p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col col--12">
            <div className={styles.integrationsGrid}>
              {integrations.map((integration, index) => (
                <Link key={index} to={integration.permalink} className={styles.integrationsCard}>
                  <h3 className={styles.integrationsCardTitle}>{integration.title}</h3>
                  {integration.icons.length > 0 && (
                    <div className={styles.integrationsCardIcons}>
                      {integration.icons.map((iconName, iconIndex) => {
                        const iconSrc = getIcon(iconName);
                        return iconSrc ? (
                          <img
                            key={iconIndex}
                            src={iconSrc}
                            alt={iconName}
                            className={styles.integrationsCardIcon}
                          />
                        ) : null;
                      })}
                    </div>
                  )}
                  {integration.subtitle && <p className={styles.integrationsCardSubtitle}>{integration.subtitle}</p>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
