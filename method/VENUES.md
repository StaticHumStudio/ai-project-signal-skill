# Venues: a worked example of step 3

[`CHANNELS.md`](./CHANNELS.md) step 3 says to open every venue's rules page and
quote, verbatim, what it says about self-promotion. This file is that step done
by hand, so you can see the shape of a good entry before you ask an assistant to
produce one.

> **Every quote below was read off the live page on 2026-08-03.** Rules pages
> change, and this file does not update itself. Treat it as a demonstration of
> the method, never as current fact. Before you act on any entry, open the URL
> and read it yourself. If the date above is more than a couple of months old by
> the time you're reading this, assume at least one of these is now wrong.

The venues here skew toward free, open source, and privacy-adjacent software,
because that is the corner where the "open source carve-out" pattern is
easiest to demonstrate. The method itself has no such bias. Run it on your own
audience and you'll get a different list.

---

## One-time placement checklist

Grind these once per project. Ordered by effort ascending, so you can stop
wherever your afternoon ends.

### AlternativeTo

**Verdict: open door, with a sharp line right next to it.**

- **Rules:** <https://alternativeto.net/faq/> (read 2026-08-03)
- **Verbatim:** *"Using user profiles to advertise products or software is not
  allowed. Accounts used for this purpose will be blocked for spam."*
- **The door:** the FAQ tells developers to create an account and email
  `support@alternativeto.net` with their username, the app they want admin
  rights for, and proof they own it. Adding software is free and open to
  anyone.
- **The line, and it's a fine one:** listing your software is expected. Using
  your *profile* as an ad is a ban. The FAQ also warns that incentivizing
  upvotes with discounts or gifts, or creating fake accounts to like or review
  your own product, can get you dropped from the front page or removed.
- **Effort:** 0.5 to 1 hour. **First result:** immediate listing, organic
  traffic builds over months.
- **Pros:** genuinely open to makers, no gatekeeper, ranks well in search for
  "alternative to X" queries, which is high-intent traffic.
- **Cons:** a listing alone does almost nothing until you have some likes, and
  the honest ways to get those are slow. Easy to talk yourself into the
  dishonest ways, which is exactly what the quoted rule is watching for.

> **Note on this entry:** AlternativeTo's FAQ is rendered client side, so the
> quote above came from a rendering fetch rather than raw HTML, and only the
> sentences reproduced identically across two separate reads are quoted. The
> rest is described, not quoted. That distinction is the method working.

### Privacy Guides

**Verdict: open door, and an unusually explicit one.**

- **Rules:** <https://www.privacyguides.org/en/about/criteria/> (read 2026-08-03)
- **Verbatim, from the Developer Self-Submissions section:**
  - *"Must undergo our self-submission process as a way to engage with our
    community, address any potential concerns, and elicit any feedback that can
    help improve your project."*
  - *"Must disclose affiliation, i.e. your position within the project being
    submitted."*
  - *"Must have a security white paper if it is a project that involves the
    handling of sensitive information like a messenger, password manager,
    encrypted cloud storage, etc."*
- **Hard gates:** they also require you to state your project's exact threat
  model, and to explain what new problem it solves and why anyone should use it
  over the alternatives. General criteria include active development,
  documentation, usability, and a preference for open source and cross-platform.
- **Effort:** 2 to 4 hours, most of it writing the submission honestly.
  **First result:** weeks, and rejection is a normal outcome.
- **Pros:** this is the pattern worth internalizing. A community that would
  eat a marketer alive has written down a formal process for makers, and the
  price of entry is disclosure rather than silence. Being listed here carries
  real weight with an audience that trusts almost nothing.
- **Cons:** the bar is high and the review is adversarial by design. A security
  white paper is not a weekend's work. Submitting something half-baked burns
  the one impression you get.

### awesome-selfhosted

**Verdict: conditional, gated on project maturity rather than on who submits.**

- **Rules:**
  <https://github.com/awesome-selfhosted/awesome-selfhosted-data/blob/master/CONTRIBUTING.md>
  and the pull request template in that repo (read 2026-08-03)
- **Hard gates, verbatim from the PR checklist:**
  - *"Any software project you are adding was first released more than 4 months
    ago."*
  - *"Any software project you are adding to the list is actively maintained."*
  - *"Any software project you are adding has working installation
    instructions."*
  - *"Submit one item per pull request. This eases reviewing and speeds up
    inclusion."*
- **Verbatim on timing:** *"You understand that your Pull Request will be
  merged at least ~1 week after approval, depending on maintainers time."*
- **Removal criteria to know about:** the contributing guide states that
  software with no development activity for 6 to 12 months, non-working
  software, unmaintained software without an active community, or *"software
  with persistent, serious security issues will be removed from the list."*
  Getting listed is not permanent.
- **Watch out:** PRs go to `awesome-selfhosted-data`, not the main
  `awesome-selfhosted` repo. The main repo's PR template says only: *"Please do
  not submit pull requests in this repository."*
- **Effort:** 1 to 2 hours. **First result:** a week after approval, and
  approval itself can take a while.
- **Pros:** no self-promotion rule at all, because the gate is the project's
  maturity rather than your relationship to it. Nothing here penalizes you for
  being the author. Downstream reach is large, since a lot of other lists and
  sites mirror it.
- **Cons:** the 4-month age rule means a fresh launch is simply ineligible, and
  people burn a submission finding that out. Merges are slow and volunteer-paced.

### F-Droid

**Verdict: open door for FLOSS Android apps, closed hard for everything else.**

- **Rules:** <https://f-droid.org/en/docs/Inclusion_Policy/> (read 2026-08-03)
- **Hard gates, verbatim:**
  - *"All applications in the repository must be Free, Libre and Open Source
    Software (FLOSS)"*, with license questions deferred to the DFSG, FSF, GNU,
    and OSI standards.
  - *"The implementation of proprietary tracking or advertising libraries and
    analytics tools such as Google Play Services and Firebase and Crashlytics
    and proprietary ad/tracking SDKs are strictly forbidden in all
    applications."*
  - *"Upstream developers must implement either a FLOSS alternative or a build
    flavour that does not require these dependencies when such features become
    necessary."*
- **Also worth knowing:** F-Droid builds from source to verify the binary
  matches, so the build has to actually work in their toolchain. Anti-Features
  are warning labels that flag concerns *"without necessarily disqualifying
  applications from inclusion"*, so a flagged app can still be listed. Apps that
  fail to rebuild or carry undisclosed anti-features get rejected, and
  developers can ask for re-review after fixing.
- **Effort:** 2 to 8 hours, almost entirely in making the build reproducible.
  **First result:** weeks to months.
- **Pros:** the audience is precisely the people who left the Play Store on
  purpose, which is a hard group to reach any other way. Nothing about the
  policy cares that you are the developer. Once you're in, updates flow
  automatically.
- **Cons:** the build requirements are the real work, and Firebase or
  Crashlytics in your dependency tree is a full stop, not a negotiation. If your
  app is closed source this door does not exist.

### awesome-* lists generally (the sindresorhus rules)

**Verdict: conditional, with an explicit participation tax.**

- **Rules:**
  <https://github.com/sindresorhus/awesome/blob/main/pull_request_template.md>
  (read 2026-08-03)
- **Verbatim, and this is the sentence that matters most:** *"It should be an
  objective description and not a tagline or marketing blurb."*
- **Also verbatim:**
  - *"Fully AI-generated pull requests are not accepted."*
  - *"If you have not put in considerable effort into your list, your pull
    request will be immediately closed."*
- **The participation tax:** the template also asks submitters to review other
  open pull requests. You pay in review work before you take.
- **Effort:** 0.5 to 2 hours per list. **First result:** days to months,
  entirely dependent on the individual maintainer.
- **Pros:** these lists are everywhere, and most topic-specific ones are far
  more permissive than the meta-list. Being listed is durable and compounding.
- **Cons:** the "objective description, not a tagline" rule kills the instinct
  to write a pitch, and a pitchy entry gets closed without discussion. Every
  list has its own maintainer with their own mood. This one is the meta-list
  for submitting *lists*, so check the specific list's own rules too.

---

## Standing watchlist

Do not schedule these. Consult them when the trigger fires.

### Hacker News

**Verdict: conditional, with the ratio stated in prose rather than a number.**

- **Rules:** <https://news.ycombinator.com/newsguidelines.html> (read 2026-08-03)
- **Verbatim:** *"Please don't use HN primarily for promotion. It's ok to post
  your own stuff part of the time, but the primary use of the site should be for
  curiosity."*
- **Verbatim, and this one is a bright line:** *"Don't solicit upvotes,
  comments, or submissions."*
- **Trigger:** when you ship something a stranger could form an opinion about
  in thirty seconds. A Show HN wants a working thing people can try, not an
  announcement.
- **Effort:** 1 hour to write it properly, plus a full day actually present in
  the thread. If you post and leave, don't post.
- **The specific thing that bans you:** asking anyone to go upvote it. Not a
  gray area, not a norm, written down. This includes the group chat.
- **Pros:** the single largest concentration of the technical audience, and a
  front page result changes a project's trajectory in a way nothing else on
  this list does.
- **Cons:** overwhelmingly luck and timing. Comments can be brutal and are
  public forever. "Part of the time" is deliberately unquantified, so you are
  judged against a standard nobody will state precisely.

### Lobsters

**Verdict: conditional, with an actual number, which makes it the easiest
venue on this list to comply with.**

- **Rules:** <https://lobste.rs/about> (read 2026-08-03)
- **Verbatim:** *"It's great to have authors participate in the community, but
  not to exploit it as a write-only tool for product announcements or driving
  traffic to their work. As a rule of thumb, self-promo should be less than a
  quarter of one's stories and comments."*
- **Trigger:** same as HN, but the ratio makes it a running budget rather than
  a judgment call. Three unrelated contributions buy you one about your own
  work.
- **Effort:** 20 minutes per post, against a long-running background cost of
  actually being a member of the community.
- **The specific thing that bans you:** treating it as write-only. The rule
  names that failure mode directly, so a posting history that's all yours is
  visibly against the stated rule.
- **Pros:** a stated fraction is a gift. You never have to guess whether you've
  overstepped, you can count. Smaller and higher signal than HN.
- **Cons:** invite-only, so you cannot act on this today unless you're already
  in. The 25% budget is meaningless if you have no other posts, which means the
  cost is months of ordinary participation before the first self-post is even
  legal.

### Privacy Guides forum

**Verdict: unwritten. Treat as the highest risk on this page.**

- **Rules:** <https://discuss.privacyguides.net/guidelines> (read 2026-08-03)
- **Finding:** the guidelines cover discussion quality, civility, AI-generated
  content, and forum maintenance. **They say nothing about self-promotion,
  advertising, or commercial posting, in either direction.**
- **Why this is the dangerous case, not the safe one:** no written rule does
  not mean no rule. It means the rule lives in the community's habits and gets
  enforced on a moderator's instinct, with no page you can point at when it
  goes wrong. Compare this to Lobsters, where you can count to 25% and know
  where you stand.
- **What to do instead:** the same organization publishes a formal
  self-submission process on its criteria page (see the placement section
  above). When a venue is silent on promotion but its parent project has a
  written front door, use the front door. That is the answer the silence is
  pointing at.
- **Trigger:** genuinely, none. Read thirty days of the forum before posting
  anything about your own project, and prefer the criteria-page process.

---

## What could not be verified

Naming the gaps is part of the output. A short verified list plus a stated gap
beats a long list with guesses in it.

- **Reddit.** Not reachable. Its `robots.txt` is `Disallow: /` for every agent,
  the unauthenticated `.json` endpoint returns 403, and some harnesses refuse
  the domain outright (checked 2026-08-02, see the repo README). Subreddit
  rules therefore could not be read, and none are quoted here. This is a real
  hole, because per-subreddit self-promotion rules are strict, wildly
  inconsistent between subreddits, and the most common place people get banned.
  **Read the sidebar yourself before posting anywhere on Reddit.** Do not let an
  assistant tell you what a subreddit's rules are from memory.
- **Product Hunt.** The guidelines page was not reachable at any of the URLs
  tried on 2026-08-03. No quote, so no entry. Unverified is not a
  recommendation, it is a task.
- **Newsletters generally.** Searching for open source newsletters that accept
  submissions returned mostly listicles rather than submission pages. This class
  is probably worth real effort for someone with a specific niche, and it did
  not survive a generic sweep. Point the method at your actual audience and it
  will do better than this did.
