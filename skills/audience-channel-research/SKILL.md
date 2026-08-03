---
name: audience-channel-research
description: Find where a specific audience already gathers and which of those venues you can legitimately show up in, by opening each venue's own rules page and quoting verbatim what it says about self-promotion. Use when the user has made something and wants to know where to reach people, where to post or submit or launch it, which directories and communities accept their kind of project, how to promote an open source or indie project without getting banned, or what a subreddit or forum's self-promotion rules actually say. Produces a one-time placement checklist and a standing watchlist, sorted by effort. Requires an assistant that can open specific web pages, not just search.
---

# Audience and Channel Research

The reverse of demand research. That one asks *what should I make.* This one
asks *where do I reach the people who'd want it.*

Same engine, same evidence discipline, same refusal to guess. The output is a
set of venues with pros and cons, each one anchored to a verbatim quote from
that venue's own rules about self-promotion, with the URL and the date it was
read.

**Two things this is not.** Not a ranking, because a ranked list invites the
user to do number one and stop, which is the behavior that gets people banned
from number one. Not a content calendar, because a posting schedule decays into
posting on the first of the month rather than when there's something to say.

## Step 0: Preflight (do this first, every time)

**Before any research, confirm you can actually open pages.** Open one forum's
rules page and one directory's submission policy and report what you see.
Searching the web and fetching a given page are different capabilities, and the
second varies by harness and by site.

The whole value of this method is reading rules verbatim. An assistant working
from recall will confidently tell a user that a community welcomes project posts
when its sidebar says the opposite, and the user finds out by getting banned.
**Getting banned is the failure mode this method exists to prevent, and guessing
is how you get there.**

Expect Reddit to fail. Its `robots.txt` is `Disallow: /` for every agent and the
unauthenticated `.json` endpoint returns 403. That matters more here than it
does for demand research, because per-subreddit self-promotion rules are strict,
wildly inconsistent between subreddits, and the single most common place people
get banned. If you cannot read a subreddit's sidebar, **say so, quote nothing,
and tell the user to read it themselves.** Never reconstruct a subreddit's rules
from memory.

If you cannot read real page content at all, **stop and say so.** A refusal is a
useful answer. A confident list of venues you did not verify is not.

The bundled collector covers the "is this venue alive" half without page access:

```bash
python3 collector/collect.py discourse --instance <forum-host> --limit 30
```

See [`collector/README.md`](collector/README.md). The rules half needs page
access, so say plainly which parts you could and could not do.

## Step 1: Run the method

Read [`method/CHANNELS.md`](method/CHANNELS.md) and follow it. It interviews the
user (what they made, who it's for, what it is commercially, what they've
already tried, how much time they have and whether it's a lump or a trickle),
then maps venues, then verifies each one's rules.

Ignore the "paste this whole file into an assistant" preamble at the top. That
is for people who don't have this skill installed. You are already here.

**Ask the commercial question plainly and early.** Open source, free and closed,
paid, freemium, or a service. It decides which doors are open. Many venues ban
commercial promotion in one sentence and permit sharing free or open source work
in the next, so an MIT or GPL project walks through doors a paid app cannot.
Finding that carve-out is worth more than five generic suggestions.

**Ask the output format before spending a single search.** In the chat (default,
cheapest), a Markdown file, or a self-contained HTML page. This gets skipped
constantly, and the research is the expensive part, so a format decided after it
is a decision made too late to change anything.

## Step 2: Read the rules, verbatim (the part nobody does)

For every venue that survives, **open its actual rules page and quote what it
says about self-promotion.** Not a summary. Not your recollection. The sentences,
with the URL, and the date you read them.

Look in this order: sidebar rules, `/about`, `/guidelines`, `/faq`, a pinned
"read before posting" thread, `CONTRIBUTING.md`, the pull request template, the
submission or inclusion policy.

Sort each into one verdict: **open door** (explicitly invites maker
submissions), **conditional** (allowed within a stated limit), **closed**
(banned outright, or for this commercial category), **unwritten** (rules read,
nothing about promotion found), or **unverified** (page would not load).

**Unwritten is the highest risk, not the lowest.** No written rule does not mean
no rule. It means the rule lives in the community's habits and is enforced on
instinct with no page to point at afterward. A venue with a written ratio is
safer than a venue with nothing on the page, because the first one told you the
number. Say this out loud in the output when it comes up.

**Unverified is not a recommendation, it is a task.** Mark it and move on. Never
fill the gap from memory.

[`method/VENUES.md`](method/VENUES.md) is this step done by hand with real
quotes and real dates. Read it for the shape of a good entry. Do not carry its
findings forward as current, because rules pages change.

## Step 3: Deliver two sections

**A one-time placement checklist.** Directories, indexes, and lists you grind
once per project, ordered by effort ascending so the user can stop wherever
their afternoon ends. Each entry leads with the **hard gates** (license,
minimum project age, no-proprietary-dependency rules), because a gate they fail
makes the rest of the entry irrelevant. Then the verbatim rules quote, the
verdict, effort in hours, and **time to first result**, so normal latency does
not read as failure.

**A standing watchlist.** Venues worth showing up in when something happens.
Every entry carries a **trigger phrased as an event in the world**, never a
frequency. "When you ship a release with a user-visible change" is a trigger.
"Post monthly" is a content calendar. Also give the effort per occurrence and
**the specific local tripwire that gets you banned there**, taken from the rules
you actually read, not generic advice.

Both sections: **pros and cons on every entry.** A venue with no listed downside
means you didn't look hard enough.

Close with an honest gap list: venues whose rules you couldn't open, venues you
couldn't confirm are alive, classes where you came up short.

Raw JSON matching [`method/channels.schema.json`](method/channels.schema.json)
is available on top of any format. Offer it at the end.

## Step 4: The guardrail (not optional, not a bolt-on)

This repo's other skill filters marketing out as noise. This one must not
generate what that one rejects. The line falls straight out of the schema.

[`method/RUBRIC.md`](method/RUBRIC.md) sorts everything into two bins. A
**source** is a real user in their own words describing an unmet need.
**Landscape** is anything authored by someone who sells in the space. Landscape
is honest and useful. It just never counts as evidence of demand.

**It is fine to produce landscape. It is never fine to manufacture a source.**

A directory listing, a release note, an honest "I built this, here's what it
does and what it doesn't" post: all landscape, all fine, nobody is fooled and
nobody needs to be. The moment the user produces something engineered to *read*
as a source, they have manufactured the exact artifact the demand method exists
to catch. Sockpuppets, a friend primed to ask the question so they can answer
it, a testimonial they wrote, an undisclosed alt account.

So, in every recommendation you write:

- **Disclosure goes inside the action**, not in a footnote. "Reply, and say it's
  yours" is the whole instruction.
- **Answer first, mention second.** If the reply would be worthless with the
  product removed, it's an ad. Don't recommend it.
- **One account, their own.** No alts, no primed friends, no manufactured
  testimonials.
- Where a venue states a ratio, that ratio is **the floor of decency, not a
  target to hit.**

If a channel only works by breaking one of these, name it and say it doesn't
work for this user. "I considered it and here's why not" is useful. A silent
omission isn't.

## Reference map

| File | What it is |
|------|------------|
| [`method/CHANNELS.md`](method/CHANNELS.md) | The engine. Interview, map, verify rules, deliver. |
| [`method/VENUES.md`](method/VENUES.md) | Step 3 worked by hand, with real quotes and dates. |
| [`method/channels.schema.json`](method/channels.schema.json) | The output shape. |
| [`method/RUBRIC.md`](method/RUBRIC.md) | Shared evidence rules. The guardrail lives here. |
| [`collector/`](collector/) | Local retrieval when page fetch fails. |
