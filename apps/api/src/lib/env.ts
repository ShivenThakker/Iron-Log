import 'dotenv/config';

const problems: string[] = [];

// Values that must never be used as a secret, even on purpose.
const KNOWN_PLACEHOLDER_SUBSTRINGS = [
  'dev_secret',
  'dev-secret',
  'changeme',
  'change_me',
  'change-me',
  'your_secret',
  'your-secret',
  'your_jwt_secret',
  'your_refresh_secret',
  'replace_me',
  'placeholder',
];

const KNOWN_WEAK_EXACT_VALUES = [
  'secret',
  'password',
  'example',
  '123456',
  '12345678',
  'admin',
];

function readRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    problems.push(`${name} is missing or empty.`);
    return '';
  }
  return value;
}

function readSecret(name: string): string {
  const value = readRequired(name);
  if (!value) return '';
  if (value.length < 32) {
    problems.push(`${name} is too short (${value.length} characters). Use at least 32.`);
  }
  const lower = value.toLowerCase();
  if (
    KNOWN_PLACEHOLDER_SUBSTRINGS.some((weak) => lower.includes(weak)) ||
    KNOWN_WEAK_EXACT_VALUES.includes(lower)
  ) {
    problems.push(`${name} looks like a placeholder. Generate a real random secret.`);
  }
  return value;
}

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const PORT = Number(process.env.PORT) || 3000;

const JWT_SECRET = readSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = readSecret('JWT_REFRESH_SECRET');
if (JWT_SECRET && JWT_SECRET === JWT_REFRESH_SECRET) {
  problems.push('JWT_SECRET and JWT_REFRESH_SECRET must be different values.');
}

// The cron route must fail closed: required in production, optional elsewhere.
const CRON_SECRET =
  NODE_ENV === 'production'
    ? readSecret('CRON_SECRET')
    : (process.env.CRON_SECRET?.trim() ?? '');

// Gemini settings
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim() ?? '';
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() ?? '';
if (GEMINI_API_KEY && !GEMINI_MODEL) {
  problems.push('GEMINI_MODEL is required when GEMINI_API_KEY is set. Copy an exact ID from https://ai.google.dev/gemini-api/docs/models.');
}

if (problems.length > 0) {
  // console.error on purpose: the Pino logger may not be ready this early.
  console.error(
    [
      '',
      'Server cannot start because its configuration is invalid:',
      ...problems.map((p) => `  - ${p}`),
      '',
      'Fix your environment variables (see apps/api/.env.example) and start again.',
      '',
    ].join('\n')
  );
  throw new Error('Invalid environment configuration');
}

export const env = {
  NODE_ENV,
  PORT,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  CRON_SECRET,
  GEMINI_API_KEY,
  GEMINI_MODEL,
} as const;
