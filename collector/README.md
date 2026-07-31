# Collector: retrieval, separated from judgment

The method in [`../method/`](../method) asks an assistant to do two different
jobs at once: go fetch real discussion, and judge whether it is real demand.
Welding those together has a failure mode that is worse than an error.

If the assistant cannot reach a page, it does not usually say so. It falls back
on search snippets and recall and hands you a confident, well-formed batch of
signals that were never sourced. The dates look real. The quotes look real.
Nothing on the page ever said them.

This directory splits the two jobs. `collect.py` does retrieval into a local
JSONL cache, taking every timestamp straight from the source API. The assistant
then reads the cache and applies [`../method/RUBRIC.md`](../method/RUBRIC.md) to
what is actually in it. Dates stop being something the model reports and start
being something the file records, which removes the single most common
fabrication the rubric exists to catch.

Standard library only. No `pip install`, no virtualenv, no API keys.

The `hn` and `discourse` collectors need no account and no setup at all. The
`github` collector is the exception: it shells out to the
[`gh` CLI](https://cli.github.com/), so that one needs `gh` installed and
`gh auth login` run once. It exits with a message telling you so rather than
failing quietly. Developed and tested on Python 3.12. It should run on 3.9 and newer,
but that is reasoning about the syntax used rather than something anyone has
verified, so if you are on an older Python and it breaks, please open an issue
with the traceback.

## Run it

```bash
python3 collector/collect.py hn --query "invoice scanning" --since 30d
```

```bash
python3 collector/collect.py discourse --instance community.spiceworks.com --limit 30
```

```bash
python3 collector/collect.py github --query "\"wish there was\" in:body created:>2026-06-01"
```

Everything lands in `cache/<YYYY-MM-DD>/<source>.jsonl`, which is gitignored.
Re-running is safe and additive: records are deduplicated by id, so a real hunt
is several passes with different queries and you keep the union.

## Then point your assistant at the cache

Paste [`../method/PROMPT.md`](../method/PROMPT.md) as usual, and add:

> Skip Phase 1. The threads are already retrieved. Read every `.jsonl` file
> under `cache/<today>/`. Each line is one document with a real `url`, `author`,
> and `created_utc` taken from the source API. Apply the rubric to these
> records. Use `created_utc` for the `date` field, never your own estimate. You
> still have to do Phase 3 landscape research yourself, and you still have to
> drop anything that is supply rather than demand.

The preflight page-access test in the main README still applies to Phase 3,
because landscape verification means opening a vendor's page and reading it.
The cache removes the retrieval dependency for sources, not for landscape.

## The record shape

```json
{
  "id": "hackernews:48968606",
  "source": "hackernews",
  "kind": "story",
  "url": "https://news.ycombinator.com/item?id=48968606",
  "title": "...",
  "body": "...",
  "author": "someuser",
  "created_utc": "2026-07-30T07:36:05Z",
  "score": 42,
  "num_comments": 17,
  "thread_id": "hackernews:48968600",
  "thread_url": "https://news.ycombinator.com/item?id=48968600",
  "query": "invoice scanning",
  "retrieved_at": "2026-07-30T23:41:02Z"
}
```

`thread_id` and `thread_url` let the assistant reconstruct a conversation from
loose comments, which matters because the signal is usually in the replies, not
the headline. `query` records what surfaced the document, so you can tell a
targeted hit from a broad sweep.

## What each source is good for

**Hacker News** (`hn`) pulls stories and comments through the Algolia search
API. Deep, technical, and heavily skewed toward developers and founders, so it
is strong for tooling and infrastructure demand and weak for anything consumer.
Watch for `Show HN`, which is somebody promoting their own product. That is
supply, and the rubric says drop it from sources.

**Discourse** (`discourse`) works against any Discourse forum, and a surprising
number of trade, hobby, and vendor communities run one without anybody thinking
of it as an API. This is probably the most untapped vector in the set. Find an
instance by looking for `/latest.json` on a forum you already know.

**GitHub** (`github`) searches open issues through the `gh` CLI, which you need
installed and authenticated. Unauthenticated GitHub is 60 requests an hour,
which is unusable, and going through `gh` means this script never handles a
token. Only open issues count as unmet demand, so `is:open` is forced into every
query.

## What this deliberately does not do

**It does not touch Reddit.** Reddit's `robots.txt` is `Disallow: /` for every
user agent, and the free Data API tier is non-commercial only, with terms that
bar deriving revenue from it and require deleting data outside your approved use
case. A collector shipped in a public repo would hand that obligation to every
person who cloned it. If you want Reddit, register your own app, read the
[Data API Terms](https://redditinc.com/policies/data-api-terms), and decide for
yourself. The robots check in `collect.py` will refuse Reddit URLs on purpose.

If your assistant can drive a real browser, you already have Reddit without any
of this, which is the honest answer for most people.

**It does not scrape.** `collect.py` checks `robots.txt` before every request
and refuses anything disallowed, including `/search` on stock Discourse, which
is why the Discourse collector walks category and latest listings and filters
titles locally instead. A host it cannot reach at all is treated as disallowed,
because guessing permissively is how you end up scraping something that asked
you not to.

**It does not hurry.** There is a minimum delay between requests to the same
host. Nothing here is time critical, and a collector that hammers a volunteer
run forum is a collector that gets the whole project blocked.

## Not yet built

App store reviews are a good fit and need no auth. Apple serves a documented
customer-reviews RSS feed per app id. Google Play has no official API, so it
would be HTML scraping and belongs behind a clear caveat if it lands at all.
The open design question is curating app ids per vertical, which is a registry
to maintain rather than a collector to write.

Stack Exchange was probed and works, but it was cut on quality, not access.
People there ask how to do a thing, not what they wish existed, which is the
wrong shape of statement for this method.
