export const AI_LIMITS = {
  FEEDBACK_PROMPT_MAX: 2_000,
  CHAT_MESSAGE_MAX: 2_000,
  PARSE_PLAN_TEXT_MAX: 20_000,
  IMAGE_BASE64_MAX: 10_000_000,
} as const;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

// Narrow on purpose: ordinary coaching talk such as "ignore my previous instructions about volume" must pass.
const INJECTION_PATTERNS: RegExp[] = [
  /\b(?:ignore|disregard|forget|override)\s+(?:all\s+|any\s+|every\s+|the\s+|your\s+)?(?:previous|prior|above|earlier|preceding|system|developer)\s+(?:instructions?|prompts?|rules?|directions?)\b/i,
  /\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+)?your\s+(?:instructions?|rules?|guidelines?|programming)\b/i,
  /\b(?:reveal|show|print|repeat|output|leak|tell\s+me)\b[^.\n]{0,30}\b(?:system|developer|hidden)\s+(?:prompt|instructions?|message)\b/i,
  /<\|?\s*(?:im_start|im_end|system|endoftext)\s*\|?>|\[\/?INST\]|<<\/?SYS>>/i,
];

/** Cleans text before it goes anywhere near a prompt. */
export function sanitizeUserText(input: string): string {
  return (
    input
      .normalize('NFKC') // fold look-alike characters into plain ones
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '') // zero-width characters
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // control characters (keeps newline and tab)
      .replace(/<\/?\s*(?:athlete_message|plan_text)\s*>/gi, '') // our own wrapper tags
      .trim()
  );
}

export function matchesInjectionPattern(text: string): boolean {
  const flat = text.replace(/\s+/g, ' ');
  return INJECTION_PATTERNS.some((pattern) => pattern.test(flat));
}
