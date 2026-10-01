/** Build a single-recipient URI, never mail headers supplied by an address. */
export function studentMailto(email: string | null | undefined): string | null {
  if (!email || /[\r\n]/.test(email)) return null;
  const address = email.trim();
  if (!/^[^\s@<>,;]+@[^\s@<>,;]+$/u.test(address)) return null;
  return `mailto:${encodeURIComponent(address).replace('%40', '@')}`;
}
