import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const homepage = fs.readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
const rss = fs.readFileSync(new URL('../src/pages/rss.xml.ts', import.meta.url), 'utf8');
const footer = fs.readFileSync(new URL('../src/components/SignalFooter.astro', import.meta.url), 'utf8');
const publicCopy = `${homepage}\n${rss}\n${footer}`;

test('the bundled site presents itself as a synthetic demo', () => {
  assert.match(publicCopy, /synthetic/i);
  assert.match(publicCopy, /example/i);
  assert.match(footer, /open.source example/i);
});

test('the bundled site makes no unsupported live-service claims', () => {
  for (const claim of ['10 new daily', 'Updated daily', '40+ communities']) {
    assert.doesNotMatch(publicCopy, new RegExp(claim, 'i'));
  }
});
