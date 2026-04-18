import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // verify admin
  const { data: role } = await supabase.from('user_roles').select('role').eq('user_id', user.id).single();
  if (role?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let { draw_id, total_pool_override } = await req.json();

  if (!draw_id) return NextResponse.json({ error: 'Missing draw_id' }, { status: 400 });

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (draw_id === 'latest') {
    const { data: latest_draw } = await supabaseAdmin.from('draws').select('id').order('created_at', { ascending: false }).limit(1).single();
    if (!latest_draw) return NextResponse.json({ error: 'No draw found' }, { status: 404 });
    draw_id = latest_draw.id;
  }

  // 1. Calculate pool amount if not provided
  let total_pool = total_pool_override || 0;
  if (!total_pool_override) {
    // In real scenario, sum (Subscription Fee - Charity%) for active subscriptions.
    const { count } = await supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');
    total_pool = (count || 0) * 15 * 0.4; // assume 40% of standard $15 goes to pool
  }

  // Update draw total
  await supabaseAdmin.from('draws').update({ total_pool_amount: total_pool }).eq('id', draw_id);

  // 2. Tiers
  const tiers = [
    { type: '5_match', pct: 0.40, count: 5 },
    { type: '4_match', pct: 0.35, count: 4 },
    { type: '3_match', pct: 0.25, count: 3 }
  ];

  // 3. Count winners
  for (let tier of tiers) {
    const { data: entries } = await supabaseAdmin.from('draw_entries')
      .select('user_id')
      .eq('draw_id', draw_id)
      .eq('match_count', tier.count);
    
    let winner_count = entries?.length || 0;
    
    // Previous rollover? (Only for 5 match)
    let rolled_over = false;
    let pool_amount = total_pool * tier.pct;

    if (tier.type === '5_match' && winner_count === 0) {
      rolled_over = true;
      await supabaseAdmin.from('draws').update({ jackpot_rollover: true }).eq('id', draw_id);
    }

    let per_winner = winner_count > 0 ? pool_amount / winner_count : 0;

    await supabaseAdmin.from('prize_pools').insert({
      draw_id,
      match_type: tier.type,
      pool_percentage: tier.pct * 100,
      total_amount: pool_amount,
      per_winner_amount: per_winner,
      rolled_over
    });

    // Create payouts for winners
    if (winner_count > 0 && entries) {
      for (let w of entries) {
        await supabaseAdmin.from('winner_payouts').insert({
          draw_id,
          user_id: w.user_id,
          match_type: tier.type,
          amount: per_winner,
          status: 'pending'
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
