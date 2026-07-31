import fs from 'node:fs';
import path from 'node:path';
import { validateSignals } from '../../../method/validate-signals.mjs';
import { claimUniqueSlug, normalizeRouteSource, stableRouteSlug } from './routes.js';

export interface Signal {
  title: string;
  summary: string;
  // `quote` and `date` are required by method/schema.json and enforced by
  // validate-signals.mjs, so anything that reaches a page has both.
  sources: Array<{
    url: string;
    platform: string;
    quote: string;
    date: string;
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
  _date: string;
  _slug: string;
}

export interface DateEntry {
  date: string;
  signals: Signal[];
}

export interface CategoryEntry {
  label: string;
  slug: string;
  signals: Signal[];
}

const publishedDir = path.join(process.cwd(), 'content/published');

let _cache: Signal[] | null = null;

// content/ sits outside src/ so Vite does not watch it. Caching on top of that
// left a newly added batch invisible until restart, which reads as a broken site.
const CACHE_ENABLED = !import.meta.env?.DEV;

/** Load all signals from content/published/*.json, sorted by date descending then array position. */
export function getAllSignals(): Signal[] {
  if (_cache && CACHE_ENABLED) return _cache;

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
      const validation = validateSignals(data, { stagingDay: date });
      if (validation.errors.length > 0) {
        throw new Error(validation.errors.join('; '));
      }
      for (const s of data) {
        const slug = claimUniqueSlug(s.title, slugCounts, 'signal');

        all.push({ ...s, _date: date, _slug: slug });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Invalid published signal file ${file}: ${message}`);
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

/** Group signals by their display category and assign safe, stable route slugs. */
export function getCategoryEntries(): CategoryEntry[] {
  // `category` is a free-form string from model output, so batches drift
  // ("SaaS" one day, "saas" the next). Group and route by the normalized
  // label so variants share one page; the first-seen label is the display.
  const groups = new Map<string, { label: string; signals: Signal[] }>();

  for (const signal of getAllSignals()) {
    const label = signal.category || 'other';
    const key = normalizeRouteSource(label) || 'other';
    const group = groups.get(key);
    if (group) {
      group.signals.push(signal);
    } else {
      groups.set(key, { label, signals: [signal] });
    }
  }

  return Array.from(groups.entries()).map(([key, { label, signals }]) => ({
    label,
    slug: stableRouteSlug(key, 'category'),
    signals,
  }));
}
