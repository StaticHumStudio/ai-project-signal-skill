# Sourcing Rubric

The quality bar that separates a real demand signal from a plausible-sounding
guess. Every one of these rules was earned by a real failure — a fabricated
date, a vendor blog masquerading as demand, a dead thread cited as "ongoing."
Apply them before you output anything.

## Sources vs. landscape

A `source` is **direct evidence of demand**: a real user, in their own words,
expressing an unmet need. That is the only thing that belongs in `sources`.

Vendor blogs, "X vs Y" comparison pages, "best alternatives to X" listicles,
and anything authored by a company that sells in the space are **landscape**
evidence, never demand. Put them in `landscape.existing_solutions` if they're
useful, or drop them. They never go in `sources`. If a signal's only evidence
is vendor blogs and SEO comparisons, it has no real user demand — drop it.

## Thread recency

Only cite ongoing demand. Signals should come from roughly the last two weeks;
an older thread qualifies **only** if you verify it's still live. The
`engagement` field must name a specific recent-activity signal you personally
saw on the page — a comment dated within the last month, a rising count, a
linked active thread. "Wide agreement" or "ongoing demand" with no dated
example does not count. A closed thread, or one with zero replies, cannot be
described as ongoing discussion.

## No fabricated facts

Never invent a source date, an engagement number, or a "newly available" /
"just shipped" / "platform blocker just removed" claim. The `date` is the real
publication date from the source page (the HN submission time, the Reddit post
time, the review's posted date). If you can't find a real date, drop the
source. If a capability has existed for years, the honest framing is "mature
and available," not "newly possible." When in doubt, quote the page verbatim
rather than paraphrasing from memory.

## Verify every source

Before a signal ships, open every URL you cite and confirm with your eyes:

- The **date** matches the page.
- The author is a **real user**, not a vendor/company/competitor article. Work
  out who sells in this space as you go, from the pages themselves — no
  pre-supplied blocklist will cover your focus area, and its absence is never
  an excuse to treat marketing as demand.
- It's **demand, not supply** — someone promoting their own product (a typical
  "Show HN") is supply; drop it from `sources`.
- The page **actually loaded** — a 429, an error, or a login wall means you
  can't cite what's on it. Drop it.
- **GitHub issues**: the issue is OPEN (closed/Done/Won't-Fix issues don't
  prove unmet demand) **and** actually requests what you claim. An issue about
  reading data isn't evidence of write-back demand.
- **Platform match**: an iOS, Linux, or desktop source doesn't prove Android
  demand (and vice versa). If a source is cross-platform, say so in
  `engagement`.
- **Claim alignment**: the source must prove the *specific* thing the title
  claims. A bug report about saving settings is not evidence users want a new
  feature. If a source proves a related-but-different thing, narrow the signal
  to match it, or drop the source and find one that fits.

For every negative landscape claim ("X doesn't do Y", "no free tier"), open the
solution's page and verify it's still true. Misrepresenting what an existing
solution does is the most common landscape error.

## Quality over count

Return up to 10 signals, but never pad. Four strong, well-sourced signals beat
ten mixed ones. Reject: things that already exist and work well; single-person
requests with no engagement; technically infeasible ideas; vague complaints
with no clear product implication; spam and self-promotion; SEO listicles. If
a perfect, well-known solution already exists, drop the signal — the valid case
is when existing solutions are inadequate, overpriced, or privacy-hostile, and
you can name the gap specifically. Prefer signals with multiple independent
sources and ones where people explicitly say they'd pay.
