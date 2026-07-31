# Contributing

Thanks for helping make Signal more useful. Small, focused pull requests are
easier to review and much more likely to land.

## Before you start

- Use Node.js 22.12.0 or newer and npm 9.6.5 or newer.
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

## Pull requests

Explain what changed, why it changed, and how you verified it. Include
screenshots for visible site changes. CI must pass before merge.
