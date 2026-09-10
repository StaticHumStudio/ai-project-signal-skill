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

## Browser permission (including preflight)

Use ordinary page retrieval or official APIs first. If required content is
missing, explain what you need to read and ask explicitly before any browser
action, including reading an existing tab. State the pages or research-run
scope and whether an existing signed-in session is included. For example:
"The replies did not load. May I use your browser for read-only research during
this run, including your signed-in session if needed, to read these threads?"

Wait for an explicit yes within that scope. A prior explicit grant for this run
is sufficient. Keep page-only grants to that page and public-only grants out of
signed-in sessions. Ask before expanding scope, and get a new grant for a later
run. Availability, ambient tabs, silence, and ambiguous replies are not approval.
Stop browser activity immediately if permission is revoked.

After refusal or while awaiting an answer, continue independent research through
permitted nonbrowser routes and disclose gaps. Do not repeatedly ask after a
refusal. An unattended run without a grant continues without a browser. Read-only
approval covers navigation and expanding comments, never posting, messaging,
purchases, mutating form submissions, or account changes. Follow host sign-in
and challenge rules. Do not bypass restrictions or export credentials, and
never cite content you could not read. Mark inaccessible rules unverified. Stop only work that lacks essential
verified evidence.

## Step 0: Preflight (do this first, every time)

**Before any research, check page access through ordinary retrieval or an
official API.** Try one Reddit thread and one forum thread and report what you
can read. Apply the browser permission gate above before any browser fallback.
Searching and fetching a given page are different capabilities, and the second
varies by harness and by site.

Reddit access depends on the host and route. Earlier checks (2026-08-02)
found blocked retrieval and a 403 from its unauthenticated `.json` endpoint.
Treat those as dated observations, not a guarantee about today's access. Do
not bypass restrictions. If it remains unavailable, use reachable communities
and disclose that coverage gap. Discourse's public JSON API is another ordinary
retrieval route when the instance permits it.

If essential content remains unreadable after the permitted retrieval options,
**stop and say so for that part of the research.** Continue independent work on
accessible sources. Search snippets, recall, and vendor blogs cannot replace
verified user evidence. Drop a signal with no readable demand evidence.

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
- New competitor entries include `gap_status` and exact `gap_evidence`
  citations (`url`, short `quote`, actual `checked` date). Verified gaps need
  proof. Inconclusive checks are unverified and worded as uncertainty, not
  feature absence. Old records may omit both fields.
- Historical discussions use separate `supporting_sources`, with original
  dates and `corroborated_by` links to independent current demand within 14
  days of the batch date. Supporting GitHub issues include `issue_status` and
  cited closure reasons. Completed work alone is not unmet demand. The rubric
  defines the exact fields and exclusions. Support does not increase source
  counts or demand strength.
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

In every reader-facing format, show supporting context separately with its
original date, issue state and closure context when relevant, and links to the
current corroborating sources. Competitor rows include verified or unverified
status, exact citation links, short quotes, and check dates. Do not relabel
legacy gaps without metadata as verified. Escape this researched text in HTML
and allow only HTTP or HTTPS evidence links.

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
