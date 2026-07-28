# Demand Signal Sourcing

## How to use this file

Paste this whole file into any assistant that can search the web and open pages
(Claude, ChatGPT, Gemini, or similar) and run it. It does **one research pass**
and returns the result in its reply — there is no file to write and no repo to
read.

> **Don't want to set anything up?** Paste [`GUIDED.md`](./GUIDED.md) instead —
> it interviews you in plain language and does all of the configuring below for
> you. This file (`PROMPT.md`) is for when you'd rather drive it by hand.

Three ways to use it, from least to most editing:

1. **Paste and run as-is** — you get an open sweep for unmet *software* demand.
2. **Steer it** — fill in the input block below before you paste. Every line is
   optional; all blank means "open sweep, no exclusions, work the rest out
   yourself."
3. **Retarget it** to something non-software — content gaps, physical products,
   local business, competitor intel, books, and so on — by replacing the **two
   marked swap points** below (the *Role* section, and Phase 1's *Where to look*
   list). Nothing else changes. [`RECIPES.md`](./RECIPES.md) has the exact
   drop-in text for each, and [`EXAMPLE.md`](./EXAMPLE.md) is a complete,
   retargeted prompt you can paste and run right now.

Everything from **`## Method`** onward is the discipline that makes the results
trustworthy — leave it exactly as-is unless a recipe tells you to edit Phase 1.
And hold the whole run to the quality bar in [`RUBRIC.md`](./RUBRIC.md); it is
what separates a real signal from a plausible-sounding guess.

## Set your inputs (optional)

Fill in any of these before you paste — or leave them all blank:

```text
FOCUS:
EXCLUDE:
DISTRUST:
OUTPUT:
```

- **OUTPUT** — how you want the results delivered: `json` (only the JSON array,
  with no prose or Markdown wrapping — the default, and what the example site
  consumes), `rundown` (a readable writeup in the reply), `markdown` (a
  saveable `.md` report), or
  `html` (a single self-contained page you can open in a browser). Blank =
  `json`. See the **Output** section for what each produces.
- **FOCUS** — a category or theme to bias toward, e.g. `developer tools`,
  `privacy / local-first`, `parenting`, `Android apps`. Blank = an open sweep
  across all categories: widest net, favor serendipity and cross-category
  patterns. Across repeated passes you can rotate focus instead of repeating
  yourself — mobile/consumer, then dev tools / CLIs / infra, then SaaS / B2B /
  workflow automation, then privacy / local-first / self-hosted, then a fully
  open sweep, then niche communities (health, parenting, cooking, hobbies,
  accessibility).
- **EXCLUDE** — titles or summaries of signals you already know about, so this
  pass doesn't resurface them even if phrased differently. Blank = no
  exclusions. You can also vary *where* you look from pass to pass to avoid
  tunnel vision (Reddit-heavy one time; Hacker News + Indie Hackers another;
  app-store reviews + Bluesky another; Product Hunt + niche forums another).
- **DISTRUST** — specific sites or domains whose content must never count as
  demand evidence, if you already know of some. Blank is the normal case and
  the default: **working out who the vendors, affiliates, and SEO farms are in
  this space is the assistant's job**, done live in Phase 4 against pages it
  actually opened. This line only exists to hand over the ones you already know
  about, not to make you build a blocklist first.

## Role — swap point 1 of 2

*The default below hunts unmet software demand. To hunt something else, replace
this whole section with a role from [`RECIPES.md`](./RECIPES.md).*

You are a demand signal researcher for the software industry. Your job is to
find real, actionable evidence of unmet software demand by mining online
communities where real users express frustration, wishes, and unmet needs —
then package each one as a structured "signal" a builder can act on.

## Method

Run all phases in order. Each builds on the last.

### Phase 1 — Thread discovery (web search) · swap point 2 of 2

Using your web-search tool, run 8–15 searches aimed at **specific threads**
where real users discuss unmet needs. You want raw community discussion, NOT
listicle articles and NOT "top app ideas" SEO content.

*To retarget: replace the query patterns and community list below with your
domain's from [`RECIPES.md`](./RECIPES.md). The intent — hunt real threads, not
listicles — stays the same.*

Query patterns that work (substitute your focus keyword):

- Reddit sweeps: `r/[subreddit] "looking for" OR "wish" OR "doesn't exist"
  [keyword]`, `r/SomebodyMakeThis [keyword]`, `r/AppIdeas [keyword]`,
  `r/SideProject "what should I build"`.
- Hacker News: `"Ask HN" [keyword] wish OR need OR want OR build`,
  `site:news.ycombinator.com [keyword] "doesn't exist"`.
- App-store reviews: `"[popular app] missing feature"`, `"[popular app] wish
  it could"`, `"[popular app] alternative" frustrated`.
- Twitter/Bluesky: `[keyword] "wish there was" OR "someone build" OR "why
  isn't there"`, `[keyword] "I'd pay for"`.
- General frustration: `"[category] app sucks"`, `"switched from [popular app]
  nothing does [feature]"`.

Communities worth mining depend on your focus, but a broad starting set:
r/androidapps, r/software, r/iOSProgramming, r/personalfinance, r/ADHD,
r/productivity, r/privacy, r/degoogle, r/selfhosted, r/parenting,
r/BuyItForLife, r/cooking, r/homeautomation, r/smallbusiness, r/Entrepreneur.

### Phase 2 — Thread deep reads (open the page)

For every promising thread, use your page-fetch/browsing tool to read the
**full** thread. Search snippets are never enough — the real signal is in the
replies, not the headline. Look for:

- Multiple users agreeing ("same!", "+1", "I need this too").
- Users describing workarounds (proof the need is real enough to hack around).
- Users mentioning willingness to pay.
- Users listing what they tried and why each failed.
- Upvote / engagement counts as demand-strength indicators.

### Phase 3 — Landscape verification (search + open pages)

For each candidate signal, run **separate** searches to map the competitive
landscape. This is the highest-value step.

- Search `"[described need]" app OR tool OR software`.
- Check whether anything launched recently that already solves it.
- Open the sites/listings of the closest existing solutions and read them.
- Search for alternatives to any tools mentioned in the thread.

Every signal MUST have a researched landscape section — don't guess. For every
negative claim about an existing solution ("X doesn't do Y", "no free tier",
"X requires ID"), open that solution's page and verify it against what you
actually read. If you claim "no free option", check for hardship/scholarship/
fee-assistance programs first and disclose them in the `gap` field. For any
dated policy or platform mandate, state which geographies it applies to and
when — a regional rollout is not a global requirement.

### Phase 4 — Per-source verification (open every source, non-skippable)

Before finalizing, open EVERY URL going into `sources` and confirm with your
eyes (full checklist in [`RUBRIC.md`](./RUBRIC.md)):

1. The `date` matches what the page shows (use the real posted date).
2. The author is a real user — not a vendor/company/competitor article. Decide
   this yourself from the page: who runs this domain, do they sell in this
   space, is the page structured to rank rather than to complain? Anything on
   the `DISTRUST` list is out on sight, but that list is a shortcut, not the
   test.
3. It's demand, not supply — drop "Show HN"/self-promo of one's own product.
4. If the page is older than ~2 weeks, cite a specific recent activity you saw
   (a comment dated within the last month). Post age or total comment count
   alone does not count.
5. The page actually loaded (no 429, error, or login wall).
6. GitHub issues: verify the issue is OPEN and actually requests what you claim.
7. Platform match: an iOS/Linux/desktop source doesn't prove Android demand.
8. Claim alignment: the source proves the *specific* thing the title claims.

If a signal has zero verified real-user sources after this, **drop the signal**.
Better to return 2 strong signals than 5 mixed ones.

## Output

Whatever the format, you always build the same verified signals internally — up
to 10 objects in the shape below (quality beats count; if you only found 4
strong ones, return 4, and never pad with weak, stale, or thinly-sourced ideas).
**How you present them depends on `OUTPUT`:**

- **`json`** (default) — only the JSON array of signal objects. No preamble,
  Markdown fence, or summary may appear before or after it. This is what the
  example `site/` consumes.
- **`rundown`** — a readable writeup in your reply: a one-line intro, then each
  signal as a short block (what it is; why it's real, with the best quote +
  link; what already exists and the gap; the builder's note).
- **`markdown`** — the same writeup as a complete `.md` document (a title, a
  section per signal with linked sources, landscape, and builder's note), with
  the raw JSON appended in a fenced code block so it can still feed a site.
- **`html`** — a single self-contained `.html` file (inline CSS, no external
  requests, clean and readable) rendering that report, openable in a browser
  with no build step.

Each signal object looks like this:

```json
{
  "title": "Short, clear description of what people want",
  "summary": "2-3 sentences: who wants it, why, and the core value prop — written for a builder who needs to get the opportunity in 10 seconds.",
  "sources": [
    {
      "url": "https://...",
      "platform": "reddit|hn|twitter|bluesky|producthunt|appstore|playstore|other",
      "quote": "Brief relevant quote, under 15 words",
      "date": "YYYY-MM-DD",
      "engagement": "a specific recent-activity signal you verified on the page"
    }
  ],
  "landscape": {
    "existing_solutions": [
      { "name": "App or tool", "url": "https://...", "gap": "Why it doesn't fully satisfy the demand. Be specific." }
    ],
    "landscape_summary": "1-2 sentences on the current state and why the gap persists."
  },
  "category": "android_app|ios_app|saas|browser_extension|dev_tool|desktop_app|api_service|hardware|other",
  "difficulty": "weekend_hack|real_project|venture_scale",
  "demand_strength": "single_request|multiple_requests|trending",
  "tags": ["up to 5 tags"],
  "builder_note": "One sentence of opinionated, non-obvious advice — the insight or the trap to avoid."
}
```

`category`, `difficulty`, and `demand_strength` are free-form strings; the
values above are the conventional vocabulary. See `schema.json` for the exact
contract.
