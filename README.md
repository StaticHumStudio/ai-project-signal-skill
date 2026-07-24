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

## Use it

**The easy way — let it interview you.** Paste
[`method/GUIDED.md`](./method/GUIDED.md) into your assistant (Claude, ChatGPT,
Gemini — anything that can search the web and open pages). It asks you a few
plain-language questions about what you're hunting, works out the rest itself —
the angle, the communities, the exact searches — and then goes and does the
research. You configure nothing.

**The manual way — if you'd rather drive.**
[`method/PROMPT.md`](./method/PROMPT.md) is the same engine as a fill-in-and-swap
template: set a `FOCUS`, run an open software sweep, or retarget it to anything
using [`RECIPES.md`](./method/RECIPES.md).
[`method/EXAMPLE.md`](./method/EXAMPLE.md) is a finished one.

Either path returns the same thing: one research pass, and the signals in
whatever form you want — a readable rundown, a **Markdown** file, a standalone
**HTML** page, or the raw **JSON** (matching
[`method/schema.json`](./method/schema.json)) that feeds the example site. Don't
want to build a site? Just ask for the `.md` or `.html`. No account, no
pipeline, no repo required — an afternoon of research in a couple of minutes.

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
complete, retargeted prompt (physical products) you can paste and run as-is. Or
don't lift a finger: tell the [guided prompt](./method/GUIDED.md) what you're
after and it does the retarget for you.

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
1 to 10 objects matching `method/schema.json`. Every source requires a URL,
platform, brief quote, and real publication date.

Validate a batch before building:

```bash
node reference/validate-staging.mjs site/content/published/2026-07-18.json --strict
```

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
example of how to automate the thing. The method itself is provider-neutral.
The reference runner is specifically wired to the Claude CLI and GitHub CLI,
so treat it as architecture to adapt, not a portable command you can run
unchanged:

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

**Want your own loop?** If your provider or tooling supports automated runs — an
API key plus a scheduler, a CLI, GitHub Actions, a no-code automation like
Zapier or Make — you can wire the configured prompt into any of them and have it
hunt on a schedule. `run_signal_daily.sh` shows one Claude CLI implementation, and the
[guided prompt](./method/GUIDED.md) will walk you through setting one up for
your own stack. Automating an assistant depends on your provider's capabilities,
rate limits, terms, and cost, so check those before scheduling anything.

## Repository layout

```
method/       The give-away. Start with GUIDED.md — it interviews you and
              configures itself. PROMPT.md is the manual engine; RUBRIC.md the
              rules; schema.json the output shape; RECIPES.md the non-software
              swaps; EXAMPLE.md a finished, retargeted prompt.
reference/    How Signal ran in production (documentation)
site/         Runnable Astro example front-end (one synthetic signal)
```

## License

[MIT](./LICENSE) © 2026 Static Hum Studio. Take it, point it at something
weird, and go build the thing nobody's built yet.
