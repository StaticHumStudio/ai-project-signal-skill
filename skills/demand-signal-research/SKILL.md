---
name: demand-signal-research
description: Find real, evidenced, unmet demand by mining what people actually say in online communities and verifying every source against the page it came from. Use when the user wants to work out what to build, make, sell, film, or write based on real demand rather than guesswork; validate a product idea against real discussion; harvest what a competitor's users complain about; or produce demand signals matching this repo's schema. Requires an assistant that can open specific web pages, not just search.
---

# Demand Signal Research

A disciplined method for turning scattered human longing into a verified,
evidenced shortlist. Three phases: find the threads, read them properly, map
the landscape. It is relentless about evidence, and it will refuse to run
rather than guess.

Nothing in the method is specific to software. That is just the criteria this
repo ships tuned for. It retargets to videos, physical products, local
services, books, or a single competitor's user base.

## Step 0: Preflight (do this first, every time)

**Before any research, confirm you can actually open pages.** Open one Reddit
thread and one forum thread and report what you see. Being able to search the
web and being able to fetch a given page are different capabilities, and the
second varies by harness and by site.

Expect Reddit to fail. Its `robots.txt` is `Disallow: /` for every agent, the
unauthenticated `.json` endpoint returns 403, and some harnesses (Claude Code,
checked 2026-08-02) refuse the domain outright. Don't work around it. Note it,
run on what you can reach, and say in the output that Reddit was out, because a
sweep without it is running on forum populations that select for themselves.
Discourse forums are the reliable substitute: every install exposes a public
JSON API, so any topic URL plus `.json` returns structured posts with real
timestamps.

If you cannot read real page content, **stop and say so.** Do not fall back on
search snippets, recall, or vendor blogs. An assistant that does will produce a
well-formed batch of signals that were never sourced: real-looking dates, real-
looking quotes, and nothing on the page ever said them. That silent failure is
the single thing this whole method exists to prevent. A refusal is a useful
answer here. A plausible batch built without reading the pages is not.

**If retrieval fails, or the user would rather not depend on it:** the bundled
collector fetches Hacker News, any Discourse forum, and open GitHub issues into
a local JSONL cache, so timestamps come from the source API instead of from
your reading of a page. Standard library Python, no `pip install`, no API keys.

`hn` and `discourse` need no account and no setup at all. **`github` is the
exception:** it shells out to the `gh` CLI, so that one source needs `gh`
installed and `gh auth login` run once, and it exits with a message saying so
rather than failing quietly. Don't route someone to `github` on a no-setup
promise.

```bash
python3 collector/collect.py hn --query "invoice scanning" --since 30d
```

See [`collector/README.md`](collector/README.md) for the other sources and the
cache layout. Landscape research still needs page access, so say plainly which
parts you can and cannot do.

## Step 1: Pick a mode

**Default: guided.** Read [`method/GUIDED.md`](method/GUIDED.md) and follow it.
It interviews the user in plain language (what they're hunting, who for, any
focus, anything to exclude, how many, what output format), then does the
configuring itself: the role, the communities, the search patterns, who not to
believe. Ask one or two questions at a time, skip anything already answered,
reflect the plan back, and wait for a go before spending searches.

**If the user already knows exactly what they want,** or wants a saved,
reusable prompt, use [`method/PROMPT.md`](method/PROMPT.md) instead. It is the
same engine as a fill-in template. [`method/RECIPES.md`](method/RECIPES.md) has
the exact swaps for non-software targets, and
[`method/EXAMPLE.md`](method/EXAMPLE.md) is one already assembled.

Ignore the "paste this whole file into an assistant" preamble in those files.
That instruction is for people who don't have this skill installed. You are
already here. Everything below the preamble applies unchanged.

### Ask the output format before you spend a single search

Not at the end. **Here**, alongside confirming the plan. Three options, and say
the tradeoff out loud:

- **In the chat** (default, cheapest). A readable rundown, nothing on disk.
- **Markdown file** (convenient). Save it, search it, paste it anywhere.
- **HTML page** (best to read). One self-contained file, opens in a browser.
  If they pick this, HTML-escape every researched field and allow only
  `http`/`https` in an `href`. Researched text is written by strangers, and an
  unescaped thread title runs their markup when the file is opened. The rule is
  in [`method/RUBRIC.md`](method/RUBRIC.md).

Ask even when the request arrived fully specified, because a detailed opening
message reads as complete while never mentioning a format. This gets skipped
constantly. The research is the expensive part, so a format decided after it is
a decision made too late to change anything.

## Step 2: Apply the rubric before you output anything

Read [`method/RUBRIC.md`](method/RUBRIC.md). It is the quality bar, and it is
non-negotiable. Every rule in it was earned by a real failure: a fabricated
date, a vendor blog masquerading as demand, a dead thread cited as ongoing.

The short version, with the full set in the rubric:

- A `source` is a **real user in their own words**. Vendor blogs, "X vs Y"
  pages, and "best alternatives to X" listicles are landscape evidence, never
  demand.
- **Open every URL you cite.** Confirm the date off the page, that the author
  is a user and not a seller, that the page actually loaded, and that the
  source proves the *specific* thing your title claims.
- **Never invent** a date, an engagement number, or a "just shipped" claim.
- **List every credible competitor**, not just the closest one. Each gets a
  name, a live link, a neutral line on what it actually does, and the specific
  way it differs. Two is a floor. Name plus dismissal is not a landscape.
- Every negative landscape claim ("X doesn't do Y") gets verified against the
  page. Misrepresenting an existing solution is the most common error.
- **Quality over count.** Up to 10, never padded. If a signal has zero verified
  real-user sources after verification, drop the signal.

## Step 3: Deliver

Under the hood you always produce the same verified signals matching
[`method/schema.json`](method/schema.json). Render them in whichever of the
three formats they picked back in step 1. If you somehow reached this point
without asking, ask now and wait, rather than guessing and writing.

Raw JSON is available on top of any of them for feeding the example site or
their own tooling. Offer it at the end rather than leading with it.

**The landscape renders as a list in all three, never a paragraph.** One row
per tool: linked name, what it does, how it differs. A table in Markdown, a
real `<table>` in HTML. `GUIDED.md` step 4 has the full shape of each format.

Then offer them the configured prompt so they can re-run the same hunt later
without the interview.

Validate any JSON destined for the example site:

```bash
node reference/validate-staging.mjs path/to/batch.json --strict
```

## Reference map

| File | What it is |
|------|------------|
| [`method/GUIDED.md`](method/GUIDED.md) | Interview then hunt. The default path. |
| [`method/PROMPT.md`](method/PROMPT.md) | The manual engine, as a template. |
| [`method/RUBRIC.md`](method/RUBRIC.md) | The evidence rules. Read before output. |
| [`method/RECIPES.md`](method/RECIPES.md) | Swaps for non-software targets. |
| [`method/EXAMPLE.md`](method/EXAMPLE.md) | A finished, retargeted prompt. |
| [`method/schema.json`](method/schema.json) | The output shape. |
| [`collector/`](collector/) | Local retrieval when page fetch fails. |
| [`site/`](site/) | Optional Astro front-end that renders batches. |
| [`reference/`](reference/) | How Signal ran this on a daily cron. |
