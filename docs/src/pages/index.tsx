import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import TryItOut from '@site/src/components/TryItOut';
import ProblemSolution from '@site/src/components/ProblemSolution';
import ForCompanies from '@site/src/components/ForCompanies';
import SlideshowDemo from '@site/src/components/SlideshowDemo';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={styles.heroBanner}>
      <div className={styles.heroContainer}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <Heading as="h1" className={styles.heroTitle}>
            {/* <span className={styles.highlight}>days</span> */}
            Your engineering tools don&apos;t talk to each other.<br/><span style={{marginTop: '18px', display: 'inline-block'}}>We fix that.</span>
            </Heading>
            <p className={styles.heroSubtitle}>
            Knowledge as a Service - embedded directly where your engineers work
            </p>
            <div className={styles.heroButtons}>
              <Link
                className={styles.primaryButton}
                to="/docs/getting-started">
                Get started for free
              </Link>
              <Link
                className={styles.secondaryButton}
                to="/demos">
                Watch demos
              </Link>
            </div>
          </div>
            <div className={styles.heroImage}>
              <SlideshowDemo />
            </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <TryItOut />
        <ProblemSolution />
        <ForCompanies />
      </main>
    </Layout>
  );
}
