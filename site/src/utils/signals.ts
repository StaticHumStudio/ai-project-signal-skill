import fs from 'node:fs';
import path from 'node:path';
import { slugify } from './slugify';

export interface Signal {
  title: string;
  summary: string;
  sources: Array<{
    url: string;
    platform: string;
    quote?: string;
    date?: string;
    engagement?: string;
  }>;
  landscape: {
    existing_solutions: Array<{
      name: string;
      url: string;
      gap: string;
    }>;
    landscape_summary: string;
  };
  category: string;
  difficulty: string;
  demand_strength: string;
  tags?: string[];
  builder_note?: string;
  _introduced?: string;
  _date: string;
  _slug: string;
}

export interface DateEntry {
  date: string;
  signals: Signal[];
}

const publishedDir = path.join(process.cwd(), 'content/published');

let _cache: Signal[] | null = null;

/** Load all signals from content/published/*.json, sorted by date descending then array position. */
export function getAllSignals(): Signal[] {
  if (_cache) return _cache;

  if (!fs.existsSync(publishedDir)) {
    _cache = [];
    return _cache;
  }

  // Process oldest-first so the first signal to claim a slug keeps it
  // forever. Newer duplicates get the suffix, not older ones.
  const files = fs.readdirSync(publishedDir)
    .filter(f => f.endsWith('.json'))
    .sort();

  const all: Signal[] = [];
  const slugCounts = new Map<string, number>();

  for (const file of files) {
    const date = file.replace('.json', '');
    const raw = fs.readFileSync(path.join(publishedDir, file), 'utf-8');
    try {
      const data = JSON.parse(raw);
      const signals = Array.isArray(data) ? data : [data];
      for (const s of signals) {
        let base = slugify(s.title);
        const count = slugCounts.get(base) || 0;
        slugCounts.set(base, count + 1);
        const slug = count > 0 ? `${base}-${count + 1}` : base;

        all.push({ ...s, _date: date, _slug: slug });
      }
    } catch (e) {
      console.warn(`Failed to parse ${file}`);
    }
  }

  // Reverse to date-descending for display order
  all.reverse();

  _cache = all;
  return all;
}

/** Get all unique dates (sorted descending) with their signals. */
export function getDateEntries(): DateEntry[] {
  const signals = getAllSignals();
  const map = new Map<string, Signal[]>();

  for (const s of signals) {
    if (!map.has(s._date)) map.set(s._date, []);
    map.get(s._date)!.push(s);
  }

  return Array.from(map.entries()).map(([date, signals]) => ({ date, signals }));
}

/** Get all dates sorted ascending (for prev/next navigation). */
export function getDatesAscending(): string[] {
  const signals = getAllSignals();
  const dates = [...new Set(signals.map(s => s._date))];
  return dates.sort();
}

/** Total signal count. */
export function getTotalSignals(): number {
  return getAllSignals().length;
}
