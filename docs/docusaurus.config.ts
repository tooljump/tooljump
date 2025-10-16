import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {CONFIG} from './config';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'ToolJump',
  tagline: 'Connect your tools, automate your workflow',
  favicon: 'img/tooljump.png',

  customFields: {
    chromeExtensionUrl: 'https://chromewebstore.google.com/detail/tooljump/abcdefghijklmnopabcdefghijklmnop',
    tooljumpRepoUrl: 'https://github.com/tooljump/tooljump',
    demoRepoUrl: `https://github.com/${CONFIG.demoRepo}`,
  },

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://tooljump.dev',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // Enable Mermaid parsing in Markdown/MDX
  markdown: {
    mermaid: true,
  },

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'tooljump', // Usually your GitHub org/user name.
  projectName: 'tooljump', // Usually your repo name.

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/tooljump/tooljump/tree/main/docs/',
        },
        blog: {
          path: 'integrations',
          routeBasePath: 'integrations',
          showReadingTime: true,
          // Show all integration articles on a single page
          postsPerPage: 'ALL',
          // We control layout ourselves; don't build a blog sidebar
          blogSidebarCount: 0,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/tooljump/tooljump/tree/main/docs/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // Enable Mermaid diagrams
  themes: ['@docusaurus/theme-mermaid'],
  
  // Using Algolia DocSearch for better compatibility
  plugins: [
    './plugins/integrations-data-plugin.js',
    [
      '@docusaurus/plugin-sitemap',
      {
        changefreq: 'weekly',
        priority: 0.5,
        ignorePatterns: ['/integrations/archive/**', '/integrations/tags/**'],
        filename: 'sitemap.xml',
      },
    ],
  ],

  // Global script to periodically remove any accidental `inert` attributes
  scripts: [
    { src: '/js/inert-cleaner.js' },
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/tooljump-social-card.jpg',
    navbar: {
      title: 'ToolJump',
      logo: {
        alt: 'ToolJump Logo',
        src: 'img/tooljump.png',
      },
      items: [
        {
          to: '/docs',
          label: 'Why ToolJump?',
          position: 'left',
        },
        {
          to: '/demos',
          label: 'Demos',
          position: 'left',
        },
        {
          to: '/docs/architecture',
          label: 'How it works',
          position: 'left',
        },
        {
          to: '/integrations',
          label: 'Integrations gallery',
          position: 'left',
        },
        {
          to: '/docs/writing-integrations',
          label: 'Writing integrations',
          position: 'left',
        },
        {
          to: '/docs/connecting-your-tools-resources',
          label: 'Connect Tools',
          position: 'left',
        },
        {
          to: '/docs/developer-experience',
          label: 'Developer Experience',
          position: 'left',
        },
        {
          href: 'https://github.com/tooljump/tooljump',
          label: 'GitHub',
          position: 'right',
        },
        {
          to: '/docs/getting-started',
          label: 'Get Started',
          position: 'right',
          className: 'navbar-get-started-button',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Why ToolJump',
              to: '/docs/intro',
            },
            {
              label: 'How it works',
              to: '/docs/architecture',
            },
            {
              label: 'Writing integrations',
              to: '/docs/writing-integrations',
            },
            {
              label: 'Connecting tools',
              to: '/docs/connecting-your-tools-resources',
            },
            {
              label: 'Developer Experience',
              to: '/docs/developer-experience',
            },
            {
              label: 'Knowledge as a Service',
              to: '/docs/knowledge-as-a-service',
            },
          ],
        },
        {
          title: 'Integrations',
          items: [
            {
              label: 'All Recipes',
              to: '/docs/recipes',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/tooljump/tooljump',
            },
            {
              label: 'Issues',
              href: 'https://github.com/tooljump/tooljump/issues',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'Privacy Policy',
              to: '/docs/privacy',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ToolJump. Docs built with Docusaurus.<br/><br/><small>All product names, logos, trademarks, service marks, and any associated images or screenshots used or referenced in this project are the property of their respective owners. Any such use is for identification and reference purposes only and does not imply any affiliation with, endorsement by, or sponsorship of ToolJump by those owners.</small>`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'typescript', 'javascript', 'tsx'],
    },
    mermaid: {
      theme: {
        light: 'default',
        dark: 'dark',
      },
      options: {
        maxTextSize: 50000,
        securityLevel: 'loose',
      },
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
