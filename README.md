# ai-project-signal-skill

A give-away of [Static Hum Studio](https://statichum.studio)'s demand-signal
sourcing method: a provider-agnostic prompt you can paste into any AI assistant
to find real, evidenced, unmet software demand — plus a runnable example site
that shows how the results get presented.

Originally this ran as an automated daily pipeline (source → review PR →
deploy). It's since fallen out of Static Hum's scope, so the method is being
released, in full, for anyone to use.

## What this is

The core is a research method. Given the web, it hunts down **specific
community threads** where real users express frustration, wishes, and unmet
needs — Reddit, Hacker News, Indie Hackers, app-store reviews, forums — and
packages each opportunity as a structured "demand signal": what people want,
who's asking, real sources, the competitive landscape, and a builder's note.

It is deliberately strict about evidence. A vendor's SEO blog is not demand; a
dead thread is not "ongoing"; an unverified date is not a fact. Those rules —
the ones that make a signal trustworthy — live in
[`method/RUBRIC.md`](./method/RUBRIC.md).

## Use it in any assistant

1. Open [`method/PROMPT.md`](./method/PROMPT.md) and paste it into your
   assistant of choice (Claude, ChatGPT, Gemini — anything that can search the
   web and open pages).
2. Optionally set a `FOCUS` (a category or theme) and/or paste an `EXCLUDE`
   list of signals you already know about.
3. Run it. It performs one independent sourcing pass and returns a JSON array
   of signals — conforming to [`method/schema.json`](./method/schema.json) —
   followed by a short readable summary.

That's the whole loop: one prompt, one pass, on demand. No accounts, no
pipeline, no repo required.

## Run the example site

The `site/` directory is a small [Astro](https://astro.build) app that renders
signals as a browsable feed. It ships with **one synthetic example signal** so
it renders out of the box — there is no real signal data in this repository.

```bash
cd site
npm install
npm run dev
```

Then open the URL Astro prints (the site is served under **`/signal/`**, e.g.
`http://localhost:4321/signal/`).

To populate it with your own signals, drop array-of-signal JSON files into
`site/content/published/` named by date, e.g. `2026-07-18.json` (the filename's
date is what the site groups by). Each file must be a JSON array of objects
matching `method/schema.json`.

## Deploy

The site is a static build — `cd site && npm run build` emits `dist/`, which
you can host on any static host (Netlify, Vercel, Cloudflare Pages, GitHub
Pages, or your own server). No deploy workflow is bundled; wire up whichever
host you prefer. If you fork this, set `site` in `site/astro.config.mjs` to
your own domain.

## How we ran it in production

The [`reference/`](./reference) directory documents how Signal ran as an
automated daily pipeline, kept as an example:

- [`reference/SKILL.md`](./reference/SKILL.md) — the repo-coupled prompt the
  cron job fed to the Claude CLI (writes to a staging file rather than the
  reply; `method/PROMPT.md` is the decoupled version).
- [`reference/run_signal_daily.sh`](./reference/run_signal_daily.sh) — the
  runner: cron → Claude CLI → validate → isolated git worktree → review PR.
- [`reference/validate-staging.mjs`](./reference/validate-staging.mjs) — the
  staging validator.
- [`reference/PROMPT-engineering.md`](./reference/PROMPT-engineering.md) — the
  versioned prompt-engineering writeup, including the failures that produced
  the rules in `RUBRIC.md`.

## Repository layout

```
method/       The give-away: provider-agnostic prompt, rubric, and schema
reference/    How Signal ran in production (documentation)
site/         Runnable Astro example front-end (one synthetic signal)
```

## License

[MIT](./LICENSE) © 2026 Static Hum Studio. Take it, use it, build something.
