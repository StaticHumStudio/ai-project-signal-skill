# ai-project-signal-skill

Somewhere on the internet right now, a stranger is describing (in their own
words, to other strangers) the exact thing they wish existed and can't find.
This is a method for finding those people and turning what they actually said
into something you could actually build.

We ran it as **Signal**: a daily robot that combed the web for unmet software
demand and filed each opportunity as a tidy little dossier. Signal has since
wandered out of [Static Hum](https://statichum.studio)'s scope, so here's the
whole thing: the prompt, the hard-won rules, and the site that displayed it.
MIT-licensed, no strings. The original instance is still humming at
[signal.statichum.studio](https://signal.statichum.studio) if you want to see
what the output looks like in the wild.

## The one idea

Real demand doesn't live in "Top 40 App Ideas" listicles. It lives in a Reddit
comment with 200 upvotes that says *"I've tried six of these and they all
assume I have a team... I don't."* The method finds **that comment**, proves
it's real, and checks whether anyone has actually solved it. Three phases:

1. **Find the threads.** Real people complaining in real communities, not SEO
   sludge, not vendor marketing dressed up as a blog post.
2. **Read them properly.** Open the page and read the replies, because the
   signal is almost never in the headline. It's in the twelfth comment where
   four people say *"same."*
3. **Map the landscape.** For every "someone should build X," check whether
   someone already did, and if so, exactly why it isn't good enough.

Out comes a structured signal: what people want, who's asking (with receipts),
what already exists, and one opinionated line about the non-obvious trap.

The method is relentless about evidence, and every rule in
[`method/RUBRIC.md`](./method/RUBRIC.md) was earned by getting it wrong first.
A vendor's blog is not demand. A dead thread is not "ongoing." A date you
didn't open the page and verify is not a fact. And the rule the rest of the
genre skips: what you saw is a finding, what it means is a diagnosis, and the
two never share a sentence. Most research prompts will read a job posting,
conclude the company's reporting is broken, and cite the posting as evidence.
That's a guess wearing a real citation, which is why so much of this genre
reads as confident and lands as noise.

## Three ways to run it

### 1. Agent Skills (easiest, if your assistant supports them)

The repo ships two, in [`skills/`](./skills). Verified in Claude Code and
Codex CLI.

| Skill | Answers | What comes back |
|---|---|---|
| [`demand-signal-research`](./skills/demand-signal-research) | What should I make? | Up to 10 signals. What people want, who asked (quote, URL, and a real publication date on every source), what already exists, and exactly where each option falls short. |
| [`audience-channel-research`](./skills/audience-channel-research) | Where do I reach those people? | A one-time placement checklist sorted by effort, plus a standing watchlist. Every venue carries its own promotion rules quoted verbatim, with the URL and the date they were read. |

You never invoke them by name. Say what you're actually after ... *"help me
work out what to build for solo landlords"*, *"where can I post this without
getting banned"* ... and the matching one loads itself. Both interview you
first, so there's nothing to configure, and both refuse to guess: if your
assistant can't open the pages the research needs, they stop and say so rather
than handing you fiction (see the preflight check below).

Clone once, then link the skills you want into wherever your tool keeps them:

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
tool uses. **Link, don't copy.** Both skill directories read the one shared
[`method/`](./method) through a `method` symlink, so there is no second copy
that can drift, and a copy that flattens the symlink leaves the skill pointing
at files that aren't there. On Windows, clone with `core.symlinks=true` (or
Developer Mode on), or just use the paste-in path below, which needs no
install at all.

### 2. The guided prompt (works anywhere)

Paste [`method/GUIDED.md`](./method/GUIDED.md) into your assistant (Claude,
ChatGPT, Gemini, anything that can search the web and open pages). It asks a
few plain-language questions about what you're hunting, works out the rest
itself (the angle, the communities, the exact searches), then goes and does
the research. You configure nothing.

### 3. Manual, if you'd rather drive

[`method/PROMPT.md`](./method/PROMPT.md) is the same engine as a
fill-in-and-swap template: set a `FOCUS`, run an open software sweep, or
retarget it to anything using [`RECIPES.md`](./method/RECIPES.md).
[`method/EXAMPLE.md`](./method/EXAMPLE.md) is a finished one.

### Preflight: check your assistant can actually read pages

Do this once, before your first run. Ask your assistant to open one Reddit
thread and one forum thread and report what it sees. **If it cannot read the
actual page content, stop.** "Can search the web" and "can open a specific
page on a specific site" are different capabilities, and the second one varies
by assistant, by harness, and by site. The failure is silent: an assistant
running on search snippets still produces well-formed, plausible signals, just
built on fiction. That's the exact failure mode
[`method/RUBRIC.md`](./method/RUBRIC.md) exists to prevent, and it can only
prevent it if the pages are actually being opened. Test it, don't assume it.

**Reddit is the one worth knowing about up front.** As of 2026-08-02, Reddit's
`robots.txt` is `Disallow: /` for every user agent, the unauthenticated
`.json` endpoint returns 403, and Claude Code refuses `reddit.com` outright.
Other assistants may still reach it (access is a matter of who has a licensing
agreement, not what the software can do), so check yours on the day. The gap
matters because Reddit is where most consumer software demand actually gets
discussed: if your assistant can't open it, your sweep is running on forums,
and forum populations are self-selecting. Say so in the output rather than
letting a thin run read as a complete one. The sanctioned way in is Reddit's
official OAuth API (free for non-commercial use), which this repo leaves to
you to wire up.

**If it fails, or you'd rather not depend on it:**
[`collector/`](./collector) is a standard-library Python script that fetches
Hacker News, any Discourse forum, and open GitHub issues into a local JSONL
cache, handing the assistant real timestamps instead of asking it to read them
off a page. Hacker News and Discourse need nothing installed and no keys. The
GitHub collector shells out to the `gh` CLI (install it, run `gh auth login`
once), which is precisely how the script avoids ever handling a token of
yours. Landscape research still needs an assistant that can open a vendor's
page.

### What you get back

One research pass, then the signals in whatever form you ask for:

- **In the chat.** Cheapest. Nothing written to disk, just the rundown.
- **A Markdown file.** Most convenient. Save it, search it, paste it anywhere.
- **A standalone HTML page.** Best to actually read. One self-contained file,
  competitive landscape laid out as a table.

Raw **JSON** (matching [`method/schema.json`](./method/schema.json)) comes
free on top of any of them, and it's what feeds the example site. No account,
no pipeline, no repo required. An afternoon of research in a couple of
minutes.

## Point it at anything

Nothing inside the machine actually cares that it's hunting *software*
demand... that's just the criteria we happened to hand it. Swap the criteria
(a small edit at the top of the prompt) and the same three-phase engine hunts
almost anything real people repeatedly, verifiably wish existed:

- **Videos.** The YouTube comments and `r/learnprogramming` threads full of
  *"is there a decent guide to this anywhere?"*, plus which existing videos
  already whiff.
- **Physical products.** `r/BuyItForLife`, gadget forums, and one-star Amazon
  reviews are a firehose of *"I love it, but I really wish it also did X."*
- **Your town.** *"Why is there no good late-night X in this city"* is a
  business plan with a built-in focus group.
- **A competitor's users.** Point it at one product's community (subreddit,
  GitHub issues, reviews) and harvest the rage and the wishlist.
- **Books.** `r/suggestmeabook` is wall-to-wall *"basically X-meets-Y and
  nobody's written it."*

The transferable thing was never "software ideas." It's *a disciplined way to
turn scattered human longing into a verified, evidenced shortlist.*
[`method/RECIPES.md`](./method/RECIPES.md) has the exact swaps,
[`method/EXAMPLE.md`](./method/EXAMPLE.md) is one already done (physical
products), and the [guided prompt](./method/GUIDED.md) will do the retarget
for you.

## The other direction: where do you reach these people?

Once you've built the thing, the next question is where to put it, and that's
the same research problem pointed backwards. [`method/CHANNELS.md`](./method/CHANNELS.md)
is the second method, with its own skill
([`audience-channel-research`](./skills/audience-channel-research)), its own
output shape ([`channels.schema.json`](./method/channels.schema.json)), and
the same shared rubric and preflight gate.

**The anchor is the part nobody bothers with.** For every venue it suggests,
it opens that venue's actual rules page and quotes, verbatim, what it says
about self-promotion, with the URL and the date it read it. Because the
failure mode here isn't a wasted afternoon, it's getting banned from the one
community that mattered, and an assistant working from memory will cheerfully
tell you a forum welcomes project posts when its sidebar says the opposite.
Reading the rules also surfaces something nobody advertises: a lot of venues
ban commercial promotion in one sentence and permit open source project
sharing in the next. Those are doors an MIT-licensed tool walks straight
through and a paid app cannot. [`method/VENUES.md`](./method/VENUES.md) has
that step worked by hand, real quotes, real dates, including the ones that
couldn't be verified and why.

What comes out is deliberately **not** a ranked list and **not** a content
calendar. It's a one-time placement checklist you grind once per project
(sorted by effort, so you can stop wherever your afternoon ends) and a
standing watchlist where every entry has a trigger phrased as an event in the
world ("when you ship a release with a user-visible change") rather than a
frequency.

And it will not generate what the demand method rejects. That falls out of the
schema, not a bolted-on ethics note: your release notes and your directory
listing are landscape, and producing landscape is fine. A sockpuppet asking a
question so you can answer it is a fabricated source, the exact artifact
[`RUBRIC.md`](./method/RUBRIC.md) exists to catch.

## Run the example site

`site/` is a small [Astro](https://astro.build) app that renders signals as a
browsable feed. It ships with exactly **one synthetic example signal** so it
renders out of the box. There is no real signal data in this repo.

You need Node.js 22.19.0 or newer and npm 9.6.5 or newer (`site/.nvmrc`
selects the supported line if you use `nvm`).

```bash
cd site
npm ci
npm run dev
```

Then open the URL Astro prints (`http://localhost:4321`).

To fill it with your own results, drop array-of-signal JSON files into
`site/content/published/`, named by date (`2026-07-18.json`), since the
filename's date is how the site groups them. Each file is a JSON array of 1 to
10 objects matching `method/schema.json`. **Restart `npm run dev` after adding
a file.** Batches are picked up at startup, so a running dev server keeps
serving the old set until you restart.

All the reader-facing copy lives in one file, `site/src/config.js`: the hero,
the body sections, the RSS title, the structured-data keywords, the brand name
and links. Nothing is hardcoded in a template, so retargeting the site to
books or physical products means editing that one file. The shipped copy is
target-neutral on purpose.

Validate a batch before building:

```bash
node reference/validate-staging.mjs site/content/published/2026-07-18.json --strict
```

Run every test, validate the bundled fixture, and build:

```bash
cd site
npm run check
```

## Deploy

It's a static build. `cd site && npm run build` emits `dist/`, which uploads
as-is to anything that hosts static files (Netlify, Vercel, Cloudflare Pages,
GitHub Pages, your own box). No deploy workflow is bundled.

Two knobs in `site/astro.config.mjs`:

- **`site`** is your own domain. Canonical and Open Graph URLs derive from it,
  and `rss.xml` refuses to build without it.
- **`base`** is `/`. Change it only to serve from a subpath: `base: '/signal'`
  makes every internal link `/signal/...`, and `dist/` then has to be uploaded
  into a matching `/signal/` directory on your host. Every internal link runs
  through `withBase()` in `site/src/utils/paths.js`, so that one value is the
  only edit.

One URL quirk that is not a bug: category pages carry a short hash suffix,
like `/category/saas-1a2b3c4d/`. Category labels are free-form strings from
the model, so the hash keeps each category URL stable and collision-proof no
matter what labels later batches invent.

Branding: the example site wears Static Hum branding, all of it in
`site/src/config.js` under `brand`. The JSON-LD publisher is the one you
actually have to change, since leaving it tells search engines that Static Hum
Studio publishes your site. The footer credit is ordinary attribution, keep it
or yank it.

**The demo makes no third-party requests.** Fonts are self-hosted, there's no
analytics, no CDN, no embeds, and no JavaScript that phones anywhere. A
privacy claim you can't check is just a vibe, so check it:

```bash
cd site && npm run build && grep -rhoE '(src|href)="https?://[^"]*"' dist/ --include=*.html | sort -u
```

What comes back should be links a reader chooses to click and your own domain
in the canonical tags. The claim covers what this repo builds, and it stops
being true the moment you add analytics or a host that injects its own
script. It also says nothing about the assistant you point the method at,
which obviously talks to whoever made it.

## How we ran it in production

[`reference/`](./reference) is Signal's real daily pipeline, kept as a worked
example of how to automate the thing. The method is provider-neutral, but the
reference runner is wired to the Claude CLI and GitHub CLI, so treat it as
architecture to adapt, not a portable command:

- [`reference/DAILY-RUN.md`](./reference/DAILY-RUN.md): the repo-coupled
  prompt the cron job fed to the Claude CLI (`method/PROMPT.md` is the
  decoupled, portable version).
- [`reference/run_signal_daily.sh`](./reference/run_signal_daily.sh): the
  runner: cron → Claude CLI → validate → isolated git worktree → review PR.
- [`reference/validate-staging.mjs`](./reference/validate-staging.mjs): the
  staging validator that kept bad batches out of the site.
- [`reference/PROMPT-engineering.md`](./reference/PROMPT-engineering.md): the
  versioned writeup, including the specific failures that produced the rules
  in `RUBRIC.md`. This is the good stuff if you want to understand *why* the
  prompt is shaped the way it is.

Want your own loop? Anything that can run a prompt on a schedule works: an API
key plus cron, a CLI, GitHub Actions, a no-code automation. The
[guided prompt](./method/GUIDED.md) will walk you through setting one up for
your stack. Check your provider's rate limits, terms, and cost before
scheduling anything.

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
