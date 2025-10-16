import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'why',
    'demos',
    'getting-started',
    {
      type: 'category',
      label: 'How it works',
      collapsed: false,
      link: {
        type: 'doc',
        id: 'architecture',
      },
      items: [
        'architecture',
        'core-concepts',
        'chrome-extension-architecture',
        'server-architecture',
      ],
    },
    {
      type: 'category',
      label: 'Writing integrations',
      collapsed: false,
      link: {
        type: 'doc',
        id: 'writing-integrations',
      },
      items: [
        'writing-integrations/hello-world',
        'writing-integrations/result-types',
        'writing-integrations/when-to-run',
        'writing-integrations/generic-context',
        'writing-integrations/integrations-code-execution',
        'writing-integrations/caching',
        'writing-integrations/secrets',
        'writing-integrations/data',
        'writing-integrations/debugging',
      ],
    },
    {
      type: 'link',
      label: 'Integrations examples',
      href: '/integrations', // points to blog routeBasePath configured in docusaurus.config.ts
    },
    'deploying',
    'security',
    'faq',
    'implement',
    'connecting-your-tools-resources',
    {
      type: 'category',
      label: 'Tools integration guides',
      collapsed: false,
      link: {
        type: 'doc',
        id: 'recipes',
      },
      items: [
        'recipes/connecting-to-datadog',
        'recipes/connecting-to-aws',
        'recipes/connecting-to-gcp',
        'recipes/connecting-to-azure',
        'recipes/connecting-to-github',
        'recipes/connecting-to-gitlab',
        'recipes/connecting-to-circleci',
        'recipes/connecting-to-pagerduty',
        'recipes/connecting-to-other-tools',
      ],
    },
  ],
};

export default sidebars;
