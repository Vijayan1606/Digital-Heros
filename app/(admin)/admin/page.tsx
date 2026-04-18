import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Target, CalendarDays, Award, PieChart, Heart } from 'lucide-react';
import AdminQuickActions from '@/components/admin/AdminQuickActions';

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  // Basic Stats compilation
  const [{ count: userCount }, { count: activeSubs }, { count: charitiesCount }, { data: poolSum }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('charities').select('*', { count: 'exact', head: true }),
    supabase.from('prize_pools').select('total_amount')
  ]);

  const totalPrizePools = poolSum?.reduce((sum: number, p: any) => sum + Number(p.total_amount), 0) || 0;

  const modules = [
    { title: 'Users & Subs', icon: Users, path: '/admin/users', stat: `${activeSubs}/${userCount} Active`, color: 'text-blue-400' },
    { title: 'Scores Management', icon: Target, path: '/admin/scores', stat: 'Manage entries', color: 'text-orange-400' },
    { title: 'Draw Engine', icon: CalendarDays, path: '/admin/draws', stat: 'Simulate & Publish', color: 'text-accent' },
    { title: 'Charities', icon: Heart, path: '/admin/charities', stat: `${charitiesCount} Partners`, color: 'text-red-400' },
    { title: 'Winner Verification', icon: Award, path: '/admin/winners', stat: 'Review Proofs', color: 'text-yellow-400' },
    { title: 'Financial Reports', icon: PieChart, path: '/admin/reports', stat: `$${totalPrizePools.toLocaleString()} Total Pools`, color: 'text-primary' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 w-full">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Admin Console</h1>
        <p className="text-muted-foreground mt-2">Manage the entire Digital Heroes platform.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <Link key={i} href={m.path} className="glass-panel p-6 rounded-2xl hover-lift border-t border-white/5 flex items-start gap-4 group">
              <div className={`p-4 rounded-xl bg-secondary border border-border group-hover:border-primary/50 transition-colors ${m.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">{m.title}</h2>
                <div className="text-sm text-muted-foreground mt-1">{m.stat}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 glass-panel p-8 rounded-3xl border border-border/50 bg-secondary/20">
        <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
        <AdminQuickActions />
      </div>
    </div>
  );
}
