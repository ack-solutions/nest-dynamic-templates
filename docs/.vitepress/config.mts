import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'nest-dynamic-templates',
  description:
    'Database-backed, multi-engine template rendering for NestJS — with error messages that tell you what went wrong.',
  // Served from https://ack-solutions.github.io/nest-dynamic-templates/
  base: '/nest-dynamic-templates/',
  lastUpdated: true,
  cleanUrls: true,
  head: [['meta', { name: 'theme-color', content: '#10b981' }]],

  markdown: {
    // Shiki has no 'nunjucks'/'ejs' grammars; use close relatives for highlighting.
    languageAlias: {
      nunjucks: 'twig',
      ejs: 'erb',
    },
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Errors', link: '/guide/errors' },
      { text: 'Reference', link: '/reference/services' },
      { text: 'Migration', link: '/migration' },
      {
        text: 'npm',
        link: 'https://www.npmjs.com/package/@ackplus/nest-dynamic-templates',
      },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What & why', link: '/guide/introduction' },
          { text: 'Getting started', link: '/guide/getting-started' },
        ],
      },
      {
        text: 'Guide',
        items: [
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'Error handling', link: '/guide/errors' },
          { text: 'Scopes & locales', link: '/guide/scopes-and-locales' },
          { text: 'Layouts', link: '/guide/layouts' },
          { text: 'Engines & languages', link: '/guide/engines' },
          { text: 'Recipes', link: '/guide/recipes' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Template fields', link: '/reference/template-fields' },
          { text: 'Services', link: '/reference/services' },
          { text: 'Error codes', link: '/reference/error-codes' },
        ],
      },
      { text: 'Migrating to v2', link: '/migration' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/ack-solutions/nest-dynamic-templates' },
    ],

    search: { provider: 'local' },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © AckPlus',
    },

    editLink: {
      pattern:
        'https://github.com/ack-solutions/nest-dynamic-templates/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
});
