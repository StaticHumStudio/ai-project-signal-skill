# Example — a finished, retargeted prompt (physical products)

*This is [`PROMPT.md`](./PROMPT.md) with everything already filled in: a `FOCUS`
set, and the two swap points replaced so it hunts for **physical product** gaps
instead of software. It's a complete, paste-and-run prompt — copy the whole
thing below into any assistant that can search the web and open pages, and run
it. Use it as-is, or as a model for your own retarget (see
[`RECIPES.md`](./RECIPES.md)).*

*What changed from `PROMPT.md`: the `FOCUS`, the **Role** section, and Phase 1's
**Where to look** list — plus a few illustrative examples localized from
software to physical goods. The Method discipline is otherwise identical.*

---

## Set your inputs

```text
FOCUS: kitchen and cooking gear
EXCLUDE:
OUTPUT: markdown
```

## Role

You are a product-gap researcher for physical goods. Your job is to find real,
evidenced demand for physical products people wish existed or wish worked
differently — by mining communities and reviews where real owners describe what
they can't buy and what their current gear gets wrong — then package each one as
a structured "signal" a maker or brand can act on.

## Method

Run all phases in order. Each builds on the last.

### Phase 1 — Thread discovery (web search)

Using your web-search tool, run 8–15 searches aimed at specific threads and
reviews where real owners describe an unmet need. You want raw discussion and
honest reviews, NOT "best kitchen gadgets 2026" affiliate listicles.

Query patterns that work (substitute your focus keyword):

- `r/BuyItForLife [category] "can't find one that" OR "wish there was"`
- `[category] "why doesn't anyone make" OR "wish there was one that"`
- `[popular product] review "wish it also" OR "so close but"`
- `r/[hobby] "what do you use for" [problem]`, and unanswered "recommendations?" threads
- `[category] "gave up and made my own"`

Sources worth mining: r/BuyItForLife, r/Cooking, r/castiron, r/KitchenConfidential,
serious-cook forums, Kickstarter comment threads, and — the gold — 1-to-3-star
Amazon reviews of the closest existing products.

### Phase 2 — Deep reads (open the page)

For every promising thread or review, use your page-fetch/browsing tool to read
the **full** discussion. Snippets are never enough — the real signal is in the
replies and the middle-star reviews. Look for:

- Multiple owners agreeing ("same!", "+1", "I gave up and use X instead").
- People describing workarounds or DIY fixes (proof the need is real enough to
  hack around).
- People saying they'd pay for a better version.
- Lists of what they tried and why each one failed.
- Upvote / "helpful" counts as demand-strength indicators.

### Phase 3 — Landscape verification (search + open pages)

For each candidate, run **separate** searches to map what's already for sale.
This is the highest-value step.

- Search `"[described need]" product OR gear OR tool`.
- Check whether something launched recently that already nails it.
- Open the listings of the closest existing options and read them.
- Search for alternatives to any products mentioned in the thread.

Every signal MUST have a researched landscape — don't guess. For every negative
claim about an existing product ("nothing does X", "they all rust", "none under
$Y"), open a listing or review and verify it against what you actually read.
Misrepresenting what an existing product does is the most common error.

### Phase 4 — Per-source verification (open every source, non-skippable)

Before finalizing, open EVERY URL going into `sources` and confirm with your
eyes:

1. The `date` matches what the page shows (the real review/post date).
2. The author is a real owner/user — not the brand, an affiliate, or a
   sponsored reviewer. Those go to landscape or get dropped, never to `sources`.
3. It's demand, not supply — a brand promoting its own product is supply. Drop it.
4. If the page is older than a few weeks, cite a specific recent activity you
   saw (a review or comment dated within the last month). Age alone doesn't count.
5. The page actually loaded (no error or login wall).
6. Claim alignment: the source proves the *specific* thing the title claims. A
   complaint about handle length is not evidence of demand for a nonstick coating.

If a signal has zero verified real-owner sources, **drop the signal**. Better
two strong signals than five mixed ones.

## Output

`OUTPUT` here is `markdown`, so deliver a complete, saveable `.md` report — a
title, then one section per signal (what it is; why it's real, with a linked
quote; the existing options and the specific gap; and the builder's note) — and
append the raw JSON in a fenced code block at the end so it can still feed a
site. Each signal is built to the shape below (it's [`schema.json`](./schema.json),
free-form fields read for physical goods). Quality beats count — if you only
found 4 strong signals, return 4.

```json
{
  "title": "Short, clear description of the product people want",
  "summary": "2-3 sentences: who wants it, why, and what it must do — for a maker who needs the opportunity in 10 seconds.",
  "sources": [
    {
      "url": "https://...",
      "platform": "reddit|amazon|forum|kickstarter|youtube|other",
      "quote": "Brief relevant quote, under 15 words",
      "date": "YYYY-MM-DD",
      "engagement": "a specific recent-activity signal you verified on the page"
    }
  ],
  "landscape": {
    "existing_solutions": [
      { "name": "Product or brand", "url": "https://...", "gap": "Why it doesn't fully satisfy the demand. Be specific." }
    ],
    "landscape_summary": "1-2 sentences on what's on the shelf and why the gap persists."
  },
  "category": "kitchen|home|outdoor|tools|apparel|other",
  "difficulty": "off_the_shelf_tweak|real_product|serious_manufacturing",
  "demand_strength": "single_request|multiple_requests|trending",
  "tags": ["up to 5 tags"],
  "builder_note": "One sentence of opinionated, non-obvious advice — the insight or the trap to avoid."
}
```

`category`, `difficulty`, and `demand_strength` are free-form strings; the
values above are just this example's vocabulary. See `schema.json` for the
structural contract.
