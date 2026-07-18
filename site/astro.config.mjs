import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is a placeholder — set it to your own domain when you fork; canonical
// and Open Graph URLs are derived from it. `base` is '/signal' because the
// site's internal links are rooted there; the local dev server serves at
// /signal/. `trailingSlash: 'always'` keeps canonicals matching the served
// URLs (the static build emits directory-style routes).
export default defineConfig({
  site: 'https://example.com',
  base: '/signal',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
