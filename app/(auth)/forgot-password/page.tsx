'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset instructions sent to your email.');
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
      <div className="max-w-md w-full space-y-8 glass-panel p-10 rounded-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Reset Password
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleReset}>
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address"
              name="email"
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-border bg-input placeholder-muted-foreground text-white focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
          {message && <div className="text-accent text-sm font-medium">{message}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none hover-lift disabled:opacity-50 transition-all"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </div>
        </form>
        <div className="text-center text-sm text-muted-foreground">
          Remembered your password?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
