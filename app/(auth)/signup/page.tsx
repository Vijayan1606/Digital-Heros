'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCharity, setSelectedCharity] = useState<string | null>(null);
  const [charities, setCharities] = useState<any[]>([]);
  const [planType, setPlanType] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchCharities = async () => {
      const { data } = await supabase.from('charities').select('*').eq('is_active', true);
      if (data) setCharities(data);
    };
    fetchCharities();
  }, [supabase]);

  const handleSignup = async () => {
    setLoading(true);
    setError(null);

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('An error occurred during signup.');
      setLoading(false);
      return;
    }

    // 2. Set Charity contribution temporarily via API or directly if RLS allows
    // But since RLS for `user_charity_contributions` expects auth.uid(), we can insert it if the session is established.
    // However, signup might require email confirmation. Assuming auto-login or implicit session:
    if (selectedCharity) {
      await supabase.from('user_charity_contributions').insert({
        user_id: authData.user.id,
        charity_id: selectedCharity,
        contribution_percentage: 10, // default
        is_active: true
      });
    }

    // 3. Setup subscription object in DB
    await supabase.from('subscriptions').insert({
      user_id: authData.user.id,
      plan_type: planType,
      status: 'inactive'
    });

    // 4. Redirect to stripe checkout API
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: authData.user.id, email, planType }),
      });
      
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        setError('Failed to create checkout session.');
      }
    } catch (err: any) {
      setError(err.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-xl w-full space-y-8 glass-panel p-10 rounded-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white">Join Digital Heroes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Step {step} of 3
          </p>
        </div>

        {error && <div className="text-red-500 text-sm font-medium text-center">{error}</div>}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Full Name</label>
              <input
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border bg-input placeholder-muted-foreground text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Email</label>
              <input
                type="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border bg-input placeholder-muted-foreground text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Password</label>
              <input
                type="password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border bg-input placeholder-muted-foreground text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!email || !password || !fullName}
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none hover-lift disabled:opacity-50 transition-all"
            >
              Next: Select Charity
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white text-center">Where should your contribution go?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto pr-2">
              {charities.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground">Loading charities...</div>
              ) : charities.map(charity => (
                <div 
                  key={charity.id}
                  onClick={() => setSelectedCharity(charity.id)}
                  className={`cursor-pointer p-4 rounded-xl border ${selectedCharity === charity.id ? 'border-primary bg-primary/10' : 'border-border bg-input hover:border-primary/50'} transition-all`}
                >
                  <h4 className="font-semibold text-white">{charity.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{charity.description}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 py-3 border border-border rounded-md text-white hover:bg-white/5 transition-all"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedCharity}
                className="w-2/3 flex justify-center py-3 border border-transparent font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50 hover-lift transition-all"
              >
                Next: Select Plan
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-white text-center">Choose your Subscription</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => setPlanType('monthly')}
                className={`cursor-pointer p-6 rounded-xl border relative overflow-hidden ${planType === 'monthly' ? 'border-primary bg-primary/10' : 'border-border bg-input hover:border-primary/50'} transition-all text-center`}
              >
                <div className="font-semibold text-white mb-2">Monthly</div>
                <div className="text-3xl font-bold text-white">$15<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
              </div>
              <div 
                onClick={() => setPlanType('yearly')}
                className={`cursor-pointer p-6 rounded-xl border relative overflow-hidden ${planType === 'yearly' ? 'border-primary bg-primary/10' : 'border-border bg-input hover:border-primary/50'} transition-all text-center`}
              >
                <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-bl-lg">Save 20%</div>
                <div className="font-semibold text-white mb-2">Yearly</div>
                <div className="text-3xl font-bold text-white">$144<span className="text-sm font-normal text-muted-foreground">/yr</span></div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 py-3 border border-border rounded-md text-white hover:bg-white/5 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-2/3 flex justify-center py-3 border border-transparent font-bold rounded-md text-white bg-accent hover:bg-accent/90 disabled:opacity-50 hover-lift transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                {loading ? 'Processing...' : 'Checkout securely'}
              </button>
            </div>
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
