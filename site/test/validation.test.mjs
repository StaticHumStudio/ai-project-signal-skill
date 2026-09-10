import assert from 'node:assert/strict';
import {mkdtemp, readFile, mkdir, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {validateSignalFile, validateSignals} from '../../method/validate-signals.mjs';

function makeSignal() {
  return {
    title: 'Example',
    summary: 'A complete signal.',
    sources: [{
      url: 'https://example.com/thread',
      platform: 'other',
      quote: 'I need this.',
      date: '2026-07-24',
    }],
    landscape: {
      // Two entries because a complete signal has a real landscape. Tests that
      // care about a thin one set it themselves.
      existing_solutions: [
        {
          name: 'SomeTool',
          url: 'https://example.com/sometool',
          does: 'Local-first note taking with an encrypted export.',
          gap: 'No ingredient parsing or scaling.',
        },
        {
          name: 'OtherTool',
          url: 'https://example.com/othertool',
          gap: 'Cloud only, no export.',
        },
      ],
      landscape_summary: 'No complete solution.',
    },
    category: 'other',
    difficulty: 'real_project',
    demand_strength: 'single_request',
  };
}

test('schema and validator require the same source fields', async () => {
  const schema = JSON.parse(await readFile(
    new URL('../../method/schema.json', import.meta.url),
    'utf8',
  ));
  assert.deepEqual(
    schema.properties.sources.items.required,
    ['url', 'platform', 'quote', 'date'],
  );

  const invalid = makeSignal();
  delete invalid.sources[0].quote;
  assert.match(
    validateSignals([invalid], {stagingDay: '2026-07-24'}).errors[0],
    /quote/,
  );
});

test('a complete signal passes hard validation', () => {
  assert.deepEqual(
    validateSignals([makeSignal()], {stagingDay: '2026-07-24'}).errors,
    [],
  );
});

test('published files must contain one to ten signals', () => {
  assert.match(
    validateSignals([], {stagingDay: '2026-07-24'}).errors[0],
    /1 to 10/,
  );
});

test('no vendor domains are flagged unless the caller supplies them', () => {
  const signal = makeSignal();
  signal.sources[0].url = 'https://some-vendor.example/blog/best-alternatives';

  assert.deepEqual(
    validateSignals([signal], {stagingDay: '2026-07-24'}).warnings,
    [],
  );

  assert.match(
    validateSignals([signal], {
      stagingDay: '2026-07-24',
      vendorDomains: ['some-vendor.example'],
    }).warnings.join(' '),
    /vendor-domain watchlist/,
  );
});

test('landscape solution urls must parse, like source urls', () => {
  const invalid = makeSignal();
  invalid.landscape.existing_solutions = [{
    name: 'SomeTool',
    url: 'see their website',
    gap: 'No offline mode.',
  }];
  assert.match(
    validateSignals([invalid], {stagingDay: '2026-07-24'}).errors[0],
    /invalid url "see their website"/,
  );
});

test('a thin landscape warns without failing hard validation', () => {
  // The rubric asks for every credible competitor, not just the closest one.
  // A one-entry landscape is usually a search that stopped early, but some
  // gaps really are that empty, so this stays a warning the strict runs catch.
  const thin = makeSignal();
  thin.landscape.existing_solutions = [{
    name: 'SomeTool',
    url: 'https://example.com/sometool',
    gap: 'No offline mode.',
  }];

  const result = validateSignals([thin], {stagingDay: '2026-07-24'});
  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join('\n'), /only 1 existing solution/);

  const empty = makeSignal();
  empty.landscape.existing_solutions = [];
  assert.match(
    validateSignals([empty], {stagingDay: '2026-07-24'}).warnings.join('\n'),
    /only 0 existing solution/,
  );
});

test('solutions allow does but reject unrelated fields', () => {
  const signal = makeSignal();
  signal.landscape.existing_solutions = [
    {
      name: 'SomeTool',
      url: 'https://example.com/sometool',
      does: 'Local-first note taking with an encrypted export.',
      gap: 'No ingredient parsing or scaling.',
    },
    {
      name: 'OtherTool',
      url: 'https://example.com/othertool',
      gap: 'Cloud only, no export.',
    },
  ];
  assert.deepEqual(
    validateSignals([signal], {stagingDay: '2026-07-24'}).errors,
    [],
  );

  signal.landscape.existing_solutions[0].pricing = '$3/mo';
  assert.match(
    validateSignals([signal], {stagingDay: '2026-07-24'}).errors[0],
    /pricing/,
  );
});

test('a does line that is present must be a real one', () => {
  // `does` is optional, so it was allowlisted without being checked. That let a
  // number or an empty string reach the site loader, which trusts this
  // validator and renders whatever it is handed.
  for (const bad of ['', '   ', 12, null, [], {}]) {
    const signal = makeSignal();
    signal.landscape.existing_solutions[0].does = bad;
    assert.match(
      validateSignals([signal], {stagingDay: '2026-07-24'}).errors[0] ?? '',
      /does must be a non-empty string/,
      `does: ${JSON.stringify(bad)} should have been rejected`,
    );
  }

  // Absent stays legal, since the schema marks it optional.
  const signal = makeSignal();
  delete signal.landscape.existing_solutions[0].does;
  assert.deepEqual(
    validateSignals([signal], {stagingDay: '2026-07-24'}).errors,
    [],
  );
});

test('schema and validator agree on the solution fields', async () => {
  const schema = JSON.parse(await readFile(
    new URL('../../method/schema.json', import.meta.url),
    'utf8',
  ));
  const solution = schema.properties.landscape.properties
    .existing_solutions.items;

  assert.deepEqual(solution.required, ['name', 'url', 'gap']);
  assert.deepEqual(
    Object.keys(solution.properties).sort(),
    ['does', 'gap', 'gap_evidence', 'gap_status', 'name', 'url'],
  );
});

test('staging day comes from the file name, not the directory path', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'signal-validate-'));
  const decoyDir = path.join(root, '2024-01-01');
  await mkdir(decoyDir);

  const signal = makeSignal();
  signal.sources[0].date = '2026-07-20';
  const file = path.join(decoyDir, '2026-07-24.json');
  await writeFile(file, JSON.stringify([signal]));

  const result = validateSignalFile(file);
  assert.equal(result.stagingDay, '2026-07-24');
  assert.deepEqual(result.errors, []);
});

test('unknown fields are rejected to match the schema', () => {
  const invalid = {...makeSignal(), private_note: 'not public'};
  assert.match(
    validateSignals([invalid], {stagingDay: '2026-07-24'}).errors[0],
    /private_note/,
  );
});

const evidenceFixture = JSON.parse(await readFile(
  new URL('./fixtures/evidence-signal.json', import.meta.url), 'utf8',
));
const evidenceOptions = {stagingDay: '2026-09-10'};
const makeEvidenceSignal = () => structuredClone(evidenceFixture);

test('legacy signals pass without evidence metadata or warnings', () => {
  assert.deepEqual(validateSignals([makeSignal()], {stagingDay: '2026-07-24'}),
    {errors: [], warnings: []});
});

test('historical supporting context and paired competitor citations pass', () => {
  assert.deepEqual(validateSignals([makeEvidenceSignal()], evidenceOptions),
    {errors: [], warnings: []});
});

const invalidSupportCases = [
  ['missing corroboration', s => {delete s.supporting_sources[0].corroborated_by;}, /corroborated_by/],
  ['empty corroboration', s => {s.supporting_sources[0].corroborated_by = [];}, /corroborated_by/],
  ['duplicate corroboration', s => {s.supporting_sources[0].corroborated_by.push(s.sources[0].url);}, /unique/],
  ['self reference', s => {s.supporting_sources[0].corroborated_by = [s.supporting_sources[0].url];}, /itself/],
  ['supporting reference', s => {s.supporting_sources.push({...s.supporting_sources[0], url: 'https://example.com/old'}); s.supporting_sources[0].corroborated_by = ['https://example.com/old'];}, /another supporting source/],
  ['missing primary reference', s => {s.supporting_sources[0].corroborated_by = ['https://example.com/missing'];}, /primary/],
  ['ambiguous primary reference', s => {s.sources.push({...s.sources[0]});}, /exactly one/],
  ['15 day old corroborator', s => {s.sources[0].date = '2026-08-26';}, /corroborat.*14 days/],
  ['future corroborator', s => {s.sources[0].date = '2026-09-11';}, /corroborat.*future/],
  ['invalid corroborator date', s => {s.sources[0].date = '2026-02-30';}, /corroborat.*calendar/],
  ['missing primaries', s => {s.sources = [];}, /corroborat.*primary/],
  ['impossible publication date', s => {s.supporting_sources[0].date = '2025-02-29';}, /supporting_sources.*calendar/],
  ['future publication date', s => {s.supporting_sources[0].date = '2026-09-11';}, /supporting_sources.*future/],
  ['blank quote', s => {s.supporting_sources[0].quote = ' ';}, /quote/],
  ['unknown source field', s => {s.supporting_sources[0].unexpected = true;}, /unknown field/],
  ['nonarray support', s => {s.supporting_sources = {};}, /supporting_sources.*array/],
  ['nonobject support', s => {s.supporting_sources = [null];}, /supporting_sources.*object/],
  ['bad engagement', s => {s.supporting_sources[0].engagement = 1;}, /engagement/],
];
for (const [name, mutate, expected] of invalidSupportCases) {
  test(`supporting evidence rejects ${name}`, () => {
    const signal = makeEvidenceSignal();
    mutate(signal);
    assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), expected);
  });
}

test('a corroborator exactly 14 days old is accepted', () => {
  const signal = makeEvidenceSignal();
  signal.sources[0].date = '2026-08-27';
  assert.deepEqual(validateSignals([signal], evidenceOptions), {errors: [], warnings: []});
});

const invalidStatusCases = [
  ['missing issue status', s => {delete s.issue_status;}, /issue_status/],
  ['nonobject issue status', s => {s.issue_status = null;}, /issue_status.*object/],
  ['missing check date', s => {delete s.issue_status.checked;}, /checked/],
  ['invalid check date', s => {s.issue_status.checked = '2026-04-31';}, /calendar/],
  ['future check date', s => {s.issue_status.checked = '2026-09-11';}, /future/],
  ['missing closure reason', s => {delete s.issue_status.closure_reason;}, /closure_reason/],
  ['invalid closure reason', s => {s.issue_status.closure_reason = 'wontfix';}, /closure_reason/],
  ['known reason without evidence', s => {delete s.issue_status.evidence;}, /evidence/],
  ['invalid state', s => {s.issue_status.state = 'resolved';}, /state/],
  ['closure fields on open', s => {s.issue_status.state = 'open';}, /closed/],
  ['closure fields on unknown', s => {s.issue_status.state = 'unknown';}, /closed/],
  ['unknown status field', s => {s.issue_status.intent = 'ignored';}, /unknown field/],
];
for (const [name, mutate, expected] of invalidStatusCases) {
  test(`supporting GitHub issue rejects ${name}`, () => {
    const signal = makeEvidenceSignal();
    mutate(signal.supporting_sources[0]);
    assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), expected);
  });
}

for (const state of ['open', 'unknown']) {
  test(`supporting GitHub ${state} state needs no closure reason`, () => {
    const signal = makeEvidenceSignal();
    signal.supporting_sources[0].issue_status = {state, checked: '2026-09-10'};
    assert.deepEqual(validateSignals([signal], evidenceOptions), {errors: [], warnings: []});
  });
}
for (const closure_reason of ['completed', 'not_planned', 'automatic_stale', 'unknown']) {
  test(`closed supporting issue accepts ${closure_reason} closure context`, () => {
    const signal = makeEvidenceSignal();
    signal.supporting_sources[0].issue_status.closure_reason = closure_reason;
    if (closure_reason === 'unknown') delete signal.supporting_sources[0].issue_status.evidence;
    assert.deepEqual(validateSignals([signal], evidenceOptions), {errors: [], warnings: []});
  });
}

test('supporting GitHub issue comments need status regardless of platform label', () => {
  const signal = makeEvidenceSignal();
  signal.supporting_sources[0].url += '#issuecomment-456';
  signal.supporting_sources[0].platform = 'other';
  delete signal.supporting_sources[0].issue_status;
  assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), /issue_status/);
});

test('a historical discussion outside GitHub needs no issue status', () => {
  const signal = makeEvidenceSignal();
  signal.supporting_sources[0].url = 'https://example.com/history';
  delete signal.supporting_sources[0].issue_status;
  assert.deepEqual(validateSignals([signal], evidenceOptions), {errors: [], warnings: []});
});

for (const [name, mutate, expected] of [
  ['verified gap without citations', s => {s.gap_evidence = [];}, /evidence/],
  ['missing gap status', s => {delete s.gap_status;}, /gap_status/],
  ['missing gap evidence', s => {delete s.gap_evidence;}, /gap_evidence/],
  ['invalid gap status', s => {s.gap_status = 'probably';}, /gap_status/],
  ['nonarray gap evidence', s => {s.gap_evidence = {};}, /gap_evidence.*array/],
]) {
  test(`competitor rejects ${name}`, () => {
    const signal = makeEvidenceSignal();
    mutate(signal.landscape.existing_solutions[0]);
    assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), expected);
  });
}

for (const location of ['gap', 'closure']) {
  for (const [name, mutate, expected] of [
    ['blank quote', c => {c.quote = ' ';}, /quote/],
    ['missing URL', c => {delete c.url;}, /url/],
    ['missing checked date', c => {delete c.checked;}, /checked/],
    ['impossible checked date', c => {c.checked = '2026-02-29';}, /calendar/],
    ['future checked date', c => {c.checked = '2026-09-11';}, /future/],
    ['unknown field', c => {c.extra = true;}, /unknown field/],
  ]) {
    test(`${location} citation rejects ${name}`, () => {
      const signal = makeEvidenceSignal();
      const citation = location === 'gap' ? signal.landscape.existing_solutions[0].gap_evidence[0]
        : signal.supporting_sources[0].issue_status.evidence;
      mutate(citation);
      assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), expected);
    });
  }
  test(`${location} citation rejects nonobjects`, () => {
    const signal = makeEvidenceSignal();
    if (location === 'gap') signal.landscape.existing_solutions[0].gap_evidence = [null];
    else signal.supporting_sources[0].issue_status.evidence = null;
    assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), /citation must be an object/);
  });
}

for (const url of ['javascript:alert(1)', 'data:text/plain,test', 'file:///tmp/source', '/relative', '//example.com/source', 'https:example.com', 'https:///example.com', ' https://example.com']) {
  for (const location of ['supporting', 'corroboration', 'gap', 'closure']) {
    test(`${location} URL rejects ${JSON.stringify(url)}`, () => {
      const signal = makeEvidenceSignal();
      if (location === 'supporting') signal.supporting_sources[0].url = url;
      if (location === 'corroboration') {
        signal.sources[0].url = url;
        signal.supporting_sources[0].corroborated_by = [url];
      }
      if (location === 'gap') signal.landscape.existing_solutions[0].gap_evidence[0].url = url;
      if (location === 'closure') signal.supporting_sources[0].issue_status.evidence.url = url;
      assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), /absolute HTTP or HTTPS/);
    });
  }
}

test('corroboration cannot reuse another supporting source even when listed as primary', () => {
  const signal = makeEvidenceSignal();
  signal.supporting_sources.push({
    url: signal.sources[0].url, platform: 'other', quote: 'Repeated historical claim.',
    date: '2025-01-01', corroborated_by: ['https://example.com/second-current'],
  });
  signal.sources.push({...signal.sources[0], url: 'https://example.com/second-current'});
  assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), /another supporting source/);
});

const githubIssueUrls = [
  'https://github.com/example/example/issues/123',
  'https://github.com/example/example/issues/123#issuecomment-456',
  'https://github.com/example/example/issues/123?notification_referrer_id=1',
  'HTTPS://WWW.GITHUB.COM/example/example/issues/123',
  'https://github.com:443/example/example/issues/123',
  'https://reader@github.com/example/example/issues/123',
  'https://api.github.com/repos/example/example/issues/123',
  'https://api.github.com/repos/example/example/issues/comments/456',
];
test('schema and runtime require issue status for GitHub issue URL variants', async () => {
  const schema = JSON.parse(await readFile(new URL('../../method/schema.json', import.meta.url), 'utf8'));
  const issueUrlPattern = new RegExp(schema.definitions.supportingSource.allOf[0].if.properties.url.pattern);
  for (const url of githubIssueUrls) {
    assert.equal(issueUrlPattern.test(url), true, `schema should recognize ${url}`);
    const signal = makeEvidenceSignal();
    signal.supporting_sources[0].url = url;
    delete signal.supporting_sources[0].issue_status;
    assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), /issue_status/, url);
  }
  assert.equal(issueUrlPattern.test('https://github.com/example/example/discussions/123'), false);
  assert.equal(issueUrlPattern.test('https://github.com.example.org/example/example/issues/123'), false);
});

for (const url of [
  'https://api.github.com/repos/example/example/issues/123',
  'https://api.github.com/repos/example/example/issues/comments/456',
]) {
  test(`supporting API citation needs current issue status: ${url}`, () => {
    const signal = makeEvidenceSignal();
    signal.supporting_sources[0].url = url;
    delete signal.supporting_sources[0].issue_status;
    assert.match(validateSignals([signal], evidenceOptions).errors.join('\n'), /issue_status/);
  });
}
