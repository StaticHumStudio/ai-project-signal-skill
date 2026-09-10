import {readFileSync} from 'node:fs';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

const SIGNAL_KEYS = new Set([
  'title',
  'summary',
  'sources',
  'supporting_sources',
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
const SUPPORTING_SOURCE_KEYS = new Set([...SOURCE_KEYS, 'corroborated_by', 'issue_status']);
const CITATION_KEYS = new Set(['url', 'quote', 'checked']);
const ISSUE_STATUS_KEYS = new Set(['state', 'checked', 'closure_reason', 'evidence']);
const ISSUE_STATES = new Set(['open', 'closed', 'unknown']);
const CLOSURE_REASONS = new Set(['completed', 'not_planned', 'automatic_stale', 'unknown']);
const LANDSCAPE_KEYS = new Set([
  'existing_solutions',
  'landscape_summary',
]);
const SOLUTION_KEYS = new Set(['name', 'url', 'does', 'gap', 'gap_status', 'gap_evidence']);

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

// `does` is optional in schema.json but still typed there, so an entry that
// carries it must carry a real one. Allowlisting the key without checking its
// value let `"does": 12` and `"does": ""` through to the site loader, which
// trusts this validator and renders whatever it gets.
function optionalString(value, field, where, errors) {
  if (value?.[field] === undefined) return;
  requireString(value, field, where, errors);
}

function requireEvidenceDate(value, field, where, today, errors) {
  if (!requireString(value, field, where, errors)) return null;
  const date = parseStrictDate(value[field]);
  if (!date) {
    errors.push(`${where}: ${field} must be a real calendar day in YYYY-MM-DD`);
  } else if (date > today) {
    errors.push(`${where}: ${field} cannot be in the future after the staging day`);
  }
  return date;
}

function requireEvidenceUrl(value, where, errors) {
  try {
    if (typeof value !== 'string' || !/^https?:\/\/[^/\s]/i.test(value) || /\s/.test(value)) {
      throw new Error('not an absolute HTTP URL');
    }
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname) {
      throw new Error('not an absolute HTTP URL');
    }
    return url;
  } catch {
    errors.push(`${where}: url must be an absolute HTTP or HTTPS URL`);
    return null;
  }
}

function validateCitation(citation, where, today, errors) {
  if (!isRecord(citation)) {
    errors.push(`${where}: citation must be an object`);
    return;
  }
  rejectUnknownKeys(citation, CITATION_KEYS, where, errors);
  requireEvidenceUrl(citation.url, where, errors);
  requireString(citation, 'quote', where, errors);
  requireEvidenceDate(citation, 'checked', where, today, errors);
}

function validateIssueStatus(status, where, today, errors) {
  if (!isRecord(status)) {
    errors.push(`${where}: issue_status must be an object`);
    return;
  }
  rejectUnknownKeys(status, ISSUE_STATUS_KEYS, where, errors);
  if (!ISSUE_STATES.has(status.state)) {
    errors.push(`${where}: state must be open, closed, or unknown`);
  }
  requireEvidenceDate(status, 'checked', where, today, errors);
  if (status.state === 'closed') {
    if (!CLOSURE_REASONS.has(status.closure_reason)) {
      errors.push(`${where}: closure_reason must be completed, not_planned, automatic_stale, or unknown`);
    }
    if (CLOSURE_REASONS.has(status.closure_reason) && status.closure_reason !== 'unknown'
      && status.evidence === undefined) {
      errors.push(`${where}: a known closure_reason requires evidence`);
    }
  } else if (status.closure_reason !== undefined || status.evidence !== undefined) {
    errors.push(`${where}: closure_reason and evidence are only allowed for a closed issue`);
  }
  if (status.evidence !== undefined) {
    validateCitation(status.evidence, `${where} evidence`, today, errors);
  }
}

function validateGapEvidence(solution, where, today, errors) {
  if (solution.gap_status === undefined && solution.gap_evidence === undefined) return;
  if (!['verified', 'unverified'].includes(solution.gap_status)) {
    errors.push(`${where}: gap_status must be verified or unverified when gap_evidence is present`);
  }
  if (!Array.isArray(solution.gap_evidence)) {
    errors.push(`${where}: gap_evidence must be an array when gap_status is present`);
    return;
  }
  if (solution.gap_status === 'verified' && solution.gap_evidence.length === 0) {
    errors.push(`${where}: verified gap requires at least one gap_evidence citation`);
  }
  for (const [index, citation] of solution.gap_evidence.entries()) {
    validateCitation(citation, `${where} gap_evidence[${index}]`, today, errors);
  }
}

function validateSupportingSources(signal, where, today, errors) {
  if (signal.supporting_sources === undefined) return;
  if (!Array.isArray(signal.supporting_sources)) {
    errors.push(`${where}: supporting_sources must be an array`);
    return;
  }
  const primarySources = Array.isArray(signal.sources) ? signal.sources : [];
  for (const [index, source] of signal.supporting_sources.entries()) {
    const sourceWhere = `${where} supporting_sources[${index}]`;
    if (!isRecord(source)) {
      errors.push(`${sourceWhere}: source must be an object`);
      continue;
    }
    rejectUnknownKeys(source, SUPPORTING_SOURCE_KEYS, sourceWhere, errors);
    for (const field of ['platform', 'quote']) requireString(source, field, sourceWhere, errors);
    const url = requireEvidenceUrl(source.url, sourceWhere, errors);
    const host = url?.hostname.replace(/^www\./, '');
    const isGithubIssue = url && (
      (host === 'github.com' && /^\/[^/]+\/[^/]+\/issues\/\d+(?:\/|$)/.test(url.pathname))
      || (host === 'api.github.com' && /^\/repos\/[^/]+\/[^/]+\/issues\/(?:comments\/)?\d+(?:\/|$)/.test(url.pathname))
    );
    if (isGithubIssue || source.issue_status !== undefined) {
      validateIssueStatus(source.issue_status, `${sourceWhere} issue_status`, today, errors);
    }
    requireEvidenceDate(source, 'date', sourceWhere, today, errors);
    if (source.engagement !== undefined && typeof source.engagement !== 'string') {
      errors.push(`${sourceWhere}: engagement must be a string`);
    }
    if (!Array.isArray(source.corroborated_by) || source.corroborated_by.length === 0) {
      errors.push(`${sourceWhere}: corroborated_by must be a nonempty array of primary source URLs`);
      continue;
    }
    if (new Set(source.corroborated_by).size !== source.corroborated_by.length) {
      errors.push(`${sourceWhere}: corroborated_by URLs must be unique`);
    }
    for (const url of source.corroborated_by) {
      const referenceWhere = `${sourceWhere} corroborated_by ${JSON.stringify(url)}`;
      if (!requireEvidenceUrl(url, referenceWhere, errors)) continue;
      if (url === source.url) {
        errors.push(`${referenceWhere}: supporting evidence cannot corroborate itself`);
        continue;
      }
      if (signal.supporting_sources.some(supporting => isRecord(supporting) && supporting.url === url)) {
        errors.push(`${referenceWhere}: cannot corroborate with another supporting source`);
        continue;
      }
      const matches = primarySources.filter(primary => isRecord(primary) && primary.url === url);
      if (matches.length !== 1) {
        errors.push(`${referenceWhere}: must reference exactly one primary source`);
        continue;
      }
      const date = requireEvidenceDate(matches[0], 'date', referenceWhere, today, errors);
      if (date && today - date > FOURTEEN_DAYS) {
        errors.push(`${referenceWhere}: corroborating source must be within 14 days of the staging day`);
      }
    }
  }
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

    validateSupportingSources(signal, where, today, errors);

    if (!isRecord(signal.landscape)) {
      errors.push(`${where}: landscape must be an object`);
    } else {
      rejectUnknownKeys(signal.landscape, LANDSCAPE_KEYS, `${where} landscape`, errors);
      requireString(signal.landscape, 'landscape_summary', `${where} landscape`, errors);
      if (!Array.isArray(signal.landscape.existing_solutions)) {
        errors.push(`${where} landscape: existing_solutions must be an array`);
      } else {
        // A one-entry landscape is usually an unfinished search rather than an
        // empty field. It reads as "we found the obvious competitor and
        // stopped", which is the shape a reader cannot check for themselves.
        // A warning, not an error: some gaps really are that empty, and the
        // rubric asks you to say so in landscape_summary when they are.
        if (signal.landscape.existing_solutions.length < 2) {
          warnings.push(
            `${where} landscape: only ${signal.landscape.existing_solutions.length} existing solution(s). ` +
            'List every credible option you found, or say in landscape_summary what you searched and why nothing else came back.'
          );
        }
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
          optionalString(solution, 'does', solutionWhere, errors);
          validateGapEvidence(solution, solutionWhere, today, errors);
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
  // Accept a glob. Using only the first argument let `published/*.json` report
  // OK while skipping every batch but one.
  const flags = args.filter(arg => arg.startsWith('--'));
  const files = args.filter(arg => !arg.startsWith('--'));
  if (files.length === 0) {
    console.error('usage: validate-signals.mjs <path/to/signals.json...> [--strict]');
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
