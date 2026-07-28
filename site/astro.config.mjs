import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is a placeholder — set it to your own domain when you fork; canonical
// and Open Graph URLs are derived from it. `base` is '/signal', so the dev
// server and the build both serve under /signal/; every internal link goes
// through withBase() in src/utils/paths.js, so changing this one value (to
// '/', say) moves the whole site. `trailingSlash: 'always'` keeps canonicals
// matching the served URLs (the static build emits directory-style routes).
export default defineConfig({
  site: 'https://example.com',
  base: '/signal',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
