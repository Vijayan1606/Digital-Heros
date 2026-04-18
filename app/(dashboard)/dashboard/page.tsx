import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/dashboard/DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Fetch true active charity
  const { data: contributions } = await supabase
    .from('user_charity_contributions')
    .select('contribution_percentage, charities(id, name, logo_url)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  // Fetch scores
  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .order('score_date', { ascending: false });

  // Fetch recent payouts
  const { data: payouts } = await supabase
    .from('winner_payouts')
    .select('*, draws(draw_month)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch draw entries
  const { data: entries } = await supabase
    .from('draw_entries')
    .select('*, draws(draw_month, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <DashboardClient 
      user={user} 
      subscription={subscription} 
      contribution={contributions} 
      initialScores={scores || []} 
      payouts={payouts || []}
      entries={entries || []}
    />
  );
}
