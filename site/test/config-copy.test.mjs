import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { siteConfig } from '../src/config.js';

const SRC = fileURLToPath(new URL('../src', import.meta.url));
const CONFIG = join(SRC, 'config.js');

function sourceFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
      continue;
    }
    if (/\.(astro|ts|js)$/.test(entry) && full !== CONFIG) out.push(full);
  }
  return out;
}

const FILES = sourceFiles(SRC).map(path => ({
  path: relative(SRC, path),
  text: readFileSync(path, 'utf8'),
}));

test('config exposes the strings the templates read from it', () => {
  const { brand, meta, hero, rss, seo, sections } = siteConfig;

  for (const [key, value] of Object.entries(brand)) {
    if (value === null) continue;
    assert.equal(typeof value, 'string', `brand.${key} must be a string or null`);
    assert.ok(value.length > 0, `brand.${key} must not be empty`);
  }

  for (const [key, value] of Object.entries(meta)) {
    assert.ok(value.length > 0, `meta.${key} must not be empty`);
  }

  for (const key of ['overline', 'headline', 'subhead', 'blurb', 'note']) {
    assert.equal(typeof hero[key], 'string', `hero.${key} must be a string`);
    assert.ok(hero[key].length > 0, `hero.${key} must not be empty`);
  }
  for (const key of ['signals', 'batches', 'sources']) {
    assert.ok(hero.stats[key].length > 0, `hero.stats.${key} must not be empty`);
  }

  for (const key of ['title', 'description', 'linkTitle']) {
    assert.ok(rss[key].length > 0, `rss.${key} must not be empty`);
  }

  assert.ok(seo.keywords.length > 0, 'seo.keywords must not be empty');
  assert.ok(seo.faq.length > 0, 'seo.faq must not be empty');
  for (const entry of seo.faq) {
    assert.ok(entry.question.length > 0, 'every faq entry needs a question');
    assert.ok(entry.answer.length > 0, 'every faq entry needs an answer');
  }

  for (const name of ['signals', 'batches']) {
    assert.ok(sections[name].heading.length > 0, `sections.${name} needs a heading`);
  }
  for (const name of ['searchIntent', 'about']) {
    assert.ok(sections[name].heading.length > 0, `sections.${name} needs a heading`);
    assert.ok(sections[name].body.length > 0, `sections.${name} needs body copy`);
  }
  assert.ok(sections.process.steps.length > 0, 'process needs steps');
  for (const step of sections.process.steps) {
    for (const key of ['number', 'title', 'body']) {
      assert.ok(step[key].length > 0, `process step needs a ${key}`);
    }
  }
});

test('no brand identity is hardcoded outside config.js', () => {
  // A forker changes config.js and expects the whole site to follow. Any
  // owner-specific string living in a template silently survives that edit,
  // which is how an unchanged deploy ends up advertising somebody else.
  const OWNER_STRINGS = [/statichum\.studio/i, /static\s+hum/i];

  for (const file of FILES) {
    for (const pattern of OWNER_STRINGS) {
      assert.ok(
        !pattern.test(file.text),
        `${file.path} hardcodes ${pattern}. Move it into src/config.js.`
      );
    }
  }
});

test('no target or demo wording is hardcoded outside config.js', () => {
  // Two things a fork has to be able to change in one file. The method
  // retargets to books, physical products, videos, local services, so copy
  // that assumes software has to come from config. And the bundled data is
  // synthetic, so the words that say so have to come out when real research
  // replaces it, or the site calls its own signals fake forever.
  //
  // This is a blacklist, not a proof. Structural labels a fork keeps either
  // way ("sources", "landscape", "builder note", "browse by category") stay in
  // the templates on purpose; chasing every literal into config buys nothing
  // and costs readability.
  const BANNED = [
    /what should I code/i,
    /coding projects/i,
    /project ideas for developers/i,
    /indie developers/i,
    /\bsoftware\b/i,
    /\bdevelopers?\b/i,
    /example\s+(signals?|batches)/i,
    /demo\s+(signals?|batches|data)/i,
    /\bsynthetic\b/i,
  ];

  for (const file of FILES) {
    for (const pattern of BANNED) {
      assert.ok(
        !pattern.test(file.text),
        `${file.path} hardcodes ${pattern}. Move it into src/config.js.`
      );
    }
  }
});

test('rendered copy carries no em or en dashes', () => {
  // House style: no em dashes, no en dashes, in anything a reader sees. Every
  // published batch renders on the page, so check all of them and not just the
  // bundled fixture. A batch added later is exactly the one that slips through.
  const publishedDir = fileURLToPath(new URL('../content/published', import.meta.url));
  const batches = readdirSync(publishedDir)
    .filter(name => name.endsWith('.json'))
    .map(name => [
      `published/${name}`,
      JSON.parse(readFileSync(join(publishedDir, name), 'utf8'))
    ]);

  assert.ok(batches.length > 0, 'expected at least one published batch to check');

  for (const [source, tree] of [['config', siteConfig], ...batches]) {
    for (const [key, value] of Object.entries(flatten(tree))) {
      assert.ok(
        !/[—–]/.test(value),
        `${source}.${key} contains a dash character: ${value}`
      );
    }
  }
});

function flatten(value, prefix = '', out = {}) {
  if (typeof value === 'string') {
    out[prefix] = value;
    return out;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => flatten(item, `${prefix}[${i}]`, out));
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [key, inner] of Object.entries(value)) {
      flatten(inner, prefix ? `${prefix}.${key}` : key, out);
    }
  }
  return out;
}
