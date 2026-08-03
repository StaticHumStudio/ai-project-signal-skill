# ai-project-signal-skill

Somewhere on the internet right now, a stranger is describing (in their own
words, to other strangers) the exact thing they wish existed and can't find.
This is a method for going and finding those people, and turning what they
actually said into something you could actually build.

We ran it as **Signal**: a daily robot that combed the web for unmet software
demand and filed each opportunity as a tidy little dossier. Signal has since
wandered out of [Static Hum](https://statichum.studio)'s scope, so here's the
whole thing: the prompt, the hard-won rules, and the site that displayed it.
MIT-licensed, no strings. The original instance is still humming at
[signal.statichum.studio](https://signal.statichum.studio) if you want to see
what the output looks like in the wild. Take it and go.

## The one idea

Real demand doesn't live in "Top 40 App Ideas for 2026" listicles. It lives in
a Reddit comment with 200 upvotes that says *"I've tried six of these and they
all assume I have a team... I don't."* The method exists to find **that
comment**, prove it's real, and check whether anyone has actually solved it.

Three phases, and it will not cut corners on any of them:

1. **Go find the threads.** Real people complaining in real communities, not
   SEO sludge, not vendor marketing dressed up as a blog post.
2. **Read them properly.** Open the page and read the replies, because the
   signal is almost never in the headline. It's in the twelfth comment where
   four people say *"same."*
3. **Map the landscape.** For every "someone should build X," go check whether
   someone already did, and if so, exactly why it isn't good enough.

Out comes a structured signal: what people want, who's asking (with receipts),
what already exists, and one opinionated line about the non-obvious trap.

It is relentless about evidence. A vendor's blog is not demand. A dead thread
is not "ongoing." A date you didn't open the page and verify is not a fact. And
a business that looks complicated is not a business with a problem. Every one of
those rules was earned by getting it wrong first. They live in
[`method/RUBRIC.md`](./method/RUBRIC.md).

That last one is the rule the rest of the genre skips. There is no shortage of
research prompts that will read a job posting, conclude the company's reporting
is broken, cite the posting, and call that evidence. It isn't. It's a guess
about someone's insides wearing a real citation, which is exactly why so much
of this stuff reads as confident and lands as noise. Here, the observation and
the diagnosis go in separate sentences, and the diagnosis is allowed to be
missing. What you saw is a finding. What it means is a conversation you haven't
had yet.

## Use it

**The easy way: let it interview you.** Paste
[`method/GUIDED.md`](./method/GUIDED.md) into your assistant (Claude, ChatGPT,
Gemini, anything that can search the web and open pages). It asks you a few
plain-language questions about what you're hunting, works out the rest itself
(the angle, the communities, the exact searches) and then goes and does the
research. You configure nothing.

**The even easier way, if your assistant supports Agent Skills.** The repo ships
two, in [`skills/`](./skills). Same thing with the pasting removed. Verified in
Claude Code and Codex CLI. Clone once, then link the skills you want into
wherever your tool keeps them:

```bash
git clone https://github.com/StaticHumStudio/ai-project-signal-skill ~/src/signal
```

```bash
ln -s ~/src/signal/skills/demand-signal-research ~/.claude/skills/demand-signal-research
```

```bash
ln -s ~/src/signal/skills/audience-channel-research ~/.claude/skills/audience-channel-research
```

Swap `~/.claude/skills` for `~/.codex/skills` on Codex, or whatever path your
tool uses. Each directory name has to match the `name` in that skill's
frontmatter.

Both skill directories carry a `method` symlink pointing back at the shared
[`method/`](./method), so there is exactly one copy of the method and no version
of it that can drift. That's also why you link the skill directory rather than
copying it: a copy that flattens the symlink leaves the skill pointing at files
that aren't there. On Windows, `git clone` only materializes those symlinks with
`core.symlinks=true` (or Developer Mode on), and without it you'll get plain
text files with a path inside them. If that happens, use the paste-in path
below, which needs no install at all and runs anywhere.

Then just say what you're after and the right one loads itself.

**The manual way: if you'd rather drive.**
[`method/PROMPT.md`](./method/PROMPT.md) is the same engine as a fill-in-and-swap
template: set a `FOCUS`, run an open software sweep, or retarget it to anything
using [`RECIPES.md`](./method/RECIPES.md).
[`method/EXAMPLE.md`](./method/EXAMPLE.md) is a finished one.

### Preflight: check your assistant can actually read pages

Do this once, before your first run. Ask your assistant to open one Reddit
thread and one forum thread and report what it sees. **If it cannot read the
actual page content, stop.** This method cannot run on search snippets, and an
assistant that tries will hand you confident fiction rather than an error.

This is not hypothetical. "Can search the web" and "can open a specific page on
a specific site" are different capabilities, and the second one varies by
assistant, by harness, and by site. Some sites block some assistants' crawlers
outright. The failure is silent: the assistant still produces well-formed,
plausible signals, just built on snippets and recall instead of pages it read.
That is the exact failure mode [`method/RUBRIC.md`](./method/RUBRIC.md) exists
to prevent, and it can only prevent it if the assistant is actually opening the
pages.

Test it, don't assume it. A compatibility list would be out of date the moment
anyone signs a licensing deal.

**Reddit is the one worth knowing about up front.** As of 2026-08-02, Reddit's
`robots.txt` is `Disallow: /` for every user agent, and the unauthenticated
`.json` endpoint returns 403. Claude Code refuses `www.reddit.com` and
`old.reddit.com` outright. Other assistants may still reach it, since access
here is a matter of who has an agreement rather than what the software can do,
which is exactly why this file won't keep a table. Check it yourself on the day.

That gap matters more than it looks, because Reddit is where most consumer
software demand actually gets discussed. If your assistant can't open it, your
sweep is running on forums, and forum populations are self-selecting. Say so in
the output rather than letting a thin run read as a complete one. The
sanctioned way in is Reddit's official OAuth API (register a script app, free
for non-commercial use). This repo doesn't ship a Reddit collector, so that's
yours to wire up if you need it.

**If it fails, or you'd rather not depend on it:**
[`collector/`](./collector) is a standard-library Python script that fetches
Hacker News, any Discourse forum, and open GitHub issues into a local JSONL
cache, then hands the assistant real timestamps instead of asking it to read
them off a page. No install, no keys. It removes the retrieval dependency for
sources, though landscape research still needs an assistant that can open a
vendor's page.

Either path returns the same thing: one research pass, then the signals in
whatever form you want. Three ways to read them, and it'll ask which you want:

- **In the chat.** Cheapest. Nothing written to disk, just the rundown.
- **A Markdown file.** Most convenient. Save it, search it, paste it anywhere.
- **A standalone HTML page.** Best to actually read. One self-contained file
  that opens in a browser, competitive landscape laid out as a table.

Raw **JSON** (matching [`method/schema.json`](./method/schema.json)) comes free
on top of any of them, and it's what feeds the example site. Don't want to build
a site? Just ask for the `.md` or `.html`. No account, no pipeline, no repo
required. An afternoon of research in a couple of minutes.

## It's not really about software

Here's the fun part. Nothing inside the machine actually cares that it's
hunting *software* demand... that's just the criteria we happened to hand it.
Swap the criteria and the same three-phase engine (find the threads → read
them properly → map the landscape) will go hunt for almost anything that real
people repeatedly, verifiably wish existed.

A few places people have pointed it, each just a small edit to the top of the
prompt:

- **"What should I make a video about?"** Retarget it at explainers and
  tutorials people beg for and can't find. It surfaces the YouTube comments and
  `r/learnprogramming` threads full of *"is there a decent guide to this
  anywhere?"*, and tells you which existing videos already whiff.
- **"What should I actually put on the shelf?"** Aim it at physical products.
  `r/BuyItForLife`, gadget forums, and one-star Amazon reviews are a firehose
  of *"I love it, but I really wish it also did X."*
- **"What's missing in my town?"** Feed it a city subreddit and the criteria
  "local services people wish existed here." *"Why is there no good late-night
  X in this city"* is a business plan with a built-in focus group.
- **"What do [competitor]'s users secretly want?"** Point it at one product's
  community (subreddit, GitHub issues, the review section) and harvest the
  rage and the wishlist. Unsolicited product research on someone else's users.
- **"What book doesn't exist yet?"** `r/suggestmeabook` is wall-to-wall *"I
  want something that's basically X-meets-Y and nobody's written it."* Same
  method, literary target.

The transferable thing here was never "software ideas." It's *a disciplined
way to turn scattered human longing into a verified, evidenced shortlist.*
[`method/RECIPES.md`](./method/RECIPES.md) has the exact swaps for each of the
above. Copy one, drop it into `PROMPT.md`'s two marked swap points, and go.
Want to see one already done? [`method/EXAMPLE.md`](./method/EXAMPLE.md) is a
complete, retargeted prompt (physical products) you can paste and run as-is. Or
don't lift a finger: tell the [guided prompt](./method/GUIDED.md) what you're
after and it does the retarget for you.

## The other direction: where do you reach these people?

Once you've built the thing, the next question is where to put it, and that's
the same research problem pointed backwards. So there's a second method for it:
[`method/CHANNELS.md`](./method/CHANNELS.md), with its own skill
([`audience-channel-research`](./skills/audience-channel-research)), its own
output shape ([`channels.schema.json`](./method/channels.schema.json)), and the
same shared rubric and preflight gate.

**The anchor is the part nobody bothers with.** For every venue it suggests, it
opens that venue's actual rules page and quotes, verbatim, what it says about
self-promotion, with the URL and the date it read it. Not a summary, not
recollection. Because the failure mode here isn't a wasted afternoon, it's
getting banned from the one community that mattered, and an assistant working
from memory will cheerfully tell you a forum welcomes project posts when its
sidebar says the opposite.

That turns out to be worth doing for a reason nobody advertises: **a lot of
venues ban commercial promotion in one sentence and permit open source project
sharing in the next.** Privacy Guides publishes a formal self-submission process
for developers whose only real price is disclosing your affiliation.
awesome-selfhosted has no self-promotion rule at all, because it gates on
whether your project is four months old and maintained rather than on your
relationship to it. Those are doors an MIT-licensed tool walks straight through
and a paid app cannot. [`method/VENUES.md`](./method/VENUES.md) has that step
worked by hand, real quotes, real dates, including the ones that couldn't be
verified and why.

What comes out is deliberately **not** a ranked list and **not** a content
calendar. It's two sections: a one-time placement checklist you grind once per
project (sorted by effort, so you can stop wherever your afternoon ends), and a
standing watchlist where every entry has a trigger phrased as an event in the
world ("when you ship a release with a user-visible change") rather than a
frequency. Every venue gets pros and cons. Effort is the axis, not cost, because
paid placement is out of scope.

And it will not generate what the demand method rejects. That's not a bolted-on
ethics note, it falls out of the schema: producing landscape is fine, and
manufacturing a source never is. Your release notes and your directory listing
are landscape, and everyone knows it. A sockpuppet asking a question so you can
answer it is a fabricated source, which is the exact artifact
[`RUBRIC.md`](./method/RUBRIC.md) exists to catch. Using both halves of this
repo, you'd be feeding one the thing the other is built to reject.

## Run the example site

`site/` is a small [Astro](https://astro.build) app that renders signals as a
browsable feed. It ships with exactly **one synthetic example signal** so it
renders out of the box. There is no real signal data in this repo.

You need Node.js 22.12.0 or newer and npm 9.6.5 or newer. If you use `nvm`,
`site/.nvmrc` selects the supported Node release line.

```bash
cd site
npm ci
npm run dev
```

Then open the URL Astro prints (`http://localhost:4321`).

To fill it with your own results, drop array-of-signal JSON files into
`site/content/published/`, named by date (`2026-07-18.json`), since the
filename's date is how the site groups them. Each file is a JSON array of
1 to 10 objects matching `method/schema.json`. Every source requires a URL,
platform, brief quote, and real publication date. **Restart `npm run dev`
after adding a file.** New batches are picked up at startup, so a running dev
server keeps serving the old set and the new date page 404s until you restart.

All the copy is in one file. `site/src/config.js` holds every reader-facing
string: the hero, the body sections, the RSS channel title, the structured-data
keywords, and the brand name and links. Nothing is hardcoded in a template, so
retargeting the site to books or physical products or whatever else means
editing that one file. The shipped copy is target-neutral on purpose. Narrow it
if your instance only ever hunts one thing.

Validate a batch before building:

```bash
node reference/validate-staging.mjs site/content/published/2026-07-18.json --strict
```

Run every test, validate the bundled fixture, and build the site:

```bash
cd site
npm run check
```

## Deploy

It's a static build. `cd site && npm run build` emits `dist/`, which you can
host anywhere static (Netlify, Vercel, Cloudflare Pages, GitHub Pages, your own
box). It's configured to serve at a domain root, so `dist/` uploads as-is with
nothing to adjust. No deploy workflow is bundled, so wire up whatever host you
like.

Two knobs to turn when you fork, both in `site/astro.config.mjs`:

- **`site`** is your own domain. Canonical and Open Graph URLs are derived from
  it, and `rss.xml` refuses to build without it (a feed needs absolute links).
- **`base`** is `/`. Only change this if you want the site on a subpath instead
  of the domain root. Setting `base: '/signal'` makes every internal link
  `/signal/...`, which means `dist/` then has to be uploaded into a matching
  `/signal/` directory on your host rather than at the root. Every internal link
  runs through `withBase()` in `site/src/utils/paths.js`, so that one value is
  the only thing you edit.

One URL quirk that is not a bug: category pages carry a short hash suffix,
like `/category/saas-1a2b3c4d/`. Category labels are free-form strings from
the model, so the hash is what keeps each category URL stable and
collision-proof no matter what labels later batches invent. Case and spacing
variants of the same label ("SaaS", "saas") fold onto one page.

The example site also wears Static Hum branding (nav lockup, footer credit,
JSON-LD publisher name). All of it lives in `site/src/config.js` under `brand`.
The JSON-LD publisher is the one you actually have to change: leave it and
you are telling search engines that Static Hum Studio publishes your site.
The footer credit is ordinary attribution, so keep it or yank it as you like.

**The demo makes no third-party requests.** Fonts are self-hosted (five woff2
files, latin subset, OFL licenses alongside them), there's no analytics, no
CDN, no embeds, and no JavaScript that phones anywhere. Every external URL in
the built output is an `<a href>` a reader chooses to click. A privacy claim
you can't check is just a vibe, so check it:

```bash
cd site && npm run build && grep -rhoE '(src|href)="https?://[^"]*"' dist/ --include=*.html | sort -u
```

What comes back should be links and your own domain in the canonical tags.
Neither is a request the browser makes on its own.

Two things that doesn't cover. It's a claim about what this repo builds, and it
stops being true the moment you add analytics or deploy behind a host that
injects its own script. And it says nothing about the assistant you point the
method at, which obviously talks to whoever made it.

## How we ran it in production

[`reference/`](./reference) is Signal's real daily pipeline, kept as a worked
example of how to automate the thing. The method itself is provider-neutral.
The reference runner is specifically wired to the Claude CLI and GitHub CLI,
so treat it as architecture to adapt, not a portable command you can run
unchanged:

- [`reference/DAILY-RUN.md`](./reference/DAILY-RUN.md): the repo-coupled prompt
  the cron job fed to the Claude CLI (it writes to a staging file instead of
  replying; `method/PROMPT.md` is the decoupled, portable version). This file
  used to be called `SKILL.md`, before there was an actual skill to confuse it
  with.
- [`reference/run_signal_daily.sh`](./reference/run_signal_daily.sh): the
  runner: cron → Claude CLI → validate → isolated git worktree → review PR.
- [`reference/validate-staging.mjs`](./reference/validate-staging.mjs): the
  staging validator that kept bad batches out of the site.
- [`reference/PROMPT-engineering.md`](./reference/PROMPT-engineering.md): the
  versioned writeup, including the specific failures that produced the rules in
  `RUBRIC.md`. This is the good stuff if you want to understand *why* the prompt
  is shaped the way it is.

**Want your own loop?** If your provider or tooling supports automated runs (an
API key plus a scheduler, a CLI, GitHub Actions, a no-code automation like
Zapier or Make), you can wire the configured prompt into any of them and have it
hunt on a schedule. `run_signal_daily.sh` shows one Claude CLI implementation, and the
[guided prompt](./method/GUIDED.md) will walk you through setting one up for
your own stack. Automating an assistant depends on your provider's capabilities,
rate limits, terms, and cost, so check those before scheduling anything.

## Repository layout

```
skills/       Two Agent Skill front doors, each a directory you link into your
              tool's skills path. Both route to method/ through a symlink and
              gate on the preflight check, and neither restates the method.
                demand-signal-research/   what should I make?
                audience-channel-research/ where do I reach those people?
method/       The give-away, and the one copy both skills read.
                GUIDED.md    interviews you and configures itself (start here)
                PROMPT.md    the manual engine, as a fill-in template
                RUBRIC.md    the evidence rules, shared by both methods
                schema.json  the demand output shape
                RECIPES.md   swaps for non-software targets
                EXAMPLE.md   a finished, retargeted prompt
                CHANNELS.md  the reverse method: audience and channels
                VENUES.md    venue rules read and quoted by hand, with dates
                channels.schema.json  the channel output shape
collector/    Standard-library Python retrieval into a local cache, for when
              your assistant can't open pages
reference/    How Signal ran in production (documentation)
site/         Runnable Astro example front-end (one synthetic signal)
```

## License

[MIT](./LICENSE) © 2026 Static Hum Studio. Take it, point it at something
weird, and go build the thing nobody's built yet.
