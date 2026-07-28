import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllSignals } from '../utils/signals';
import { withBase } from '../utils/paths.js';

export function GET(context: APIContext) {
  const allSignals = getAllSignals();

  const items = allSignals.map(signal => ({
    title: signal.title,
    link: withBase(`/s/${signal._slug}/`),
    pubDate: new Date(signal._date + 'T12:00:00Z'),
    description: signal.summary,
  }));

  return rss({
    title: 'Signal Demo: Static Hum Studio',
    description: 'Open source example feed for evidence-backed software demand research. Bundled entries are synthetic demo data.',
    // The channel link is the site's home page, which lives under `base` — not
    // at the domain root. Item links are already root-relative and absolute
    // from `/`, so they resolve against the origin either way.
    site: new URL(withBase('/'), context.site!).toString(),
    items,
  });
}
