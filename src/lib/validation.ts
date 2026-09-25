export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

export function normalizeSingleLine(value: unknown, max: number) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export function hasUnsafeControlChars(value: string) {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
}
