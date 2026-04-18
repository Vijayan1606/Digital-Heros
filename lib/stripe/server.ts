import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any, // Using type casting to temporarily satisfy TS and stripe version mismatch, or best to just trust latest. Let's use 2023-10-16 or later.
  appInfo: {
    name: 'Digital Heroes',
    version: '0.1.0',
  },
});
