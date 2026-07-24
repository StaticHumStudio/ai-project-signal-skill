function hash32(value) {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function normalizeRouteSource(value) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase();
}

export function slugifyRoute(value, fallbackPrefix = 'item') {
  const source = normalizeRouteSource(value);
  const readable = source
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  const capped = Array.from(readable)
    .slice(0, 60)
    .join('')
    .replace(/-+$/g, '');

  return capped || `${fallbackPrefix}-${hash32(source)}`;
}

export function stableRouteSlug(value, fallbackPrefix = 'item') {
  const source = normalizeRouteSource(value);
  const hash = hash32(source);
  const base = slugifyRoute(source, fallbackPrefix);
  return base === `${fallbackPrefix}-${hash}` ? base : `${base}-${hash}`;
}

export function claimUniqueSlug(value, counts, fallbackPrefix = 'item') {
  const base = slugifyRoute(value, fallbackPrefix);
  if (!counts.has(base)) {
    counts.set(base, 1);
    return base;
  }

  let suffix = (counts.get(base) ?? 1) + 1;
  let candidate = `${base}-${suffix}`;
  while (counts.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  counts.set(base, suffix);
  counts.set(candidate, 1);
  return candidate;
}
