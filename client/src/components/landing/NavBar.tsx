import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles } from "lucide-react";

export function NavBar() {
    const { scrollY } = useScroll();
    const borderOpacity = useTransform(scrollY, [0, 100], [0, 1]);
    const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.8]);

    return (
        <motion.header
            className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
            style={{
                backgroundColor: `rgba(5, 6, 15, ${bgOpacity})`,
                borderBottom: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
                backdropFilter: "blur(20px)"
            }}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-space-800 border border-brand-teal/30 flex items-center justify-center glow-teal transition-all duration-300 group-hover:border-brand-teal">
                        <span className="font-display font-bold tracking-tighter text-brand-teal text-xl">CC</span>
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight text-content-primary hidden sm:block">
                        Content Catalyst
                    </span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">Features</a>
                    <a href="#how-it-works" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">How It Works</a>
                    <a href="#pricing" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">Pricing</a>
                </nav>

                {/* CTAs */}
                <div className="flex items-center gap-4">
                    <Link href="/auth" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors hidden sm:block">
                        Sign In
                    </Link>
                    <Link href="/auth" className="h-10 px-5 rounded-full bg-brand-teal text-space-900 font-bold text-sm flex items-center gap-2 hover:bg-brand-teal/90 glow-teal transition-all hover:scale-105 active:scale-95">
                        <Sparkles className="w-4 h-4" />
                        Try Free
                    </Link>
                </div>
            </div>
        </motion.header>
    );
}
