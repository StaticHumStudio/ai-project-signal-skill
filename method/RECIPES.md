# Recipes: point it at something other than software

`PROMPT.md` ships tuned for unmet *software* demand, but the engine underneath
doesn't care. To aim it somewhere else you change **two things** at the top of
`PROMPT.md` and leave the rest alone:

1. **The opening paragraph** — the "You are a demand signal researcher for the
   software industry…" sentence. This defines *who* the researcher is and *what
   counts as a signal.*
2. **The "where to look" list under `### Phase 1`** — the communities and
   search patterns. Point them at wherever your people actually gather.

Everything from `### Phase 2` down — read the whole thread, verify every
source, map what already exists, quality over count, and the whole of
`RUBRIC.md` — is domain-agnostic discipline. **Don't touch it.** That part is
what makes the output trustworthy instead of a confident guess, and it works
exactly the same whether you're hunting apps, gadgets, or novels.

The output schema (`schema.json`) also carries over unchanged; you just read a
couple of fields differently, noted per recipe. `category`, `difficulty`, and
`demand_strength` are free-form strings, so reinterpret them however fits.

Want to see the finished product before you edit anything?
[`EXAMPLE.md`](./EXAMPLE.md) is the **physical products** recipe below, already
assembled into a complete, paste-and-run prompt.

---

## Recipe: content gaps — "what should I make?"

**Hunting:** explainers, tutorials, and guides people keep asking for and can't
find. Great for creators, teachers, and docs writers.

**Replace the opening paragraph with:**
> You are a content-gap researcher. Your job is to find real, evidenced demand
> for explainers, tutorials, and guides that people are actively asking for and
> failing to find — by mining communities where learners describe what confused
> them and what they wish someone would just explain clearly.

**Where to look (swap into Phase 1):** YouTube comment sections, `r/learn*`
subreddits, Stack Overflow, course-platform reviews, and "I've read everything
and still don't get it" threads. Query patterns:
- `[topic] "is there a good tutorial" OR "wish someone would explain"`
- `site:youtube.com [topic] "still confused" OR "nobody explains"`
- `r/learn[topic] "does anyone have a guide"`

**Reading the output:** `landscape.existing_solutions` = the videos/articles
that already exist and where they fall short (too advanced, outdated,
paywalled). `difficulty` ≈ effort to produce (`quick_explainer` →
`deep_series`). `demand_strength` = how many independent people asked.

---

## Recipe: physical products — "what should I put on the shelf?"

**Hunting:** tangible products people wish existed, or wish worked differently.
*(This recipe is assembled end-to-end in [`EXAMPLE.md`](./EXAMPLE.md).)*

**Replace the opening paragraph with:**
> You are a product-gap researcher for physical goods. Your job is to find real,
> evidenced demand for physical products people wish existed or wish worked
> differently — by mining communities and reviews where real owners describe
> what they can't buy and what their current gear gets wrong.

**Where to look (swap into Phase 1):** `r/BuyItForLife`, `r/gadgets`,
`r/somethingimade`, hobby and maker forums, Kickstarter comment threads, and —
this is the gold — 1-to-3-star Amazon reviews. Query patterns:
- `[category] "wish there was one that" OR "why doesn't anyone make"`
- `[popular product] review "wish it also" OR "so close but"`
- `r/BuyItForLife [category] "can't find one that"`

**Reading the output:** `difficulty` ≈ manufacturing lift. Lean *hard* on the
RUBRIC's "already exists and works well → drop it" rule; the physical world is
crowded, and the win is a specific, named shortfall.

---

## Recipe: local business gaps — "what's missing in my town?"

**Hunting:** local services or venues a specific place keeps wishing for.

**Replace the opening paragraph with:**
> You are a local-opportunity researcher. For the city or region named in
> FOCUS, find real, evidenced demand for local services and venues residents
> wish existed — by mining where that community talks about what their area
> lacks.

**Where to look (swap into Phase 1):** the city subreddit (`r/[city]`), local
community groups, neighborhood forums, and complaint patterns in Google/Yelp
reviews for a category. Set `FOCUS` to the city. Query patterns:
- `r/[city] "why is there no" OR "does anywhere around here do"`
- `r/[city] "wish we had a"`
- `[city] [category] "nothing good" OR "have to drive to"`

**Reading the output:** `landscape` = the businesses that exist and why they
miss (hours, quality, price, distance). `demand_strength` = how often the wish
recurs. Worth a line in `builder_note` about seasonality or catchment size.

---

## Recipe: competitor intel — "what do [product]'s users secretly want?"

**Hunting:** what one specific product's users repeatedly beg for and rage
about. This one swaps *scope*, not domain — you aim the whole thing at a single
target.

**Replace the opening paragraph with:**
> You are a product-research analyst studying the user community of the product
> named in FOCUS. Find what its users repeatedly ask for and complain about —
> the recurring feature requests, dealbreakers, and "I switched away because…"
> stories — backed by real posts.

**Where to look (swap into Phase 1):** the product's subreddit, its **open**
GitHub issues, its app-store/review sections, its Discord or forum, and
"[product] alternative because…" threads. Set `FOCUS` to the product name.
Query patterns:
- `r/[product] "wish it" OR "why can't it" OR "still no"`
- `[product] github issue [keyword]`
- `[product] review "dealbreaker" OR "switched to"`

**Reading the output:** each signal is a feature-request or complaint cluster;
`landscape` = how competitors handle that same thing. Keep the source rules
honest — a vendor's own "Show HN"/announcement is *supply*, not demand.

---

## Recipe: books that don't exist — "what should someone write?"

**Hunting:** books, genres, and stories readers keep wishing someone would
write.

**Replace the opening paragraph with:**
> You are a literary-gap researcher. Find real, evidenced reader demand for
> books that don't exist yet — by mining where readers describe the exact story
> they want and can't find.

**Where to look (swap into Phase 1):** `r/suggestmeabook`, `r/books`,
genre subs (`r/Fantasy`, `r/scifi`, …), Goodreads and StoryGraph discussions.
Query patterns:
- `r/suggestmeabook "does this book exist" OR "I wish there was a book"`
- `[genre] "why hasn't anyone written" OR "closest thing to"`

**Reading the output:** `landscape.existing_solutions` = the closest existing
books and why they miss. `builder_note` becomes the craft/angle note.

---

## Roll your own

The template — fill in the four blanks:

> You are a **[X]**-gap researcher. Find real, evidenced demand for **[the
> thing]** that people actively want and can't adequately find, by mining
> **[where these people gather]** for **[the kind of statement that proves
> it]**.

Then give Phase 1 five-to-ten communities and three-to-five query patterns for
your space. Leave everything below `## Method`'s Phase 1 alone.

Two rules that keep any version honest, straight from `RUBRIC.md`:

- **Evidence, not vibes.** One real person saying it, on a page you opened, is
  worth more than a hundred you assumed. If you can't verify it, drop it.
- **The gap has to be specific.** "It's a crowded space" is useless. "Everyone
  in this space assumes you already have X, and these people don't" is a signal.
