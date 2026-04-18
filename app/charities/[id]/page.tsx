import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function CharityDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: charity } = await supabase
    .from('charities')
    .select('*, charity_events(*)')
    .eq('id', params.id)
    .single();

  if (!charity) return notFound();

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16 w-full">
      <div className="mb-8">
        <Link href="/charities" className="text-primary hover:underline text-sm font-medium">
          &larr; Back to Charities
        </Link>
      </div>

      <div className="glass-panel p-8 md:p-12 rounded-3xl mb-12 border-t-4 border-t-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="w-full md:w-1/3 bg-secondary/80 rounded-2xl aspect-square flex items-center justify-center p-6 border border-border">
            {charity.logo_url ? (
              <img src={charity.logo_url} alt={charity.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <h2 className="text-3xl font-bold text-muted-foreground text-center">{charity.name}</h2>
            )}
          </div>
          
          <div className="w-full md:w-2/3">
            <h1 className="text-4xl font-bold text-white mb-4">{charity.name}</h1>
            {charity.website_url && (
              <a href={charity.website_url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-sm font-medium mb-6 inline-block">
                Visit Official Website
              </a>
            )}
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <p className="whitespace-pre-wrap">{charity.description}</p>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border">
              <Link href="/signup" className="inline-block bg-accent hover:bg-accent/90 text-white font-bold py-3 px-8 rounded-lg hover-lift transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                Support {charity.name}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {charity.charity_events && charity.charity_events.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Upcoming Events</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {charity.charity_events.map((event: any) => (
              <div key={event.id} className="glass-panel p-6 rounded-2xl">
                <div className="text-sm text-primary font-medium mb-2">{new Date(event.event_date).toLocaleDateString()}</div>
                <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                <p className="text-muted-foreground text-sm">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
