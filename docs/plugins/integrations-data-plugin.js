const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

module.exports = function integrationsDataPlugin(context, options) {
  return {
    name: 'integrations-data-plugin',
    
    async loadContent() {
      const integrationsDir = path.join(context.siteDir, 'integrations');
      const files = fs.readdirSync(integrationsDir)
        .filter(file => file.endsWith('.mdx'));
      
      const allIntegrations = [];
      const demosData = [];
      
      for (const file of files) {
        const filePath = path.join(integrationsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data: frontMatter } = matter(content);
        
        const integrationData = {
          slug: frontMatter.slug || path.basename(file, '.mdx'),
          title: frontMatter.title || 'Untitled',
          subtitle: frontMatter.subtitle || frontMatter.description || '',
          icons: frontMatter.icons || [],
          permalink: `/integrations/${frontMatter.slug || path.basename(file, '.mdx')}`,
        };
        
        // Add to all integrations
        allIntegrations.push(integrationData);
        
        // Add to demos if it has slides
        if (frontMatter.slides && Array.isArray(frontMatter.slides)) {
          demosData.push({
            ...integrationData,
            slides: frontMatter.slides,
          });
        }
      }
      
      return {
        integrations: allIntegrations,
        demos: demosData,
      };
    },
    
    async contentLoaded({content, actions}) {
      const {setGlobalData} = actions;
      setGlobalData(content);
    },
  };
};

