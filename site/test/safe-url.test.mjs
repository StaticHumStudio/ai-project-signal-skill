import assert from 'node:assert/strict';
import test from 'node:test';

import {safeUrl} from '../src/utils/safeUrl.js';

test('safe URL schemes survive unchanged', () => {
  assert.equal(safeUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(safeUrl('mailto:hello@example.com'), 'mailto:hello@example.com');
});

test('executable schemes are neutralized', () => {
  assert.equal(safeUrl('javascript:alert(1)'), '#');
  assert.equal(safeUrl('data:text/html,<script>alert(1)</script>'), '#');
});

test('control characters cannot disguise an executable scheme', () => {
  assert.equal(safeUrl('java\tscript:alert(1)'), '#');
});
