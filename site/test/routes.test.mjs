import assert from 'node:assert/strict';
import test from 'node:test';

import {
  claimUniqueSlug,
  normalizeRouteSource,
  stableRouteSlug,
  slugifyRoute,
} from '../src/utils/routes.js';

test('category punctuation becomes a safe route', () => {
  assert.equal(
    slugifyRoute('privacy / local-first', 'category'),
    'privacy-local-first',
  );
});

test('non-Latin titles retain Unicode letters', () => {
  assert.equal(slugifyRoute('レシピ管理', 'signal'), 'レシピ管理');
});

test('punctuation-only titles receive a deterministic fallback', () => {
  const first = slugifyRoute('!!!', 'signal');
  assert.match(first, /^signal-[0-9a-f]{8}$/);
  assert.equal(slugifyRoute('!!!', 'signal'), first);
});

test('duplicate slugs receive stable numeric suffixes', () => {
  const counts = new Map();
  assert.equal(claimUniqueSlug('Same title', counts, 'signal'), 'same-title');
  assert.equal(claimUniqueSlug('Same title', counts, 'signal'), 'same-title-2');
});

test('generated suffixes skip naturally claimed numbered slugs', () => {
  const counts = new Map();
  assert.equal(claimUniqueSlug('Foo', counts, 'signal'), 'foo');
  assert.equal(claimUniqueSlug('Foo-2', counts, 'signal'), 'foo-2');
  assert.equal(claimUniqueSlug('Foo', counts, 'signal'), 'foo-3');
});

test('category routes cannot be stolen by a later colliding label', () => {
  const existingRoute = stableRouteSlug('foo-bar', 'category');
  const laterRoute = stableRouteSlug('foo bar', 'category');

  assert.notEqual(existingRoute, laterRoute);
  assert.equal(stableRouteSlug('foo-bar', 'category'), existingRoute);
});

test('distinct category labels remain distinct after normalization', () => {
  assert.notEqual(
    stableRouteSlug('AI', 'category'),
    stableRouteSlug('ai', 'category'),
  );
});

test('case variants of a label share a route once normalized', () => {
  assert.equal(
    stableRouteSlug(normalizeRouteSource('SaaS'), 'category'),
    stableRouteSlug(normalizeRouteSource('saas'), 'category'),
  );
});
