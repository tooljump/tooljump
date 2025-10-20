import React from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import FooterLinks from '@theme/Footer/Links';
import FooterLogo from '@theme/Footer/Logo';
import FooterCopyright from '@theme/Footer/Copyright';
import {usePluginData} from '@docusaurus/useGlobalData';

type IntegrationItem = {
  title: string;
  subtitle: string;
  icons: string[];
  permalink: string;
  slug: string;
};

export default function Footer(): JSX.Element | null {
  const {footer} = useThemeConfig();
  
  // Get dynamically loaded integrations data from our custom plugin
  const pluginData = usePluginData('integrations-data-plugin') as {
    integrations: IntegrationItem[];
    demos: any[];
  } | undefined;
  
  if (!footer) {
    return null;
  }
  
  const {copyright, links, logo, style} = footer;
  
  const integrations = pluginData?.integrations || [];
  const firstTenIntegrations = integrations.slice(0, 10);
  
  // Split integrations into two columns (5 each)
  const firstColumnIntegrations = firstTenIntegrations.slice(0, 5);
  const secondColumnIntegrations = firstTenIntegrations.slice(5, 10);
  
  // Modify links to include first 10 integrations split into two columns
  const modifiedLinks = links?.map((linkGroup: any) => {
    if (linkGroup.title === 'Integrations') {
      return {
        ...linkGroup,
        items: firstColumnIntegrations.map(integration => ({
          label: integration.title,
          to: integration.permalink,
        })),
      };
    }
    return linkGroup;
  });
  
  // Add second integrations column after the first
  if (modifiedLinks) {
    const integrationsIndex = modifiedLinks.findIndex((lg: any) => lg.title === 'Integrations');
    if (integrationsIndex !== -1) {
      modifiedLinks.splice(integrationsIndex + 1, 0, {
        title: 'More Integrations',
        items: secondColumnIntegrations.map(integration => ({
          label: integration.title,
          to: integration.permalink,
        })),
      });
    }
  }

  return (
    <footer
      className={`footer ${style === 'dark' ? 'footer--dark' : ''}`}>
      <div className="container container-fluid">
        {modifiedLinks && <FooterLinks links={modifiedLinks} />}
        {(logo || copyright) && (
          <div className="footer__bottom text--center">
            {logo && <div className="margin-bottom--sm">{logo && <FooterLogo logo={logo} />}</div>}
            {copyright && <FooterCopyright copyright={copyright} />}
          </div>
        )}
      </div>
    </footer>
  );
}

