import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Award, Trophy, Star } from 'lucide-react';

export default async function DrawsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch published draws
  const { data: draws } = await supabase
    .from('draws')
    .select('*, prize_pools(*)')
    .eq('status', 'published')
    .order('draw_month', { ascending: false });

  // Fetch user entries if logged in
  let userEntries: any[] = [];
  if (user && draws) {
    const drawIds = draws.map(d => d.id);
    if (drawIds.length > 0) {
      const { data } = await supabase
        .from('draw_entries')
        .select('*')
        .eq('user_id', user.id)
        .in('draw_id', drawIds);
      if (data) userEntries = data;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 w-full">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl mb-4">Draw Results</h1>
        <p className="text-lg text-muted-foreground">
          See the winning numbers, prize pools, and check if you've hit the jackpot.
        </p>
      </div>

      <div className="space-y-12">
        {draws && draws.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white">No Draws Published Yet</h3>
            <p className="text-muted-foreground mt-2">The first monthly draw results will appear here.</p>
          </div>
        ) : (
          draws?.map((draw) => {
            const userEntry = userEntries.find(e => e.draw_id === draw.id);
            const totalPrize = draw.prize_pools?.reduce((acc: number, curr: any) => acc + Number(curr.total_amount), 0) || 0;

            return (
              <div key={draw.id} className="glass-panel rounded-3xl overflow-hidden border-t border-border">
                <div className="p-8 md:p-10 border-b border-white/5 bg-secondary/30 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/10 to-transparent -z-10" />
                  
                  <div>
                    <div className="text-primary font-bold tracking-wider uppercase text-sm mb-2 drop-shadow-sm">
                      {new Date(draw.draw_month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Total Prize Pool: ${totalPrize.toLocaleString()}</h2>
                    {draw.jackpot_rollover && (
                      <span className="inline-block bg-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full mt-2">
                        Jackpot Rollover Included!
                      </span>
                    )}
                  </div>

                  <div className="text-center md:text-right">
                    <div className="text-sm text-muted-foreground mb-3">Winning Numbers</div>
                    <div className="flex gap-3 justify-center md:justify-end">
                      {draw.drawn_numbers.map((num: number, i: number) => {
                        const isMatch = userEntry?.scores_snapshot?.includes(num);
                        return (
                          <div 
                            key={i} 
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg
                              ${isMatch 
                                ? 'bg-gradient-to-br from-accent to-emerald-600 text-white shadow-accent/40 scale-110 border border-white/20' 
                                : 'bg-gradient-to-br from-secondary to-background text-white border border-border'
                              }`}
                          >
                            {num}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-10 grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-6">Prize Pool Breakdown</h3>
                    <div className="space-y-4">
                      {draw.prize_pools?.sort((a: any, b: any) => b.match_type.localeCompare(a.match_type)).map((pool: any) => (
                        <div key={pool.id} className="flex justify-between items-center py-3 border-b border-border border-dashed last:border-0">
                          <div className="flex items-center gap-3">
                            <Award className={pool.match_type === '5_match' ? 'text-accent' : 'text-primary'} size={20} />
                            <div>
                              <div className="font-medium text-white">{pool.match_type.replace('_', ' ')}</div>
                              <div className="text-xs text-muted-foreground">{pool.pool_percentage}% of total pool</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white">${Number(pool.total_amount).toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">
                              {pool.rolled_over ? 'Rolled Over to Next Month' : `$${Number(pool.per_winner_amount).toLocaleString()} / winner`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-background rounded-2xl p-6 border border-border">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Results</h3>
                    {user ? (
                      userEntry ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Your Snapshot:</span>
                            <div className="flex gap-2">
                              {userEntry.scores_snapshot?.map((num: number, i: number) => (
                                <span key={i} className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${draw.drawn_numbers.includes(num) ? 'bg-accent text-white' : 'bg-secondary text-muted-foreground'}`}>{num}</span>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-between items-center py-2 border-y border-border">
                            <span className="text-white font-medium">Matches:</span>
                            <span className={`font-bold ${userEntry.is_winner ? 'text-accent text-xl' : 'text-white'}`}>{userEntry.match_count}</span>
                          </div>
                          {userEntry.is_winner ? (
                            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
                              <Star className="text-accent h-8 w-8 mx-auto mb-2" fill="currentColor" />
                              <div className="font-bold text-accent">Congratulations! You're a winner!</div>
                              <div className="text-sm text-white mt-1">Check your dashboard to claim your prize.</div>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground py-4 text-sm">
                              Better luck next time! Keep logging your scores.
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>You did not have an active entry for this draw.</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">Log in to view your results for this draw.</p>
                        <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-6 rounded-lg text-sm transition-colors border border-white/5">
                          Sign In
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
