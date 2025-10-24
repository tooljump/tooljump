import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ChromeExtensionLink: React.FC = () => {
  const {siteConfig} = useDocusaurusContext();
  return (
    <a 
      href={siteConfig.customFields.chromeExtensionUrl as string}
      className="btn-primary"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img 
        src="/img/chrome.png" 
        alt="Chrome" 
        width="20" 
        height="20" 
        style={{ 
          marginRight: '10px',
          verticalAlign: 'middle',
          display: 'inline-block',
          position: 'relative',
          top: '-2px'
        }}
      />
      Install ToolJump Chrome Extension
    </a>
  );
};

export default ChromeExtensionLink;
