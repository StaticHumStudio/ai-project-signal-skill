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
    title: 'Signal — Static Hum Studio',
    description: 'Curated feed of real software demand sourced from communities across the internet. Updated daily.',
    site: context.site!.toString(),
    items,
  });
}
