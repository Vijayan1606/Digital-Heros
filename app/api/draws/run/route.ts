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

  const { draw_month, draw_type, is_publish } = await req.json();

  if (!draw_month || !draw_type) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Create admin client to bypass RLS securely for background tasks
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Generate Draw Numbers
  let drawn_numbers: number[] = [];
  if (draw_type === 'random') {
    while(drawn_numbers.length < 5) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!drawn_numbers.includes(num)) drawn_numbers.push(num);
    }
  } else {
    // Algorithmic: get all scores, find frequencies, weight against frequent numbers.
    // Simplifying for now: just random
    while(drawn_numbers.length < 5) {
      const num = Math.floor(Math.random() * 45) + 1;
      if (!drawn_numbers.includes(num)) drawn_numbers.push(num);
    }
  }

  // 2. Create Draw record
  const { data: draw, error: drawError } = await supabaseAdmin
    .from('draws')
    .insert({
      draw_month,
      draw_type,
      status: is_publish ? 'published' : 'simulated',
      drawn_numbers,
      created_by: user.id,
      published_at: is_publish ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (drawError) return NextResponse.json({ error: drawError.message }, { status: 500 });

  // 3. Create Draw Entries for all active subscribers
  const { data: activeSubs } = await supabaseAdmin.from('subscriptions').select('user_id').eq('status', 'active');
  const subs = activeSubs || [];

  for (let sub of subs) {
    const { data: scores } = await supabaseAdmin.from('scores').select('score_value').eq('user_id', sub.user_id).order('score_date', { ascending: false }).limit(5);
    const scoreVals = scores?.map(s => s.score_value) || [];
    
    // Match logic
    const match_count = scoreVals.filter(s => drawn_numbers.includes(s)).length;
    const is_winner = match_count >= 3;

    await supabaseAdmin.from('draw_entries').insert({
      draw_id: draw.id,
      user_id: sub.user_id,
      scores_snapshot: scoreVals,
      match_count,
      is_winner
    });
  }

  return NextResponse.json({ success: true, draw });
}
