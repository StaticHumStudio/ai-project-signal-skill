import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SKILLS = join(ROOT, 'skills');
const METHOD = realpathSync(join(ROOT, 'method'));

const DIRS = readdirSync(SKILLS).filter(entry =>
  lstatSync(join(SKILLS, entry)).isDirectory(),
);

test('the repo ships both skills', () => {
  assert.deepEqual(
    DIRS.slice().sort(),
    ['audience-channel-research', 'demand-signal-research'],
  );
});

for (const dir of DIRS) {
  const base = join(SKILLS, dir);
  const skillPath = join(base, 'SKILL.md');

  test(`${dir}: frontmatter name matches the directory`, () => {
    // The installed directory name has to equal the frontmatter name, or the
    // tool loads a skill under one name and the docs describe another.
    assert.ok(existsSync(skillPath), `${dir}/SKILL.md is missing`);
    const text = readFileSync(skillPath, 'utf8');
    const name = text.match(/^---\r?\n(?:.*\r?\n)*?name:\s*(\S+)/)?.[1];
    assert.equal(name, dir);
  });

  test(`${dir}: shares the one copy of method/`, () => {
    // Each skill reaches the method through a symlink so an installed skill
    // stays self-contained without a second copy that can drift. A clone that
    // flattened the symlink (Windows without core.symlinks) fails here rather
    // than at the point where someone's assistant reads a path literal.
    const link = join(base, 'method');
    assert.ok(lstatSync(link).isSymbolicLink(), `${dir}/method is not a symlink`);
    assert.equal(realpathSync(link), METHOD);
  });

  test(`${dir}: every relative link resolves from the skill directory`, () => {
    const text = readFileSync(skillPath, 'utf8');
    const targets = [...text.matchAll(/\]\(([^)#\s]+)\)/g)]
      .map(match => match[1])
      .filter(target => !/^(https?:|mailto:)/.test(target));

    assert.ok(targets.length > 0, `${dir}/SKILL.md links to nothing`);
    for (const target of targets) {
      assert.ok(existsSync(join(base, target)), `${dir}/SKILL.md: ${target} does not resolve`);
    }
  });

  test(`${dir}: gates on the preflight page-access check`, () => {
    // Both methods produce confident fiction when the assistant cannot open
    // pages, so neither skill is allowed to ship without the gate.
    const text = readFileSync(skillPath, 'utf8').toLowerCase();
    assert.match(text, /preflight/);
    assert.match(text, /stop and say so|stop, quote nothing/);
  });
}

test('the channel schema stays valid and keeps its anchor requirements', () => {
  const schema = JSON.parse(
    readFileSync(join(ROOT, 'method', 'channels.schema.json'), 'utf8'),
  );

  // The verbatim rules quote is the whole point of the channel method. If
  // `rules` ever stops being required, the schema permits the exact output the
  // method exists to prevent: a venue recommendation nobody verified.
  assert.ok(schema.required.includes('rules'));
  assert.ok(schema.required.includes('pros'));
  assert.ok(schema.required.includes('cons'));
  assert.equal(schema.properties.cons.minItems, 1);

  const verdicts = schema.properties.rules.properties.verdict.enum;
  assert.deepEqual(verdicts, [
    'open_door',
    'conditional',
    'closed',
    'unwritten',
    'unverified',
  ]);

  // A verdict that claims to have read the page owes the reader the quote, the
  // URL, and the date. Without `checked`, an undated verdict is schema-valid
  // and nobody downstream can tell a fresh reading from a two-year-old one.
  const verified = schema.allOf.find(
    rule => rule.if?.properties?.rules?.properties?.verdict?.enum,
  );
  assert.deepEqual(
    verified.then.properties.rules.required,
    ['verdict', 'rules_url', 'quote', 'checked'],
  );
});

test('every HTML-output instruction carries the escaping rule', () => {
  // Researched text is attacker-authorable and the HTML path writes a file the
  // user opens in a browser. The rule lives in RUBRIC.md, but it only works if
  // each place that offers HTML actually points at it, and there are five.
  const files = [
    'method/PROMPT.md',
    'method/GUIDED.md',
    'method/CHANNELS.md',
    'skills/demand-signal-research/SKILL.md',
    'skills/audience-channel-research/SKILL.md',
  ];

  for (const file of files) {
    const text = readFileSync(join(ROOT, file), 'utf8');
    // Anchor on the exact token rather than /escape/i, which a passing mention
    // anywhere in a long file would satisfy without the rule being present.
    assert.ok(
      text.includes('HTML-escape'),
      `${file} offers HTML output without the escaping rule`,
    );
    assert.match(
      text,
      /`http`\/`https`/,
      `${file} does not allowlist link schemes`,
    );
    assert.match(
      text,
      /RUBRIC\.md/,
      `${file} does not point at the rule it is summarizing`,
    );
  }

  const rubric = readFileSync(join(ROOT, 'method', 'RUBRIC.md'), 'utf8');
  for (const entity of ['&amp;', '&lt;', '&gt;', '&quot;']) {
    assert.ok(rubric.includes(entity), `RUBRIC.md does not name ${entity}`);
  }
  assert.match(rubric, /javascript:/);
  assert.match(rubric, /data:/);
});

test('VENUES.md dates every quote it publishes', () => {
  // The worked example is only honest while its dates are visible, since rules
  // pages change and this file does not update itself.
  const text = readFileSync(join(ROOT, 'method', 'VENUES.md'), 'utf8');
  const reads = text.match(/read \d{4}-\d{2}-\d{2}/g) ?? [];
  assert.ok(reads.length >= 5, 'expected every venue entry to carry a read date');

  // A rules citation may wrap onto the next line when the URL is long, so the
  // claim under test is that the URL is there, not that it fits in 80 columns.
  const lines = text.split('\n');
  const cited = lines.filter(line => line.includes('**Rules:**'));
  assert.ok(cited.length >= 5, 'expected every venue entry to cite its rules page');

  lines.forEach((line, i) => {
    if (!line.includes('**Rules:**')) return;
    const citation = `${line} ${lines[i + 1] ?? ''}`;
    assert.match(citation, /https?:\/\//, `a rules citation has no URL: ${line.trim()}`);
  });
});
