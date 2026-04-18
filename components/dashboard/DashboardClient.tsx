'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Plus, Trash2, Upload, AlertCircle, Award, Target, CalendarDays, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

type DashboardProps = {
  user: User;
  subscription: any;
  contribution: any;
  initialScores: any[];
  payouts: any[];
  entries: any[];
}

export default function DashboardClient({ user, subscription, contribution, initialScores, payouts, entries }: DashboardProps) {
  const [scores, setScores] = useState(initialScores);
  const [newScore, setNewScore] = useState('');
  const [newDate, setNewDate] = useState('');
  const [scoreError, setScoreError] = useState('');
  const [loadingScore, setLoadingScore] = useState(false);
  const router = useRouter();

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setScoreError('');
    setLoadingScore(true);

    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score: parseInt(newScore), date: newDate })
    });

    const data = await res.json();
    setLoadingScore(false);

    if (data.error) {
      setScoreError(data.error);
    } else {
      router.refresh(); // In real app, update client state ideally, but simpler to refresh to sync with 5-limit trigger
      setNewScore('');
      setNewDate('');
    }
  };

  const handleDeleteScore = async (id: string) => {
    await fetch(`/api/scores?id=${id}`, { method: 'DELETE' });
    router.refresh();
  };

  const isSubActive = subscription?.status === 'active';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your scores, charity, and winnings.</p>
        </div>
        {!isSubActive && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            Subscription inactive. You are not eligible for draws.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scores Widget */}
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10" />
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="text-primary" />
              Latest Scores <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">{scores.length}/5</span>
            </h2>
            
            <form onSubmit={handleAddScore} className="flex flex-wrap gap-4 items-end mb-6 bg-input/50 p-4 rounded-xl border border-border">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Score (1-45)</label>
                <input 
                  type="number" min="1" max="45" required
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  value={newScore} onChange={e => setNewScore(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                <input 
                  type="date" required max={new Date().toISOString().split('T')[0]}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary [color-scheme:dark]"
                  value={newDate} onChange={e => setNewDate(e.target.value)}
                />
              </div>
              <button 
                type="submit" disabled={loadingScore}
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover-lift transition-all disabled:opacity-50 h-[42px]"
              >
                <Plus size={18} /> Add Score
              </button>
            </form>
            {scoreError && <p className="text-red-400 text-sm mb-4">{scoreError}</p>}

            {scores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground bg-secondary/30 rounded-xl border border-dashed border-border">
                No scores logged yet. Start playing!
              </div>
            ) : (
              <div className="space-y-3">
                {scores.map(s => (
                  <div key={s.id} className="flex justify-between items-center bg-secondary/50 p-3 rounded-xl border border-border/50 group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {s.score_value}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">Stableford Points</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays size={12} /> {new Date(s.score_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteScore(s.id)}
                      className="text-muted-foreground hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Winnings / Payouts */}
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="text-accent" />
              Winnings & Proof
            </h2>
            {payouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No winnings recorded yet.</div>
            ) : (
              <div className="space-y-4">
                {payouts.map(p => (
                  <div key={p.id} className="border border-border/60 bg-secondary/30 rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="font-medium text-accent flex items-center gap-2">
                        +${p.amount} <span className="text-xs text-muted-foreground bg-input px-2 py-0.5 rounded-full">{p.match_type.replace('_', ' ')}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Draw: {new Date(p.draws?.draw_month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-xs mt-2 capitalize font-medium">Status: 
                        <span className={`ml-1 ${p.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>{p.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {p.status === 'pending' && (
                      <button className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 hover-lift w-fit border border-white/10">
                        <Upload size={16} /> Upload Proof
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Subscription Status */}
          <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-primary">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Subscription</h2>
            <div className="text-2xl font-bold text-white capitalize mb-4">
              {subscription?.plan_type || 'None'}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isSubActive ? 'bg-accent' : 'bg-red-500'}`}></div>
              <span className="text-muted-foreground capitalize">{subscription?.status || 'Unknown'}</span>
            </div>
          </div>

          {/* Charity Status */}
          <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-accent bg-gradient-to-b from-accent/5 to-transparent">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">My Charity</h2>
            {contribution ? (
              <>
                <div className="text-xl font-bold text-white mb-1 line-clamp-1">
                  {contribution.charities.name}
                </div>
                <div className="text-3xl font-extrabold text-accent mb-4">
                  {contribution.contribution_percentage}% <span className="text-sm font-normal text-muted-foreground">of fee</span>
                </div>
                <button className="text-sm text-primary hover:text-primary/80 font-medium">Change Selection</button>
              </>
            ) : (
              <div className="text-sm text-yellow-400">No active charity selected.</div>
            )}
          </div>

          {/* Draw Participation */}
          <div className="glass-panel p-6 rounded-2xl overflow-hidden">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Draw History</h2>
            {entries.length === 0 ? (
              <div className="text-sm text-muted-foreground">No entries yet.</div>
            ) : (
              <div className="space-y-3">
                {entries.slice(0, 3).map(e => (
                  <div key={e.id} className="flex justify-between items-center text-sm">
                    <span className="text-white">
                      {new Date(e.draws?.draw_month).toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-medium ${e.is_winner ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                      {e.match_count} Matches
                    </span>
                  </div>
                ))}
                {entries.length > 3 && (
                  <button className="text-xs text-primary pt-2 w-full text-center hover:underline">View All</button>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
