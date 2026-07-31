/**
 * Every domain-facing and brand-facing string on the site lives here.
 *
 * The research method retargets: it works the same whether you point it at
 * software, books, physical products, videos, or the gap in your own town
 * (see method/RECIPES.md). The site should retarget just as easily, so nothing
 * below is hardcoded in a component. Edit this file, not the templates.
 *
 * The shipped copy is deliberately target-neutral. If your instance only ever
 * hunts one thing, narrow it: swap "make" for "code", "write", or "sell" and
 * the whole site follows.
 */
export const siteConfig = {
  /** Brand lockup, credit line, and the JSON-LD publisher identity. */
  brand: {
    /**
     * First word of the nav lockup, and the site name in structured data.
     * Store it in prose case: the nav uppercases it in CSS.
     */
    name: 'Signal',
    /**
     * Second word of the nav lockup, rendered as plain text. Set `ownerUrl` to
     * a URL if you want it linked, or `owner` to null to drop it entirely.
     */
    owner: 'Static Hum',
    ownerUrl: null,
    /** Footer credit. Ordinary attribution, and yours to replace or remove. */
    credit: 'Signal // open-source example by Static Hum Studio',
    creditLabel: 'statichum.studio',
    creditUrl: 'https://statichum.studio',
    /** JSON-LD publisher and author name. Change this before you deploy. */
    publisher: 'Static Hum Studio',
  },

  /** Page <title> and meta description for the landing page. */
  meta: {
    title: 'Signal Demo | Evidence-backed Demand Research',
    description:
      'An open source example interface for demand research. The bundled feed contains synthetic demo data you can replace with your own findings.',
  },

  /** The top section. Two lines, question then answer. */
  hero: {
    overline: 'open source demand research',
    headline: 'What should I make?',
    subhead: 'Ask the people already asking.',
    blurb:
      'Software, a book, a product, a video, a shop on your corner. Same method. Real demand lives in threads, not in listicles.',
    /** Keep some version of this while the bundled data is synthetic. */
    note: 'The bundled signal is synthetic, clearly labeled, and ready to replace with your own research.',
    stats: {
      signals: 'demo signals',
      batches: 'example batches',
      sources: 'source types shown',
    },
  },

  /** RSS channel identity. Feed readers cache these, so set them before you ship. */
  rss: {
    title: 'Signal Demo: Static Hum Studio',
    description:
      'Open source example feed for evidence-backed demand research. Bundled entries are synthetic demo data.',
    /** Title on the <link rel="alternate"> in the document head. */
    linkTitle: 'Signal RSS',
  },

  /** Structured data. Keywords and FAQ entries feed schema.org markup. */
  seo: {
    keywords: [
      'what should I make',
      'what should I build',
      'demand research',
      'evidence-backed project ideas',
      'unmet demand',
    ],
    faq: [
      {
        question: 'What should I make next?',
        answer:
          'Start with a concrete pain point people are actively discussing, verify the evidence, and identify where existing options fall short. This example site demonstrates how to present that research.',
      },
      {
        question: 'How do I find projects people actually want?',
        answer:
          'Look for repeated requests across communities, then choose the ones where demand is clear but current solutions are weak. Signal tracks both demand evidence and competition for each opportunity.',
      },
    ],
  },

  /** Body copy. Each `body` is an array of paragraphs. */
  sections: {
    /**
     * Heading only. These two say "example" because the bundled data is
     * synthetic; once you publish your own research, "latest" is the honest
     * word.
     */
    signals: { heading: 'example signals' },
    batches: { heading: 'example batches' },
    searchIntent: {
      heading: 'if you’re searching “what should I make?”',
      body: [
        'Most "what should I build" lists are random. Signal is different. Every entry starts from a real request, complaint, or workflow pain point pulled from public communities.',
        'Browse by category, pick a signal with repeated demand, then build the smallest useful version first.',
      ],
    },
    about: {
      heading: 'about signal',
      body: [
        'Signal is an open source method and example interface for demand research. The single signal bundled with this repository is synthetic. It exists to demonstrate the schema, routes, cards, filters, and feed without republishing anyone’s words.',
        'Replace the example JSON with research you have verified yourself. Each signal can include source evidence, competitive landscape analysis, and an opinionated builder note.',
        'Built for anyone who wants evidence behind the next thing they make. The method retargets, so point it at software, books, physical products, videos, or whatever your town is missing.',
      ],
    },
    process: {
      heading: 'how signals are sourced',
      steps: [
        {
          number: '01',
          title: 'source',
          body: 'Search relevant communities for people describing the thing they wish existed, then open each source and read the full discussion.',
        },
        {
          number: '02',
          title: 'filter',
          body: 'Remove noise, duplicates, and vague wishes. Keep signals with specific, actionable demand and evidence of multiple people wanting the same thing.',
        },
        {
          number: '03',
          title: 'analyze',
          body: 'Map the competitive landscape for each signal. Identify existing options and document exactly where they fall short.',
        },
        {
          number: '04',
          title: 'publish',
          body: 'Package each signal with builder notes, difficulty assessment, and demand strength rating. Ship only what clears the bar. Never pad a batch to hit a number.',
        },
      ],
    },
  },
};
