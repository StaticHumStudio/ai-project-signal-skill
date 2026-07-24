import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllSignals } from '../utils/signals';

export function GET(context: APIContext) {
  const allSignals = getAllSignals();

  const items = allSignals.map(signal => ({
    title: signal.title,
    link: `/signal/s/${signal._slug}/`,
    pubDate: new Date(signal._date + 'T12:00:00Z'),
    description: signal.summary,
  }));

  return rss({
    title: 'Signal Demo: Static Hum Studio',
    description: 'Open source example feed for evidence-backed software demand research. Bundled entries are synthetic demo data.',
    site: context.site!.toString(),
    items,
  });
}
