/**
 * Sanitize a URL from untrusted signal data before using it as an `href`.
 *
 * Signal JSON is sourced from public internet communities and dropped in by
 * users, so a source/landscape `url` could be `javascript:...`, `data:...`,
 * etc. Astro escapes attribute *values* but does not restrict the URL scheme,
 * so an unvalidated href would execute on click. This allows only http(s) and
 * mailto (plus scheme-relative/relative links) and neutralizes anything else.
 *
 * Whitespace is stripped before the scheme check because browsers ignore
 * tabs/newlines inside a scheme (e.g. "java\tscript:" is treated as
 * "javascript:").
 */
export function safeUrl(u: string | null | undefined): string {
  if (!u) return '#';
  const cleaned = u.replace(/\s+/g, '');
  // Explicitly allowed absolute schemes.
  if (/^(?:https?:|mailto:)/i.test(cleaned)) return u.trim();
  // No scheme at all -> relative or scheme-relative link, safe to keep.
  if (!/^[a-z0-9.+-]+:/i.test(cleaned)) return u.trim();
  // Any other scheme (javascript:, data:, vbscript:, ...) is dropped.
  return '#';
}
