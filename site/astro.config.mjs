import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// `site` is a placeholder. Set it to your own domain when you fork, since
// canonical and Open Graph URLs are derived from it (and rss.xml refuses to
// build without it).
//
// `base` is '/', which means `npm run build` emits a dist/ you can drop at a
// domain root as-is. To serve the site from a subpath instead, set it to that
// path (base: '/signal' serves at yourdomain.com/signal/) and upload dist/ into
// a matching directory. Every internal link goes through withBase() in
// src/utils/paths.js, so this one value moves the whole site.
//
// `trailingSlash: 'always'` keeps canonicals matching the served URLs, since
// the static build emits directory-style routes.
export default defineConfig({
  site: 'https://example.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
