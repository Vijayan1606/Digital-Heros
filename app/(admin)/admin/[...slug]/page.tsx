import Link from 'next/link';
import { ArrowLeft, HardHat } from 'lucide-react';

export default async function AdminSubmodulePage(props: { params: Promise<{ slug?: string[] }> }) {
  const params = await props.params;
  const slug = params?.slug || ['Module'];
  const moduleName = slug.join(' / ').replace(/-/g, ' ');

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center min-h-[65vh]">
      <div className="p-6 rounded-full bg-secondary/50 border border-border mb-6">
        <HardHat size={56} className="text-primary opacity-80" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight capitalize mb-6">
        {moduleName} Module
      </h1>
      
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
        This administrative sub-module is currently under localized active development! 
        All granular controls, manual row deletions, complex table views, and individual metric graphs for <span className="text-white capitalize">{moduleName}</span> will be populated right here very soon.
      </p>
      
      <Link 
        href="/admin" 
        className="glass-panel px-8 py-4 rounded-2xl flex items-center gap-3 text-white hover:text-primary transition-all duration-300 border border-white/5 hover:border-primary/50 hover-lift bg-secondary/30"
      >
        <ArrowLeft size={20} />
        Return to Main Console
      </Link>
    </div>
  );
}
