import crypto from 'crypto';

export const AI_LIMITS = {
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

// Patterns indicating prompt injection, jailbreaking, or privilege escalation
const INJECTION_PATTERNS: RegExp[] = [
  /\b(?:ignore|disregard|forget|override|bypass)\s+(?:all\s+|any\s+|every\s+|the\s+|your\s+)?(?:previous|prior|above|earlier|preceding|system|developer|safety)\s+(?:instructions?|prompts?|rules?|directions?|guidelines?|filters?)\b/i,
  /\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+)?your\s+(?:instructions?|rules?|guidelines?|programming)\b/i,
  /\b(?:reveal|show|print|repeat|output|leak|tell\s+me|dump|extract)\b[^.\n]{0,35}\b(?:system|developer|hidden|internal|original|secret|confidential)\s+(?:prompt|instructions?|messages?|rules?|directives?|canary|tokens?)\b/i,
  /\bwhat\s+(?:are|were)\s+your\s+(?:initial|original|core|system|developer|hidden)\s+(?:instructions?|prompts?|rules?)\b/i,
  /\b(?:repeat|print|dump)\s+(?:the\s+)?(?:text|words?|everything)\s+above\b/i,
  /\b(?:grant|give|assign|elevate|escalate)\s+(?:me\s+|user\s+)?(?:to\s+)?(?:admin|administrator|root|sudo|superuser|sysadmin|staff)(?:\s+(?:privileges?|rights?|access|role|permissions?))?\b/i,
  /\b(?:act\s+as|simulate|pretend\s+to\s+be|switch\s+to)\s+(?:an?\s+)?(?:admin|root|developer|unrestricted|jailbroken|DAN)\b/i,
  /\b(?:enable|activate|enter|switch\s+to\s+)?(?:developer|debug|god|maintenance|recovery|sudo)\s+mode\b/i,
  /\bDAN\s+(?:mode|jailbreak|protocol)\b/i,
  /<\/?\s*(?:athlete_message|plan_text|verified_context|context|system_context|security_directive|system|instruction|developer)\s*>/i,
  /<\|?\s*(?:im_start|im_end|system|endoftext)\s*\|?>|\[\/?(?:INST|SYS|SYSTEM|DEVELOPER|ADMIN)\]/i,
  /!\[.*?\]\(https?:\/\/[^\s)]+\)/i,
  /\b(?:curl|fetch|wget|axios|webhook)\b[^.\n]{0,30}\b(?:exfil|leak|token|cookie|secret|dump)\b/i,
  /\b(?:decode|execute|run)\s+(?:this\s+)?(?:base64|hex|rot13|encoded)\s+(?:string|payload|code|instruction)\b/i,
];

/** Cleans text before it goes anywhere near a prompt. */
export function sanitizeUserText(input: string): string {
  return (
    input
      .normalize('NFKC') // fold look-alike characters into plain ones
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '') // zero-width characters
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // control characters (keeps newline and tab)
      .replace(/<\/?\s*(?:athlete_message|plan_text|verified_context|context|system_context|security_directive|system|instruction|developer)\s*>/gi, '') // wrapper tags
      .trim()
  );
}

export function matchesInjectionPattern(text: string): boolean {
  const flat = text.replace(/\s+/g, ' ');
  return INJECTION_PATTERNS.some((pattern) => pattern.test(flat));
}

/** Generates a high-entropy secret canary token for LLM tripwire defense */
export function generateCanaryToken(): string {
  return `iron_canary_${crypto.randomBytes(12).toString('hex')}`;
}

/** Detects if a canary token or its unique identifier leaked in the output */
export function detectCanaryLeak(output: string, canary: string): boolean {
  if (!output || !canary) return false;
  if (output.includes(canary)) return true;
  const hexPart = canary.replace('iron_canary_', '');
  if (hexPart && hexPart.length >= 12 && output.toLowerCase().includes(hexPart.toLowerCase())) {
    return true;
  }
  return false;
}

export interface OutputSafetyResult {
  safe: boolean;
  reason?: 'CANARY_LEAK' | 'SECRET_LEAK' | 'PRIVILEGE_ESCALATION' | 'EXFILTRATION_IMAGE';
  sanitizedText: string;
}

const SENSITIVE_PATTERNS = [
  /\b(?:DATABASE_URL|JWT_SECRET|GEMINI_API_KEY|DIRECT_URL|UPSTASH_REDIS_REST_TOKEN)\b/i,
  /\b(?:postgres|postgresql|mysql|mongodb|redis):\/\/[^\s]+/i,
  /\beyJ[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{10,}\b/, // JWT signature
];

const PRIVILEGE_CONFIRMATION_PATTERNS = [
  /\b(?:you\s+now\s+have|granted)\s+(?:admin|administrator|root|sudo|superuser)\s+(?:access|rights?|privileges?|role)\b/i,
  /\badmin\s+mode\s+(?:activated|enabled)\b/i,
];

/** Scans and sanitizes LLM output before it is returned to the user */
export function scanOutputForSafety(output: string, canary?: string): OutputSafetyResult {
  if (!output) {
    return { safe: true, sanitizedText: '' };
  }

  // 1. Check for Canary Token leak (system prompt exfiltration tripwire)
  if (canary && detectCanaryLeak(output, canary)) {
    return {
      safe: false,
      reason: 'CANARY_LEAK',
      sanitizedText:
        'I am your IronLog fitness coach. I can help you with workouts and nutrition, but cannot disclose internal system instructions or security directives.',
    };
  }

  // 2. Check for Leaked Secrets/Credentials
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(output)) {
      return {
        safe: false,
        reason: 'SECRET_LEAK',
        sanitizedText:
          'I am your IronLog fitness coach. This request cannot be completed as the output contained restricted system data.',
      };
    }
  }

  // 3. Check for fake privilege escalation confirmations
  for (const pattern of PRIVILEGE_CONFIRMATION_PATTERNS) {
    if (pattern.test(output)) {
      return {
        safe: false,
        reason: 'PRIVILEGE_ESCALATION',
        sanitizedText:
          'I am a fitness coach and cannot grant administrative access or modify system permissions.',
      };
    }
  }

  // 4. Strip any Markdown image exfiltration links
  const sanitizedText = output.replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/gi, '[Image omitted for security]');

  return {
    safe: true,
    sanitizedText,
  };
}
