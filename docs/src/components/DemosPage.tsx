import React from 'react';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import {usePluginData} from '@docusaurus/useGlobalData';
import Slideshow from '@site/src/components/Slideshow';
import { getIcon } from '../icons/icons';
import styles from './DemosPage.module.css';

export default function DemosPage(): React.ReactElement {
  const pluginData = usePluginData('integrations-data-plugin') as {
    demos: Array<{
      slug: string;
      title: string;
      subtitle: string;
      slides: any[];
      icons: string[];
      permalink: string;
    }>;
    integrations: any[];
  } | undefined;

  const demosData = pluginData?.demos || [];

  return (
    <div className={styles.demosPage}>
      <div className={styles.header}>
        <Heading as="h1" className={styles.title}>
          Live Integration Demos
        </Heading>
        <p className={styles.subtitle}>
          Here are some demos of how popular tools can communicate between them. This is to give you ideas of potential opportunities you can implement in your organisation.
        </p>
      </div>

      <div className={styles.demosList}>
        {demosData && demosData.map((demo) => (
          <div key={demo.slug} className={styles.demoItem}>
            <div className={styles.slideshowContainer}>
              <Slideshow slides={demo.slides} autostart={false} />
            </div>
            <div className={styles.demoInfo}>
              <Heading as="h2" className={styles.demoTitle}>
                {demo.title}
              </Heading>
              {demo.icons && demo.icons.length > 0 && (
                <div className={styles.demoIcons}>
                  {demo.icons.map((iconName, index) => {
                    const iconSrc = getIcon(iconName);
                    return iconSrc ? (
                      <img
                        key={index}
                        src={iconSrc}
                        alt={iconName}
                        className={styles.demoIcon}
                      />
                    ) : null;
                  })}
                </div>
              )}
              <p className={styles.demoSubtitle}>{demo.subtitle}</p>
              <Link
                className={styles.demoButton}
                to={`/integrations/${demo.slug}`}>
                Get it running
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


