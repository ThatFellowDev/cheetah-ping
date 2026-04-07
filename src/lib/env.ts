const required = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
] as const;

const optional = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_STARTER_PRICE_ID',
  'STRIPE_PRO_PRICE_ID',
  'STRIPE_ULTRA_PRICE_ID',
  'RESEND_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'GROQ_API_KEY',
  'NEXT_PUBLIC_APP_NAME',
] as const;

type Env = Record<(typeof required)[number], string> &
  Partial<Record<(typeof optional)[number], string>>;

function validateEnv(): Env {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  return Object.fromEntries(
    [...required, ...optional].map((key) => [key, process.env[key]])
  ) as Env;
}

export const env = validateEnv();
