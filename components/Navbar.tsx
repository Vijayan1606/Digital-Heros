import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import NavLinks from './NavLinks';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  let isAdmin = false;
  let hasActiveSubscription = false;

  if (user) {
    // Check role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
      
    isAdmin = roleData?.role === 'admin';

    // Check subscription
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();
    
    hasActiveSubscription = subData?.status === 'active';
  }

  return (
    <header className="fixed top-0 w-full z-50 glass-panel border-b-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold text-sm">DH</span>
              </div>
              Digital Heroes
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <NavLinks user={user} isAdmin={isAdmin} hasActiveSubscription={hasActiveSubscription} />
          </nav>
        </div>
      </div>
    </header>
  );
}
