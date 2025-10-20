import React, { useEffect, useState } from 'react';
import BarContent from './BarContent';
import { CollectorManager } from '../adapters/manager';
import { logger } from '../utils/logger';
import { ContextAwareProps } from '../types';
import { useContextData } from '../hooks/useContextData';


const Integrated: React.FC<ContextAwareProps> = ({ contexts, demoMode }) => {
  const { data, isVisible } = useContextData(contexts);
  const [siteStyle, setSiteStyle] = useState<any>(null);


  // Get site-specific style from the current site context
  useEffect(() => {
    const updateSiteStyle = () => {
      try {
        // Get the current site context from the collector manager
        const currentSiteContext = CollectorManager.getCurrentSiteContext();
        
        if (currentSiteContext) {
          setSiteStyle(currentSiteContext.getStyle());
        }
      } catch (error) {
        logger.error('Integrated', 'Error getting site style', error);
      }
    };

    updateSiteStyle();
  }, []);

  // Only show the bar if we have data from the server
  if (!isVisible || data.length === 0) {
    return null;
  }

  // Apply site-specific styles as inline styles
  const containerStyle: React.CSSProperties = {
    padding: '8px 20px',
    fontWeight: 500,
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    lineHeight: 1.4,
    position: 'sticky',
    top: 0,
    zIndex: 999999,
    background: '#fafafa',
    borderBottom: '1px solid #f3f4f6',
    visibility: 'visible',
    opacity: 1,
    // Apply site-specific styles if available
    ...(siteStyle && typeof siteStyle === 'object' ? siteStyle : {}),
  };

  const handleSettingsClick = () => {
    // Send message to background script to open popup
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
  };

  return (
    <div style={containerStyle}>
      {demoMode && (
        <a
          href="https://tooljump.dev/docs/getting-started"
          target="_blank"
          rel="noopener noreferrer"
          title="This is a demo mode, so it will not navigate to any tools. To connect the tools you use in your organisation, please set up your own server by following the instructions in the 'Getting started' guide in ToolJump's docs."
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '2px 6px',
            borderRadius: '4px',
            marginRight: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            flexShrink: 0,
            textDecoration: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
        >
          Demo
        </a>
      )}
      <BarContent 
        data={data} 
        inDocs={demoMode} 
        alertText='The extension is running in demo mode so it will not navigate to any tools. To connect the tools you use in your organisation, please set up your own server by following the instructions in the "Getting started" guide in ToolJump`s docs.' 
      />
      {!demoMode && (
        <button
          onClick={handleSettingsClick}
          title="Open ToolJump Settings"
          style={{
            marginLeft: 'auto',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            padding: '4px',
            cursor: 'pointer',
            fontSize: '21px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            width: '32px',
            height: '32px',
            opacity: 0.7,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          ⚙
        </button>
      )}
    </div>
  );
};

export default Integrated;
