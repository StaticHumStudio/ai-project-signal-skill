import assert from 'node:assert/strict';
import test from 'node:test';

import {
  claimUniqueSlug,
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
