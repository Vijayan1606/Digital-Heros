import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!webhookSecret) throw new Error('Webhook secret missing');
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = await createClient(); // service role needed really, but we'll use standard server client with bypass or service role

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const planType = session.metadata?.planType;
        if (userId && session.subscription) {
          await supabase
            .from('subscriptions')
            .update({
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              status: 'active',
              plan_type: planType,
            })
            .eq('user_id', userId);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status, // active, past_due, canceled, etc.
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
