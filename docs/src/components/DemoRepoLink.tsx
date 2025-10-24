import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DemoRepoLink: React.FC = () => {
  const {siteConfig} = useDocusaurusContext();
  return (
    <a 
      href={siteConfig.customFields.demoRepoUrl as string}
      target="_blank"
      rel="noopener noreferrer"
    >
      our demo repository
    </a>
  );
};

export default DemoRepoLink;
