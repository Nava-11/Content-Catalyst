import { Link } from "wouter";
import { Navigation } from "@/components/Navigation";
import { Youtube, BarChart2, Lightbulb, Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {



  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navigation />

      <main className="relative overflow-hidden">
        {/* Abstract Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full opacity-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 py-20 sm:py-32 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border/50 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Content Intelligence
            </div>

            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight leading-tight">
              Turn Data Into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                Viral Concepts
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop guessing what to create next. Analyze your channel performance and get data-backed content ideas differentiated for your niche.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="max-w-xl mx-auto relative group mt-8"
          >
            <Link href="/auth">
              <button
                className="h-14 px-8 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 mx-auto"
              >
                Start For Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left"
          >
            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
                <BarChart2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Deep Analytics</h3>
              <p className="text-muted-foreground text-sm">Understand exactly what formats perform best on your channel with our custom CRPS metric.</p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <Lightbulb className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Unique Ideas</h3>
              <p className="text-muted-foreground text-sm">Generate video concepts that differentiate you from competitors in your specific niche.</p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Idea Blueprints</h3>
              <p className="text-muted-foreground text-sm">Open any recommended idea to see a deep-dive blueprint grounded in your own audience data.</p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
