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

test('solutions may carry a does line, and nothing else new', () => {
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
    ['does', 'gap', 'name', 'url'],
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
