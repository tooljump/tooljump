import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type StepItem = {
  step: number;
  title: string;
  description: string;
  action: ReactNode;
  icon: string;
};

export default function TryItOut(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const tooljumpRepoUrl = siteConfig.customFields?.tooljumpRepoUrl as string;

  const steps: StepItem[] = [
    {
      step: 1,
      title: 'Install Chrome Extension',
      description: 'Add Tooljump to your browser in under 1 minute',
      action: (
        <Link
          className={styles.stepButton}
          href={siteConfig.customFields?.chromeExtensionUrl as string}
          target="_blank"
          rel="noopener noreferrer">
          Install from Chrome Web Store
        </Link>
      ),
      icon: '/img/chrome.png',
    },
    {
      step: 2,
      title: 'See It In Action',
      description: 'Visit our demo repository to see Tooljump working with real tools',
      action: (
        <Link
          className={styles.stepButton}
          href={tooljumpRepoUrl}
          target="_blank"
          rel="noopener noreferrer">
          Open Demo Repository
        </Link>
      ),
      icon: '/img/tooljump.png',
    },
    {
      step: 3,
      title: 'Build Your Own',
      description: 'Set up your own ToolJump server and start connecting your tools',
      action: (
        <Link
          className={styles.stepButton}
          to="/docs/getting-started">
          Start connecting your tools
        </Link>
      ),
      icon: '⚡',
    },
  ];

  return (
    <section className={styles.tryItOut}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <div className={styles.header}>
              <Heading as="h2" className={styles.title}>
                Try ToolJump in <span className={styles.highlight}>1 minute</span>
              </Heading>
              <p className={styles.subtitle}>
                Experience the power of connected tools with our quick setup process
              </p>
            </div>
          </div>
        </div>
        
        <div className="row">
          {steps.map((step) => (
            <div key={step.step} className="col col--4">
              <div className={clsx('card', 'card--elevated', styles.stepCard)}>
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon}>
                    {step.icon.startsWith('/img/') ? (
                      <img src={step.icon} alt="" className={styles.stepImage} />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <div className={styles.stepNumber}>{step.step}</div>
                </div>
                <div className={styles.stepContent}>
                  <Heading as="h3" className={styles.stepTitle}>
                    {step.title}
                  </Heading>
                  <p className={styles.stepDescription}>
                    {step.description}
                  </p>
                  <div className={styles.stepAction}>
                    {step.action}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
