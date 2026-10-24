// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.prolineelectricalworks.com',
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin/') && !page.includes('/404'),
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
});
