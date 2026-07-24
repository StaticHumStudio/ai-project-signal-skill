function hash32(value) {
  let hash = 0x811c9dc5;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function slugifyRoute(value, fallbackPrefix = 'item') {
  const source = String(value ?? '').normalize('NFKC').trim().toLowerCase();
  const readable = source
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  const capped = Array.from(readable)
    .slice(0, 60)
    .join('')
    .replace(/-+$/g, '');

  return capped || `${fallbackPrefix}-${hash32(source)}`;
}

export function claimUniqueSlug(value, counts, fallbackPrefix = 'item') {
  const base = slugifyRoute(value, fallbackPrefix);
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);
  return count === 0 ? base : `${base}-${count + 1}`;
}
