import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllSignals } from '../utils/signals';
import { withBase } from '../utils/paths.js';
import { siteConfig } from '../config.js';

export function GET(context: APIContext) {
  // A feed has to carry absolute URLs, and the only source for the origin is
  // `site` in astro.config.mjs. Without this guard an unset `site` fails deep
  // inside URL parsing, where the error names neither the field nor the file.
  if (!context.site) {
    throw new Error(
      'Cannot build rss.xml: `site` is not set in astro.config.mjs. RSS needs an ' +
        'absolute origin (e.g. site: "https://yourdomain.com") to build feed links.'
    );
  }

  const allSignals = getAllSignals();

  const items = allSignals.map(signal => ({
    title: signal.title,
    // Root-relative here. @astrojs/rss resolves each one against `site` below,
    // so the emitted feed carries fully absolute item links and guids.
    link: withBase(`/s/${signal._slug}/`),
    pubDate: new Date(signal._date + 'T12:00:00Z'),
    description: signal.summary,
  }));

  return rss({
    title: siteConfig.rss.title,
    description: siteConfig.rss.description,
    // The channel link is the site's home page, which lives under `base`
    // rather than at the domain root.
    site: new URL(withBase('/'), context.site).toString(),
    items,
  });
}
