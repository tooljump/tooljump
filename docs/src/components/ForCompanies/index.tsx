import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type ServiceItem = {
  icon: string;
  title: string;
  description: string;
};

export default function ForCompanies(): ReactNode {
  const services: ServiceItem[] = [
    {
      icon: '⚙️',
      title: 'Setup & Integration',
      description: 'Get ToolJump configured and integrated into your company to connect your developer tools'
    },
    {
      icon: '🔗',
      title: 'Custom Connectors',
      description: 'Build tailored integrations for your specific tools and processes to improve developer experience'
    },
    {
      icon: '🛡️',
      title: 'Scaling & Security Reviews',
      description: 'Ensure your ToolJump deployment scales securely with your team'
    }
  ];

  return (
    <section className={styles.forCompanies}>
      <div className="container">
        <div className="row">
          <div className="col col--12">
            <div className={styles.header}>
              <Heading as="h2" className={styles.title}>
                For <span className={styles.highlight}>Companies</span>
              </Heading>
              <p className={styles.subtitle}>
                Need help getting ToolJump integrated into your organization? 
                Our team can help you set up, customize, and scale ToolJump for your specific needs to improve <a href="/docs/developer-experience">developer experience</a> through <a href="/docs/knowledge-as-a-service">Knowledge as a Service</a>.
              </p>
            </div>
          </div>
        </div>

        <div className="row">
          {services.map((service, idx) => (
            <div key={idx} className="col col--4">
              <div className={clsx('card', 'card--elevated', styles.serviceCard)}>
                <div className={styles.serviceIcon}>{service.icon}</div>
                <div className={styles.serviceContent}>
                  <Heading as="h3" className={styles.serviceTitle}>
                    {service.title}
                  </Heading>
                  <p className={styles.serviceDescription}>
                    {service.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row">
          <div className="col col--12">
            <div className={styles.ctaSection}>
              <p className={styles.ctaText}>
                Work with us to integrate this into your company's workflow.
              </p>
              <Link
                className={styles.ctaButton}
                to="/docs/implement">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
