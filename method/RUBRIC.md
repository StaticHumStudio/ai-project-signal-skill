# Sourcing Rubric

The quality bar that separates a real demand signal from a plausible-sounding
guess. Every one of these rules was earned by a real failure: a fabricated
date, a vendor blog masquerading as demand, a dead thread cited as "ongoing."
Apply them before you output anything.

## Sources vs. landscape

A `source` is **direct evidence of demand**: a real user, in their own words,
expressing an unmet need. That is the only thing that belongs in `sources`.

Vendor blogs, "X vs Y" comparison pages, "best alternatives to X" listicles,
and anything authored by a company that sells in the space are **landscape**
evidence, never demand. Put them in `landscape.existing_solutions` if they're
useful, or drop them. They never go in `sources`. If a signal's only evidence
is vendor blogs and SEO comparisons, it has no real user demand. Drop it.

## Thread recency

Only cite ongoing demand. Signals should come from roughly the last two weeks;
an older thread qualifies **only** if you verify it's still live. The
`engagement` field must name a specific recent-activity signal you personally
saw on the page. A comment dated within the last month, a rising count, a
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
  out who sells in this space as you go, from the pages themselves. No
  pre-supplied blocklist will cover your focus area, and its absence is never
  an excuse to treat marketing as demand.
- It's **demand, not supply**. Someone promoting their own product (a typical
  "Show HN") is supply; drop it from `sources`.
- The page **actually loaded**. A 429, an error, or a login wall means you
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

## Landscape depth

The landscape is the part a reader cannot check for themselves, so show your
work. **List every credible option you found, not just the closest one.** Two
is a floor, not a target. If a space has eight plausible tools, the reader
needs all eight and a line on each, or they'll go and find the other six
themselves and stop trusting the ones you did name.

Each entry gets three things: the **name**, a live **url**, and a **gap** that
says specifically how it differs from what people are asking for. Add a
**`does`** line wherever you can: one neutral sentence on what the product
actually is, written the way its maker would write it. Name plus gap alone
reads as a list of dismissals. Name plus what-it-does plus gap reads as a
comparison, which is the thing that's actually useful.

Write the gap as a **difference, not a verdict.** "Crowded space" and "not
quite there" are useless. "Processes locally but needs a Home Assistant server
first" is a fact the reader can act on. Where a tool genuinely does solve part
of the demand, say so plainly. A landscape that makes every competitor sound
worthless is a landscape nobody believes.

An empty `existing_solutions` is allowed but expensive: `landscape_summary`
then has to say what you searched and why nothing came back. "I found nothing"
without the search behind it is indistinguishable from not looking.

## Quality over count

Return up to 10 signals, but never pad. Four strong, well-sourced signals beat
ten mixed ones. Reject: things that already exist and work well; single-person
requests with no engagement; technically infeasible ideas; vague complaints
with no clear product implication; spam and self-promotion; SEO listicles. If
a perfect, well-known solution already exists, drop the signal. The valid case
is when existing solutions are inadequate, overpriced, or privacy-hostile, and
you can name the gap specifically. Prefer signals with multiple independent
sources and ones where people explicitly say they'd pay.
