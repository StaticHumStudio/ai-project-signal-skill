import {readFileSync} from 'node:fs';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

const SIGNAL_KEYS = new Set([
  'title',
  'summary',
  'sources',
  'landscape',
  'category',
  'difficulty',
  'demand_strength',
  'tags',
  'builder_note',
]);
const SOURCE_KEYS = new Set([
  'url',
  'platform',
  'quote',
  'date',
  'engagement',
]);
const LANDSCAPE_KEYS = new Set([
  'existing_solutions',
  'landscape_summary',
]);
const SOLUTION_KEYS = new Set(['name', 'url', 'gap']);

// Deliberately empty. Telling a vendor's marketing page apart from real user
// demand is the assistant's job during Phase 4 of the sourcing prompt, and the
// right domains are different for every focus area, so this ships with no
// opinion about anyone's business.
//
// It stays here as an optional backstop: if a particular domain keeps slipping
// through your runs, add it below (or pass `vendorDomains` to validateSignals)
// and every source from it gets flagged for a second look.
const VENDOR_DOMAINS = [];

const JOURNALISM_DOMAINS = [
  'techcrunch.com',
  'theverge.com',
  'wired.com',
  'arstechnica.com',
  'reuters.com',
  'bloomberg.com',
  'wsj.com',
  'nytimes.com',
  'theregister.com',
  'engadget.com',
  'venturebeat.com',
  'zdnet.com',
  'thenextweb.com',
  'businessinsider.com',
  'cnbc.com',
  'fastcompany.com',
];

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStrictDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const roundTrip = [
    date.getUTCFullYear().toString().padStart(4, '0'),
    (date.getUTCMonth() + 1).toString().padStart(2, '0'),
    date.getUTCDate().toString().padStart(2, '0'),
  ].join('-');
  return roundTrip === value ? date : null;
}

function rejectUnknownKeys(value, allowed, where, errors) {
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      errors.push(`${where}: unknown field ${JSON.stringify(key)}`);
    }
  }
}

function requireString(value, field, where, errors) {
  if (typeof value?.[field] !== 'string' || value[field].trim() === '') {
    errors.push(`${where}: ${field} must be a non-empty string`);
    return false;
  }
  return true;
}

function matchesDomain(host, domains) {
  return domains.some(domain => host === domain || host.endsWith(`.${domain}`));
}

export function validateSignals(data, {stagingDay, vendorDomains = VENDOR_DOMAINS} = {}) {
  const errors = [];
  const warnings = [];
  const stagingDayString = stagingDay ?? new Date().toISOString().slice(0, 10);
  const today = parseStrictDate(stagingDayString);

  if (!today) {
    errors.push(`staging day must be a real calendar day in YYYY-MM-DD (got ${JSON.stringify(stagingDayString)})`);
    return {errors, warnings};
  }

  if (!Array.isArray(data)) {
    errors.push('signals file must be a JSON array');
    return {errors, warnings};
  }
  if (data.length < 1 || data.length > 10) {
    errors.push(`signal count out of range: ${data.length} (must be 1 to 10)`);
  }

  for (const [signalIndex, signal] of data.entries()) {
    const where = `signal[${signalIndex}] "${signal?.title ?? '<no title>'}"`;
    if (!isRecord(signal)) {
      errors.push(`${where}: signal must be an object`);
      continue;
    }

    rejectUnknownKeys(signal, SIGNAL_KEYS, where, errors);
    requireString(signal, 'title', where, errors);
    requireString(signal, 'summary', where, errors);
    requireString(signal, 'category', where, errors);
    requireString(signal, 'difficulty', where, errors);
    requireString(signal, 'demand_strength', where, errors);

    if (signal.tags !== undefined && (
      !Array.isArray(signal.tags)
      || signal.tags.some(tag => typeof tag !== 'string')
    )) {
      errors.push(`${where}: tags must be an array of strings`);
    }
    if (signal.builder_note !== undefined && typeof signal.builder_note !== 'string') {
      errors.push(`${where}: builder_note must be a string`);
    }

    if (!Array.isArray(signal.sources) || signal.sources.length === 0) {
      errors.push(`${where}: must have at least one source`);
    } else {
      let userSourceCount = 0;
      let validSourceCount = 0;

      for (const [sourceIndex, source] of signal.sources.entries()) {
        const sourceWhere = `${where} sources[${sourceIndex}]`;
        if (!isRecord(source)) {
          errors.push(`${sourceWhere}: source must be an object`);
          continue;
        }

        rejectUnknownKeys(source, SOURCE_KEYS, sourceWhere, errors);
        const hasUrl = requireString(source, 'url', sourceWhere, errors);
        requireString(source, 'platform', sourceWhere, errors);
        requireString(source, 'quote', sourceWhere, errors);
        const hasDate = requireString(source, 'date', sourceWhere, errors);
        if (source.engagement !== undefined && typeof source.engagement !== 'string') {
          errors.push(`${sourceWhere}: engagement must be a string`);
        }

        const sourceDate = hasDate ? parseStrictDate(source.date) : null;
        if (hasDate && !sourceDate) {
          errors.push(`${sourceWhere}: date must be a real calendar day in YYYY-MM-DD (got ${JSON.stringify(source.date)})`);
        } else if (sourceDate && sourceDate > today) {
          errors.push(`${sourceWhere}: date ${source.date} is after the staging day ${stagingDayString}; sources cannot be from the future`);
        } else if (sourceDate) {
          validSourceCount += 1;
          const ageMs = today - sourceDate;
          if (ageMs > FOURTEEN_DAYS) {
            const engagement = (source.engagement ?? '').toLowerCase();
            const restatesAge = /posted \d+ days? before signal/.test(engagement)
              || /\d+ days? before signal date/.test(engagement)
              || /^(\d+) (comment|reply|replies);\s*posted \d+ days?/.test(engagement);
            if (restatesAge) {
              warnings.push(`${sourceWhere}: source is ${Math.round(ageMs / 86400000)} days old; engagement restates the source age rather than citing a specific recent comment or activity date`);
            } else {
              const namesRecency = /\b\d{4}-\d{2}-\d{2}\b/.test(engagement)
                || /\blast comment\b/.test(engagement)
                || /\b(\d+)\s*(day|week)s?\s*ago\b/.test(engagement)
                || /most recent (comment|reply|activity)/.test(engagement)
                || /\brecent (comment|reply|activity|thread)/.test(engagement);
              if (!namesRecency) {
                warnings.push(`${sourceWhere}: source is ${Math.round(ageMs / 86400000)} days old; engagement does not cite a specific recent activity date`);
              }
            }
          }
        }

        if (hasUrl) {
          try {
            const parsedUrl = new URL(source.url);
            const host = parsedUrl.hostname.replace(/^www\./, '');
            if (matchesDomain(host, JOURNALISM_DOMAINS)) {
              warnings.push(`${sourceWhere}: ${host} is a journalism outlet; move it to landscape or drop it`);
            } else if (matchesDomain(host, vendorDomains)) {
              warnings.push(`${sourceWhere}: ${host} is on the vendor-domain watchlist; verify that it is user demand`);
            } else {
              userSourceCount += 1;
            }

            if (host === 'github.com' && /\/issues\/\d+/.test(source.url)) {
              const engagement = source.engagement ?? '';
              const closedPhrases = [
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
              if (closedPhrases.some(pattern => pattern.test(engagement.toLowerCase()))) {
                warnings.push(`${sourceWhere}: GitHub issue engagement suggests the issue is closed; verify that it is open`);
              }
            }
          } catch {
            errors.push(`${sourceWhere}: invalid url ${JSON.stringify(source.url)}`);
          }
        }
      }

      if (validSourceCount > 0 && userSourceCount === 0) {
        warnings.push(`${where}: every source matched the vendor-domain or journalism watchlist; signal may have no real user demand evidence`);
      }
    }

    if (!isRecord(signal.landscape)) {
      errors.push(`${where}: landscape must be an object`);
    } else {
      rejectUnknownKeys(signal.landscape, LANDSCAPE_KEYS, `${where} landscape`, errors);
      requireString(signal.landscape, 'landscape_summary', `${where} landscape`, errors);
      if (!Array.isArray(signal.landscape.existing_solutions)) {
        errors.push(`${where} landscape: existing_solutions must be an array`);
      } else {
        for (const [solutionIndex, solution] of signal.landscape.existing_solutions.entries()) {
          const solutionWhere = `${where} landscape existing_solutions[${solutionIndex}]`;
          if (!isRecord(solution)) {
            errors.push(`${solutionWhere}: solution must be an object`);
            continue;
          }
          rejectUnknownKeys(solution, SOLUTION_KEYS, solutionWhere, errors);
          requireString(solution, 'name', solutionWhere, errors);
          const hasSolutionUrl = requireString(solution, 'url', solutionWhere, errors);
          requireString(solution, 'gap', solutionWhere, errors);
          if (hasSolutionUrl) {
            try {
              new URL(solution.url);
            } catch {
              errors.push(`${solutionWhere}: invalid url ${JSON.stringify(solution.url)}`);
            }
          }
        }
      }
    }

    const noFreePattern = /no (open )?free (tier|way|option|alternative|plan)/i;
    const summaryText = `${signal.summary ?? ''} ${signal.landscape?.landscape_summary ?? ''}`;
    if (noFreePattern.test(summaryText)) {
      warnings.push(`${where}: verify every "no free" claim and disclose hardship or waiver programs`);
    }
  }

  return {errors, warnings};
}

export function validateSignalFile(file, {strict = false} = {}) {
  // Read the date off the file name only; a date-looking directory somewhere
  // up the path (backups/2024-01-01/...) must not become the staging day.
  const baseName = file.split(/[\\/]/).pop() ?? file;
  const stagingDay = baseName.match(/(\d{4}-\d{2}-\d{2})/)?.[1]
    ?? new Date().toISOString().slice(0, 10);
  let data;

  try {
    data = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    return {
      data: null,
      errors: [`could not parse ${file}: ${error.message}`],
      warnings: [],
      stagingDay,
      strict,
    };
  }

  return {
    data,
    ...validateSignals(data, {stagingDay}),
    stagingDay,
    strict,
  };
}

export async function runValidationCli(args) {
  // Accept several files so a caller can pass a glob. Taking only the first
  // and ignoring the rest would let `content/published/*.json` report OK while
  // silently skipping every batch but one.
  const flags = args.filter(arg => arg.startsWith('--'));
  const files = args.filter(arg => !arg.startsWith('--'));
  if (files.length === 0) {
    console.error('usage: validate-staging.mjs <path/to/signals.json...> [--strict]');
    process.exitCode = 2;
    return;
  }

  const strict = flags.includes('--strict');
  let total = 0;
  let failed = false;

  for (const file of files) {
    const result = validateSignalFile(file, {strict});
    const label = files.length > 1 ? `${file}: ` : '';
    if (result.warnings.length > 0) {
      console.error(`\n${label}${result.warnings.length} warning(s):`);
      for (const warning of result.warnings) console.error(`  WARN ${warning}`);
    }
    if (result.errors.length > 0) {
      console.error(`\n${label}${result.errors.length} error(s):`);
      for (const error of result.errors) console.error(`  ERROR ${error}`);
      failed = true;
      continue;
    }
    if (result.strict && result.warnings.length > 0) {
      failed = true;
      continue;
    }
    total += result.data.length;
  }

  if (failed) {
    process.exitCode = 1;
    return;
  }

  const scope = files.length > 1 ? ` across ${files.length} file(s)` : '';
  console.error(`\nOK: ${total} signal(s) validated${scope}.`);
}
