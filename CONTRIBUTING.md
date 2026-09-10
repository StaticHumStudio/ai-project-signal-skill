# Contributing

Thanks for helping make Signal more useful. Small, focused pull requests are
easier to review and much more likely to land.

## Before you start

- Use Node.js 22.19.0 or newer and npm 9.6.5 or newer.
- Use Python 3.9 or newer. `npm run check` runs the collector's tests too, and
  they are standard library `unittest`, so there is nothing to install.
- Open an issue before a large behavior or schema change so the direction can
  be settled before you spend the time.
- Never commit credentials, private source material, personal data, or copied
  community content that you do not have permission to publish.

## Local setup

```bash
cd site
npm ci
npm run dev
```

The local site is served at the root. Use the URL Astro prints in the terminal.

Editing a batch already in `site/content/published/` shows up on the next page
load, because the dev server does not cache signals. Adding a batch on a *new*
date needs a restart: its page comes from `getStaticPaths`, which runs once at
startup, so the date route 404s until you stop and start the dev server.

## Required checks

Run the complete check before opening a pull request:

```bash
cd site
npm run check
npm audit --omit=dev --audit-level=high
```

`npm run check` runs the site's unit tests and the collector's, validates the
bundled synthetic fixture, and builds the static site.

To validate another signal batch from the repository root:

```bash
node reference/validate-staging.mjs path/to/YYYY-MM-DD.json --strict
```

## Content and fixtures

The repository ships with synthetic demo data only. New fixtures must also be
obviously synthetic, use example domains, and say that they are examples in
the visible copy. Do not add scraped posts or real user quotes just to make a
test look convincing.

Signal batches are JSON arrays containing 1 to 10 objects that match
`method/schema.json`. Keep the schema, validator, prompt documentation, and
site loader aligned when changing the format.

`method/VENUES.md` quotes real venue rules pages, and rules pages change. If you
update an entry, **open the page yourself and re-quote it**, then move that
entry's read date to the day you actually read it. Do not refresh a date without
refreshing the quote under it, and do not add a venue you have not opened. An
entry marked unverified is doing its job; a stale entry with a fresh date is a
lie the whole file exists to avoid.

## Skills

`skills/` holds one directory per Agent Skill, and each contains symlinks
(`method`, `collector`, and others) pointing back at the shared directories at
the repo root. That is what lets a skill be linked into a tool's skills path
while still reading one canonical copy of the method. Adding a skill means
adding those symlinks too, and `site/test/skills.test.mjs` will fail if a skill
carries a real directory instead of a symlink, if its frontmatter `name` does
not match its directory name, or if any relative link in its `SKILL.md` does not
resolve.

## Pull requests

Explain what changed, why it changed, and how you verified it. Include
screenshots for visible site changes. CI must pass before merge.
