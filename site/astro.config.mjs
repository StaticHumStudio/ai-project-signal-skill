import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` and `base` reflect the original Static Hum deployment. If you fork
// this, set `site` to your own domain. `base` is '/signal' because the site's
// internal links are rooted there; the local dev server serves at /signal/.
export default defineConfig({
  site: 'https://example.com',
  base: '/signal',
  output: 'static',
  integrations: [sitemap()],
});
