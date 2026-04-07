import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export function getPriceId(plan: string): string | null {
  switch (plan) {
    case 'starter':
      return process.env.STRIPE_STARTER_PRICE_ID || null;
    case 'pro':
      return process.env.STRIPE_PRO_PRICE_ID || null;
    case 'ultra':
      return process.env.STRIPE_ULTRA_PRICE_ID || null;
    default:
      return null;
  }
}

export function getPlanFromPriceId(priceId: string): string {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  if (priceId === process.env.STRIPE_ULTRA_PRICE_ID) return 'ultra';
  return 'free';
}
