// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeSections from './src/lib/rehype-sections.mjs';

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
    // Bump `version` whenever src/lib/rehype-sections.mjs changes: it is part of the config digest, so
    // Astro (and the Cloudflare build cache) re-render the Markdown instead of reusing cached HTML.
    rehypePlugins: [[rehypeSections, { version: 2 }]],
  },
});
