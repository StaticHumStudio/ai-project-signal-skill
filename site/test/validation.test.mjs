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
      existing_solutions: [],
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
