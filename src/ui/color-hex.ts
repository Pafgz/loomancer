/** Normalize user-entered hex to `#rrggbb` (lowercase), or null if invalid. */
export function normalizeHex(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const short = /^#([0-9a-fA-F]{3})$/.exec(withHash);
  if (short?.[1]) {
    const [r, g, b] = short[1];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  const long = /^#([0-9a-fA-F]{6})$/.exec(withHash);
  return long ? withHash.toLowerCase() : null;
}
