import type {ReactNode} from 'react';
import {useState, useEffect} from 'react';
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const steps: StepItem[] = [
    {
      step: 1,
      title: 'Install Chrome Extension',
      description: 'Add ToolJump to your browser in under 1 minute',
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
      description: 'Visit our demo repository to see ToolJump working with real tools',
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

  if (isMobile) {
    return (
      <section className={styles.tryItOut}>
        <div className="container">
          <div className="row">
            <div className="col col--12">
              <div className={styles.header}>
                <Heading as="h2" className={styles.title}>
                  Setup ToolJump
                </Heading>
                <div className={styles.mobileMessage}>
                  <div className={styles.mobileIcon}>💻</div>
                  <p className={styles.mobileText}>
                    To setup ToolJump, you need to do it on a computer, as it requires to install a Chrome Extension
                  </p>
                  <Link
                    className={styles.mobileButton}
                    to="/docs/getting-started">
                    Learn more about setup
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
