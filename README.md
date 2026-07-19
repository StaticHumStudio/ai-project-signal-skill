# ai-project-signal-skill

Somewhere on the internet right now, a stranger is describing — in their own
words, to other strangers — the exact thing they wish existed and can't find.
This is a method for going and finding those people, and turning what they
actually said into something you could actually build.

We ran it as **Signal**: a daily robot that combed the web for unmet software
demand and filed each opportunity as a tidy little dossier. Signal has since
wandered out of [Static Hum](https://statichum.studio)'s scope, so here's the
whole thing — the prompt, the hard-won rules, and the site that displayed it —
MIT-licensed, no strings. Take it and go.

## The one idea

Real demand doesn't live in "Top 40 App Ideas for 2026" listicles. It lives in
a Reddit comment with 200 upvotes that says *"I've tried six of these and they
all assume I have a team — I don't."* The method exists to find **that
comment**, prove it's real, and check whether anyone has actually solved it.

Three phases, and it will not cut corners on any of them:

1. **Go find the threads.** Real people complaining in real communities — not
   SEO sludge, not vendor marketing dressed up as a blog post.
2. **Read them properly.** Open the page and read the replies, because the
   signal is almost never in the headline. It's in the twelfth comment where
   four people say *"same."*
3. **Map the landscape.** For every "someone should build X," go check whether
   someone already did — and if so, exactly why it isn't good enough.

Out comes a structured signal: what people want, who's asking (with receipts),
what already exists, and one opinionated line about the non-obvious trap.

It is relentless about evidence. A vendor's blog is not demand. A dead thread
is not "ongoing." A date you didn't open the page and verify is not a fact.
Every one of those rules was earned by getting it wrong first — they live in
[`method/RUBRIC.md`](./method/RUBRIC.md).

## Use it in about ten seconds

1. Copy [`method/PROMPT.md`](./method/PROMPT.md) into any assistant that can
   search the web and open pages — Claude, ChatGPT, Gemini, take your pick.
2. Optionally fill in the `FOCUS` / `EXCLUDE` block at the top of the prompt (a
   theme to lean into; signals you already know about) — or leave it blank.
3. Run it. One pass, one JSON array of signals matching
   [`method/schema.json`](./method/schema.json), and a plain-English summary
   underneath so you can skim.

No account, no pipeline, no repo required. Just a prompt doing an afternoon of
research in a couple of minutes.

## It's not really about software

Here's the fun part. Nothing inside the machine actually cares that it's
hunting *software* demand — that's just the criteria we happened to hand it.
Swap the criteria and the same three-phase engine (find the threads → read
them properly → map the landscape) will go hunt for almost anything that real
people repeatedly, verifiably wish existed.

A few places people have pointed it — each just a small edit to the top of the
prompt:

- **"What should I make a video about?"** Retarget it at explainers and
  tutorials people beg for and can't find. It surfaces the YouTube comments and
  `r/learnprogramming` threads full of *"is there a decent guide to this
  anywhere?"* — and tells you which existing videos already whiff.
- **"What should I actually put on the shelf?"** Aim it at physical products.
  `r/BuyItForLife`, gadget forums, and one-star Amazon reviews are a firehose
  of *"I love it, but I really wish it also did X."*
- **"What's missing in my town?"** Feed it a city subreddit and the criteria
  "local services people wish existed here." *"Why is there no good late-night
  X in this city"* is a business plan with a built-in focus group.
- **"What do [competitor]'s users secretly want?"** Point it at one product's
  community — subreddit, GitHub issues, the review section — and harvest the
  rage and the wishlist. Unsolicited product research on someone else's users.
- **"What book doesn't exist yet?"** `r/suggestmeabook` is wall-to-wall *"I
  want something that's basically X-meets-Y and nobody's written it."* Same
  method, literary target.

The transferable thing here was never "software ideas." It's *a disciplined
way to turn scattered human longing into a verified, evidenced shortlist.*
[`method/RECIPES.md`](./method/RECIPES.md) has the exact swaps for each of the
above — copy one, drop it into `PROMPT.md`'s two marked swap points, and go.
Want to see one already done? [`method/EXAMPLE.md`](./method/EXAMPLE.md) is a
complete, retargeted prompt (physical products) you can paste and run as-is.

## Run the example site

`site/` is a small [Astro](https://astro.build) app that renders signals as a
browsable feed. It ships with exactly **one synthetic example signal** so it
renders out of the box — there is no real signal data in this repo.

```bash
cd site
npm install
npm run dev
```

Then open the URL Astro prints. The site is served under **`/signal/`** (e.g.
`http://localhost:4321/signal/`).

To fill it with your own results, drop array-of-signal JSON files into
`site/content/published/`, named by date — `2026-07-18.json` — since the
filename's date is how the site groups them. Each file is a JSON array of
objects matching `method/schema.json`.

## Deploy

It's a static build. `cd site && npm run build` emits `dist/`, which you can
host anywhere static (Netlify, Vercel, Cloudflare Pages, GitHub Pages, your own
box). No deploy workflow is bundled — wire up whatever host you like.

Two knobs to turn when you fork:

- **`site`** in `site/astro.config.mjs` — set it to your own domain. Canonical
  and Open Graph URLs are derived from it.
- **`base`** is `/signal`, and the internal links are rooted there, so the
  built `dist/` must be served under a `/signal/` path (e.g.
  `yourdomain.com/signal/`). To serve at the domain root instead, change `base`
  to `/` **and** update the hard-coded `/signal/...` links in `site/src/`
  together.

The example site also wears Static Hum branding (nav, footer, JSON-LD
publisher name) — swap it for your own.

## How we ran it in production

[`reference/`](./reference) is Signal's real daily pipeline, kept as a worked
example of how to automate the thing:

- [`reference/SKILL.md`](./reference/SKILL.md) — the repo-coupled prompt the
  cron job fed to the Claude CLI (it writes to a staging file instead of
  replying; `method/PROMPT.md` is the decoupled, portable version).
- [`reference/run_signal_daily.sh`](./reference/run_signal_daily.sh) — the
  runner: cron → Claude CLI → validate → isolated git worktree → review PR.
- [`reference/validate-staging.mjs`](./reference/validate-staging.mjs) — the
  staging validator that kept bad batches out of the site.
- [`reference/PROMPT-engineering.md`](./reference/PROMPT-engineering.md) — the
  versioned writeup, including the specific failures that produced the rules in
  `RUBRIC.md`. This is the good stuff if you want to understand *why* the prompt
  is shaped the way it is.

## Repository layout

```
method/       The give-away: PROMPT.md (the portable prompt), RUBRIC.md (the
              rules), schema.json (the output shape), RECIPES.md (swaps for
              non-software hunts), and EXAMPLE.md (a finished, retargeted prompt)
reference/    How Signal ran in production (documentation)
site/         Runnable Astro example front-end (one synthetic signal)
```

## License

[MIT](./LICENSE) © 2026 Static Hum Studio. Take it, point it at something
weird, and go build the thing nobody's built yet.
