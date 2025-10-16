import type {ReactNode} from 'react';
import {useState, useEffect} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';
import TryItOut from '@site/src/components/TryItOut';
import ProblemSolution from '@site/src/components/ProblemSolution';
import ForCompanies from '@site/src/components/ForCompanies';
import SlideshowDemo from '@site/src/components/SlideshowDemo';
import StructuredData from '@site/src/components/StructuredData';
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
            Knowledge as a Service platform for connecting tools - embedded directly where your engineers work to improve developer experience
            </p>
            <div className={styles.heroButtons}>
              <Link
                className={styles.primaryButton}
                to="/docs/getting-started">
                Get started for free
              </Link>
              <Link
                className={styles.secondaryButton}
                to="/docs/demos">
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderMainContent = () => {
    if (isMobile) {
      // Mobile: Show ProblemSolution first, then TryItOut
      return (
        <main>
          <ProblemSolution />
          <TryItOut />
          <ForCompanies />
        </main>
      );
    } else {
      // Desktop: Keep original order
      return (
        <main>
          <TryItOut />
          <ProblemSolution />
          <ForCompanies />
        </main>
      );
    }
  };

  return (
    <Layout
      title="Connecting Tools | Knowledge as a Service for Developer Experience"
      description="Connect GitHub, AWS, Datadog, CI/CD and more with Knowledge as a Service. Improve developer experience by connecting tools and eliminating context switching.">
      <Head>
        <meta name="keywords" content="connecting tools, knowledge as a service, developer experience, developer tool integration, engineering productivity, tool connectivity" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ToolJump" />
        <link rel="canonical" href="https://tooljump.dev/" />
      </Head>
      <StructuredData type="Organization" data={{}} />
      <StructuredData type="SoftwareApplication" data={{}} />
      <HomepageHeader />
      {renderMainContent()}
    </Layout>
  );
}
