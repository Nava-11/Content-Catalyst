import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "wouter";
import { WorldModelSphere } from "./WorldModelSphere";

export function Hero() {
    return (
        <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden pt-20">

            {/* Background Particles Element Placeholder */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40"
                style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(29, 255, 210, 0.05) 0%, transparent 60%)' }} />

            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative z-10 w-full">

                {/* Left Copy */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", staggerChildren: 0.1 }}
                    className="flex flex-col gap-6 relative z-20"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-teal/10 border border-brand-teal/20 text-brand-teal text-xs font-bold uppercase tracking-widest w-fit"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
                        AI-Powered Creative Engine
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-5xl md:text-7xl font-display font-bold text-content-primary leading-[1.1] tracking-tight"
                    >
                        Your content has a story.<br />
                        <span className="text-brand-teal">We help you read it.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="text-lg md:text-xl text-content-secondary leading-relaxed max-w-xl"
                    >
                        Content Catalyst maps your creative identity, reads your content history, and sparks ideas grounded in your actual DNA — not fleeting trends.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="flex flex-col gap-4 mt-4 w-full max-w-lg"
                    >
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const input = form.elements.namedItem('channelId') as HTMLInputElement;
                                if (input.value) {
                                    window.location.href = `/onboarding?channelId=${encodeURIComponent(input.value)}`;
                                }
                            }}
                            className="flex items-center bg-space-800 rounded-full border border-borderBase p-1 focus-within:border-brand-teal transition-colors"
                        >
                            <input
                                name="channelId"
                                type="text"
                                placeholder="Enter YouTube Channel ID (e.g. UCX6OQ3DkcsbYNE6H8uQQuVA)"
                                className="flex-1 bg-transparent border-none text-content-primary px-6 focus:outline-none placeholder:text-content-tertiary text-sm"
                                required
                            />
                            <button type="submit" className="h-12 px-6 rounded-full bg-brand-teal text-space-900 font-bold flex items-center gap-2 hover:bg-brand-teal/90 glow-teal transition-all active:scale-95 whitespace-nowrap">
                                Analyze <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        <button className="h-12 px-6 rounded-full bg-transparent border border-transparent text-content-secondary font-bold text-sm flex items-center justify-center gap-2 hover:text-content-primary transition-all w-fit">
                            <Play className="w-4 h-4" /> Watch Demo
                        </button>
                    </motion.div>
                </motion.div>

                {/* Right 3D Element */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                    className="h-[500px] lg:h-[700px] w-full relative perspective-1000"
                >
                    <WorldModelSphere />
                </motion.div>

            </div>
        </section>
    );
}
