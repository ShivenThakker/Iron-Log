const MAX_AI_JSON_CHARS = 200_000; // sanity cap; real plans are a few thousand characters

export type SafeParseResult =
  | { ok: true; data: unknown }
  | { ok: false; reason: 'empty' | 'too_large' | 'invalid_json' };

/** Removes a markdown code fence and any chatter before or after the outer { ... }. */
export function extractJsonText(raw: string): string {
  let text = raw.trim();
  const fenced = /^`{3}(?:json)?\s*([\s\S]*?)\s*`{3}$/i.exec(text);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) text = text.slice(start, end + 1);
  return text;
}

export function safeParseJson(raw: string): SafeParseResult {
  if (!raw || !raw.trim()) return { ok: false, reason: 'empty' };
  if (raw.length > MAX_AI_JSON_CHARS) return { ok: false, reason: 'too_large' };
  try {
    return { ok: true, data: JSON.parse(extractJsonText(raw)) };
  } catch {
    return { ok: false, reason: 'invalid_json' };
  }
}
