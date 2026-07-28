import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {joinBase} from '../src/utils/paths.js';

test('a configured base is prefixed onto internal routes', () => {
  assert.equal(joinBase('/signal', '/s/example/'), '/signal/s/example/');
  assert.equal(joinBase('/signal/', 's/example/'), '/signal/s/example/');
  assert.equal(joinBase('/signal', '/'), '/signal/');
  assert.equal(joinBase('/signal', ''), '/signal/');
});

test('a root base leaves internal routes unprefixed', () => {
  assert.equal(joinBase('/', '/s/example/'), '/s/example/');
  assert.equal(joinBase('/', '/'), '/');
  assert.equal(joinBase('/', '/rss.xml'), '/rss.xml');
});

test('the RSS channel link points at the site home, not the domain root', () => {
  // `context.site` is the bare origin, so handing it to rss() straight makes
  // feed readers' "visit site" link land on a 404 whenever base isn't '/'.
  const rssRoute = fs.readFileSync(new URL('../src/pages/rss.xml.ts', import.meta.url), 'utf8');
  const siteOption = rssRoute.match(/^\s*site:.*$/m)?.[0] ?? '';

  assert.match(siteOption, /withBase\(/);
});

test('no page source hard-codes the default base path', () => {
  const srcDir = new URL('../src/', import.meta.url);
  const offenders = [];

  for (const file of fs.readdirSync(srcDir, {recursive: true})) {
    if (!/\.(astro|ts|js)$/.test(file)) continue;
    if (file.endsWith('utils/paths.js')) continue;
    const body = fs.readFileSync(new URL(file, srcDir), 'utf8');
    if (body.includes('/signal/')) offenders.push(file);
  }

  assert.deepEqual(offenders, []);
});
