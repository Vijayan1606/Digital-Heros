import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CharitiesPage() {
  const supabase = await createClient();
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 w-full">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-4">Our Charity Partners</h1>
        <p className="text-lg text-muted-foreground">
          Discover the incredible organizations supported by the Digital Heroes community.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {charities?.map(charity => (
          <div key={charity.id} className="glass-panel rounded-2xl overflow-hidden hover-lift flex flex-col h-full border-t border-border">
            <div className="h-48 bg-secondary relative overflow-hidden flex items-center justify-center p-4">
              {/* Optional: using image tag for logo, fallback to name gradient currently */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"></div>
              {charity.logo_url ? (
                <img src={charity.logo_url} alt={charity.name} className="relative z-10 max-h-32 object-contain" />
              ) : (
                <h3 className="relative z-10 text-2xl font-bold text-white text-center break-words">{charity.name}</h3>
              )}
              {charity.is_featured && (
                <span className="absolute top-4 right-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full z-20">
                  Featured
                </span>
              )}
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{charity.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-1">
                {charity.description}
              </p>
              <Link 
                href={`/charities/${charity.id}`}
                className="w-full text-center py-3 bg-secondary hover:bg-white/10 border border-border text-white text-sm font-medium rounded-lg transition-colors mt-auto block"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
