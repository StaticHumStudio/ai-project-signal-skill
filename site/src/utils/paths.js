/**
 * Internal link helpers that honor the `base` from astro.config.mjs.
 *
 * Every internal href in the site goes through `withBase`, so changing `base`
 * (including to '/') moves the whole site without touching any page source.
 */

/** Join a base path with an internal route, collapsing the slashes between them. */
export function joinBase(base, pathname) {
  const trimmedBase = String(base ?? '/').replace(/\/+$/, '');
  const trimmedPath = String(pathname ?? '').replace(/^\/+/, '');
  return trimmedPath ? `${trimmedBase}/${trimmedPath}` : `${trimmedBase}/`;
}

// Astro substitutes the configured `base` here at build time. Node's test
// runner has no import.meta.env, so fall back to serving from the root.
const BASE = typeof import.meta.env === 'undefined' ? '/' : import.meta.env.BASE_URL;

/** Root-relative URL for an internal route, e.g. withBase('/rss.xml'). */
export function withBase(pathname) {
  return joinBase(BASE, pathname);
}
