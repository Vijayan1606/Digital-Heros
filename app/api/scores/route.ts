import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { score, date } = await req.json();

  if (!score || score < 1 || score > 45 || !date) {
    return NextResponse.json({ error: 'Invalid score or date' }, { status: 400 });
  }

  // Insert score. Trigger will enforce 5-score limit
  const { data, error } = await supabase
    .from('scores')
    .insert({
      user_id: user.id,
      score_value: score,
      score_date: date,
    })
    .select();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json({ error: 'Score for this date already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  }

  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
