/**
 * Where to send the reader after sign-in. Only a same-origin path is ever
 * accepted: it must start with a single `/` (so `//evil.example` and
 * `/\evil.example`, which browsers read as protocol-relative, are out),
 * carry no whitespace or control characters, and stay short. Anything else
 * falls back to the home page. No `server-only` import: pure and reused by
 * the client when it builds the sign-in link.
 */
const MAX_LENGTH = 512;

/** Whitespace, C0 controls and DEL have no place in a path. */
function hasForbiddenCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f || /\s/.test(character)) return true;
  }
  return false;
}

export function sanitizeReturnTo(raw: string | null | undefined, fallback = '/'): string {
  if (typeof raw !== 'string') return fallback;
  if (raw.length === 0 || raw.length > MAX_LENGTH) return fallback;
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  if (hasForbiddenCharacter(raw)) return fallback;
  return raw;
}
