import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { planType, userId, email } = await req.json();
    
    // Validate inputs
    if (!planType || !userId || !email) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const priceId = planType === 'yearly' 
      ? process.env.STRIPE_PRICE_YEARLY_ID 
      : process.env.STRIPE_PRICE_MONTHLY_ID;

    if (!priceId) {
      // In development, if mapping is missing, create ad-hoc price or throw
      console.warn("Missing price IDs in env. Using dummy for flow completion if missing");
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      customer_email: email,
      line_items: [
        {
          price: priceId || 'price_1dummy', // replace with real fallback or error in real prod
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/signup`,
      metadata: {
        userId,
        planType
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
