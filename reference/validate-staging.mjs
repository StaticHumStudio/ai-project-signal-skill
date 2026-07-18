#!/usr/bin/env node
// Validate a Signal staging JSON file.
//
// Hard checks (exit 1): structural problems that would publish broken data.
// Soft warnings (printed, exit 0 unless --strict): patterns the codex review
// has flagged repeatedly. The human reviewer sees these in the PR check log.
//
// Usage:
//   node scripts/validate-staging.mjs content/staging/2026-05-27.json
//   node scripts/validate-staging.mjs content/staging/2026-05-27.json --strict

import { readFileSync } from 'node:fs';

const [, , file, ...flags] = process.argv;
if (!file) {
  console.error('usage: validate-staging.mjs <path/to/staging.json> [--strict]');
  process.exit(2);
}
const strict = flags.includes('--strict');

const data = JSON.parse(readFileSync(file, 'utf8'));

const errors = [];
const warnings = [];

if (!Array.isArray(data)) errors.push('staging file must be a JSON array');
if (Array.isArray(data) && (data.length < 1 || data.length > 10)) {
  errors.push(`signal count out of range: ${data.length} (must be 1 to 10)`);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STAGING_DAY_STR = file.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? new Date().toISOString().slice(0, 10);
const TODAY = new Date(STAGING_DAY_STR + 'T00:00:00Z');

function parseStrictDate(s) {
  if (typeof s !== 'string' || !DATE_RE.test(s)) return null;
  const d = new Date(s + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return null;
  // Reject rolled-over dates (e.g. 2026-02-31 → 2026-03-03).
  const round = `${d.getUTCFullYear().toString().padStart(4, '0')}-${(d.getUTCMonth() + 1).toString().padStart(2, '0')}-${d.getUTCDate().toString().padStart(2, '0')}`;
  return round === s ? d : null;
}
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
// Domains that have shown up as `sources` but are vendor/competitor content.
// Soft warning only... false positives are possible if a vendor blog also
// hosts a real demand thread.
const VENDOR_DOMAINS = [
  'gigradar.io', 'useoutbid.com', 'uphunt.io', 'vollna.com', 'chaserhq.com',
  'paidnice.com', 'lunos.ai', 'upflow.io', 'zeeg.me', 'onecal.io',
  'meetergo.com', 'buildmvpfast.com', 'super-productivity.com',
];

// Journalism outlets that prove facts but are NOT user demand evidence.
// Sources from these domains should be in landscape, never in sources[].
const JOURNALISM_DOMAINS = [
  'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com',
  'reuters.com', 'bloomberg.com', 'wsj.com', 'nytimes.com',
  'theregister.com', 'engadget.com', 'venturebeat.com', 'zdnet.com',
  'thenextweb.com', 'businessinsider.com', 'cnbc.com', 'fastcompany.com',
];

for (const [i, sig] of (Array.isArray(data) ? data : []).entries()) {
  const where = `signal[${i}] "${sig?.title ?? '<no title>'}"`;
  if (!sig?.title) errors.push(`${where}: missing title`);
  if (!Array.isArray(sig?.sources) || sig.sources.length === 0) {
    errors.push(`${where}: must have at least one source`);
    continue;
  }
  let userSourceCount = 0;
  let validSourceCount = 0;
  for (const [j, src] of sig.sources.entries()) {
    const sWhere = `${where} sources[${j}]`;
    if (!src?.url) errors.push(`${sWhere}: missing url`);
    if (!src?.quote) errors.push(`${sWhere}: missing quote`);
    const srcDate = parseStrictDate(src?.date);
    if (!srcDate) {
      errors.push(`${sWhere}: date must be a real calendar day in YYYY-MM-DD (got ${JSON.stringify(src?.date)})`);
      continue;
    }
    if (srcDate > TODAY) {
      errors.push(`${sWhere}: date ${src.date} is after the staging day ${STAGING_DAY_STR}; sources cannot be from the future`);
      continue;
    }
    validSourceCount++;
    const ageMs = TODAY - srcDate;
    if (ageMs > FOURTEEN_DAYS) {
      const engagement = (src.engagement ?? '').toLowerCase();
      // Explicit age-restatement patterns are not valid recency evidence.
      const restatesAge = /posted \d+ days? before signal/.test(engagement)
        || /\d+ days? before signal date/.test(engagement)
        || /^(\d+) (comment|reply|replies);\s*posted \d+ days?/.test(engagement);
      if (restatesAge) {
        warnings.push(`${sWhere}: source is ${Math.round(ageMs / 86400000)} days old; engagement restates the source age rather than citing a specific recent comment or activity date`);
      } else {
        const namesRecency = /\b\d{4}-\d{2}-\d{2}\b/.test(engagement)
          || /\blast comment\b/.test(engagement)
          || /\b(\d+)\s*(day|week)s?\s*ago\b/.test(engagement)
          || /most recent (comment|reply|activity)/.test(engagement)
          || /\brecent (comment|reply|activity|thread)/.test(engagement);
        if (!namesRecency) {
          warnings.push(`${sWhere}: source is ${Math.round(ageMs / 86400000)} days old; engagement does not cite a specific recent activity date (e.g., "most recent comment 2026-05-15")`);
        }
      }
    }
    try {
      const host = new URL(src.url).hostname.replace(/^www\./, '');
      if (JOURNALISM_DOMAINS.some(d => host === d || host.endsWith('.' + d))) {
        warnings.push(`${sWhere}: ${host} is a journalism outlet; news articles prove facts, not user demand -- move to landscape or drop, never in sources[]`);
      } else if (VENDOR_DOMAINS.some(d => host === d || host.endsWith('.' + d))) {
        warnings.push(`${sWhere}: ${host} is on the vendor-domain watchlist; sources should be user posts, not vendor marketing`);
      } else {
        userSourceCount++;
      }

      // GitHub issue checks: warn if engagement signals the issue itself is closed.
      // "closed duplicates" / "closed as duplicate" are intentional and fine.
      if ((host === 'github.com') && /\/issues\/\d+/.test(src.url)) {
        const eng = src.engagement ?? '';
        const engLower = eng.toLowerCase();
        // Explicit closed-status phrases that describe the target issue, not its siblings.
        const CLOSED_PHRASES = [
          /\bstatus[: ]+done\b/,
          /\bstatus[: ]+resolved\b/,
          /\bwontfix\b/,
          /\bwon'?t fix\b/,
          /\bissue (is |was )?closed\b/,
          /\bclosed (issue|ticket|bug|pr|pull)\b/,
          /\bmarked (as )?closed\b/,
          /\bmarked (as )?done\b/,
          /\bresolvedby\b/,
        ];
        if (CLOSED_PHRASES.some(re => re.test(engLower))) {
          warnings.push(`${sWhere}: GitHub issue engagement suggests the issue is closed ("${eng.slice(0, 100)}"); closed issues don't prove ongoing unmet demand — verify it is open`);
        }
      }
    } catch {
      errors.push(`${sWhere}: invalid url ${JSON.stringify(src.url)}`);
    }
  }
  if (validSourceCount > 0 && userSourceCount === 0) {
    warnings.push(`${where}: every source matched the vendor-domain or journalism watchlist; signal may have no real user demand evidence`);
  }

  // Flag "no free X" claims that commonly omit hardship/waiver programs.
  const NO_FREE_RE = /no (open )?free (tier|way|option|alternative|plan)/i;
  const summaryText = `${sig?.summary ?? ''} ${sig?.landscape?.landscape_summary ?? ''}`;
  if (NO_FREE_RE.test(summaryText)) {
    warnings.push(`${where}: summary or landscape_summary contains a "no free X" claim -- verify each named product for hardship/waiver programs and disclose them in the landscape gap field`);
  }
}

if (warnings.length) {
  console.error(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.error('  WARN ' + w);
}
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error('  ERROR ' + e);
  process.exit(1);
}
if (strict && warnings.length) process.exit(1);
console.error(`\nOK: ${Array.isArray(data) ? data.length : 0} signal(s) validated.`);
