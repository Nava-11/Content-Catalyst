import { PageTransition } from "@/components/PageTransition";
import { NavBar } from "@/components/landing/NavBar";
import { Hero } from "@/components/landing/Hero";
import { ProblemStatement, FeatureShowcase } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <PageTransition className="min-h-screen bg-space-900 text-content-primary font-body selection:bg-brand-teal/30">
      <NavBar />

      <main className="relative">
        <Hero />
        <ProblemStatement />
        <FeatureShowcase />

        {/* Call to Action Banner */}
        <section className="py-32 relative z-10 border-t border-borderBase overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 50% 100%, #8B5CF6 0%, transparent 70%)' }} />
          <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
            <h2 className="text-5xl md:text-6xl font-display font-bold text-content-primary mb-6">Stop guessing. Start creating with clarity.</h2>
            <p className="text-xl text-content-secondary mb-10">Join 2,400+ creators who've mapped their creative identity.</p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="h-16 px-10 rounded-full bg-brand-teal text-space-900 font-bold text-xl flex items-center justify-center gap-3 mx-auto hover:bg-brand-teal/90 glow-teal transition-all hover:scale-105 active:scale-95"
            >
              Analyze My Channel Free
            </button>
          </div>
        </section>

        <Pricing />
      </main>

      <Footer />
    </PageTransition>
  );
}
