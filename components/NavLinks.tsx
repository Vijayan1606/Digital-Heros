'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User } from '@supabase/supabase-js';

export default function NavLinks({ 
  user, 
  isAdmin, 
  hasActiveSubscription 
}: { 
  user: User | null, 
  isAdmin: boolean,
  hasActiveSubscription: boolean
}) {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home' },
    { href: '/charities', label: 'Charities' },
    { href: '/draws', label: 'Draws' },
  ];

  if (user) {
    if (isAdmin) {
      links.push({ href: '/admin', label: 'Admin Panel' });
    } else {
      links.push({ href: '/dashboard', label: 'Dashboard' });
    }
  }

  return (
    <>
      <div className="flex items-center space-x-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === link.href ? "text-primary" : "text-muted-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center space-x-4 pl-4 border-l border-border">
        {user ? (
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
              Sign Out
            </button>
          </form>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
              Log In
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md hover-lift transition-all">
              Subscribe Now
            </Link>
          </>
        )}
      </div>
    </>
  );
}
