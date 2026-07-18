/**
 * Sanitize a URL from untrusted signal data before using it as an `href`.
 *
 * Signal JSON is sourced from public internet communities and dropped in by
 * users, so a source/landscape `url` could be `javascript:...`, `data:...`,
 * etc. Astro escapes attribute *values* but does not restrict the URL scheme,
 * so an unvalidated href would execute on click. This allows only http(s) and
 * mailto (plus scheme-relative/relative links) and neutralizes anything else.
 *
 * Before the scheme check we drop every "C0 control or space" character (code
 * point <= 0x20) because the HTML tokenizer and the WHATWG URL parser ignore
 * them inside a scheme: e.g. a tab-laced "java<TAB>script:" and a leading
 * control byte both parse as "javascript:" once the browser removes those
 * bytes. The cleaned string is what we return, so no such byte can survive to
 * re-expose a blocked scheme.
 */
export function safeUrl(u: string | null | undefined): string {
  if (!u) return '#';
  let cleaned = '';
  for (const ch of u) {
    if (ch.charCodeAt(0) > 0x20) cleaned += ch;
  }
  if (!cleaned) return '#';
  // Explicitly allowed absolute schemes.
  if (/^(?:https?:|mailto:)/i.test(cleaned)) return cleaned;
  // No scheme at all -> relative or scheme-relative link, safe to keep.
  if (!/^[a-z0-9.+-]+:/i.test(cleaned)) return cleaned;
  // Any other scheme (javascript:, data:, vbscript:, ...) is dropped.
  return '#';
}
