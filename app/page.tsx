import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative px-6 py-24 lg:px-8 bg-gradient-to-b from-background to-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3">
          <div className="w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10 pt-16">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-muted-foreground">Play Your Game.</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">&nbsp;Change the World.</span>
          </h1>
          <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-2xl mx-auto">
            The premium platform where your everyday rounds mean more. Track scores, fund incredible charities, and qualify for our massive monthly prize draws.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/signup"
              className="rounded-full bg-primary px-8 py-4 text-sm font-semibold text-white shadow-sm hover:bg-primary/80 hover-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Start Earning Rewards
            </Link>
            <Link href="/charities" className="text-sm font-semibold leading-6 text-white hover:text-primary transition-colors">
              See the Impact <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Three simple steps to combine your passion for the game with real-world impact and incredible rewards.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Subscribe & Support", desc: "Join Digital Heroes. A 10% minimum of your fee goes directly to your chosen charity." },
              { title: "Track Your Scores", desc: "Log your points. We take a snapshot of your 5 most recent scores every month." },
              { title: "Win Big", desc: "Match your scores in our monthly draw to win huge cash prizes from the pool." },
            ].map((step, i) => (
              <div key={i} className="glass-panel p-8 rounded-2xl text-center hover-lift border-t border-white/5">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xl mx-auto mb-6">
                  {i + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 border-t border-border bg-secondary">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Digital Heroes. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
