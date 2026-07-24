import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

import {validateSignals} from '../../method/validate-signals.mjs';

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

test('unknown fields are rejected to match the schema', () => {
  const invalid = {...makeSignal(), private_note: 'not public'};
  assert.match(
    validateSignals([invalid], {stagingDay: '2026-07-24'}).errors[0],
    /private_note/,
  );
});
