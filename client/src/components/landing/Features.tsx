import { motion } from "framer-motion";
import { StaggerContainer, FadeInUp } from "../PageTransition";
import { HoverCard3D } from "../HoverCard3D";
import { MessageSquare, LineChart, Target, Compass, Sparkles, Brain, Cpu, Database, EyeOff, LayoutGrid, Search } from "lucide-react";

const PROBLEMS = [
    {
        icon: Database,
        title: "The Data Paradox",
        text: "You have more analytics than ever. Views, watch time, CTR, retention. But none of it tells you what to create next. Data without meaning is noise."
    },
    {
        icon: EyeOff,
        title: "The Blank Page Problem",
        text: "Every upload cycle starts the same way — staring at a blank page. You know what performed. You don't know why, or what comes next."
    },
    {
        icon: LayoutGrid,
        title: "The Sameness Trap",
        text: "When every creator uses the same tools optimizing the same metrics, content converges. Your voice gets lost in algorithmic sameness."
    }
];

export function ProblemStatement() {
    return (
        <section id="how-it-works" className="py-32 relative z-10 px-6 border-t border-borderBase bg-space-900/50 backdrop-blur-3xl">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-content-primary mb-6">Why most creator tools are broken</h2>
                </div>

                <StaggerContainer className="grid md:grid-cols-3 gap-8">
                    {PROBLEMS.map((prob, i) => (
                        <HoverCard3D key={i} glowColor={i === 1 ? "violet" : "teal"}>
                            <div className="p-8 h-full flex flex-col gap-6">
                                <div className="w-12 h-12 rounded-xl bg-space-800 border border-borderBase flex items-center justify-center text-brand-teal glow-teal">
                                    <prob.icon className="w-6 h-6" />
                                </div>
                                <h3 className="font-display font-bold text-2xl text-content-primary">{prob.title}</h3>
                                <p className="text-content-secondary leading-relaxed">{prob.text}</p>
                            </div>
                        </HoverCard3D>
                    ))}
                </StaggerContainer>
            </div>
        </section>
    );
}

const FEATURES = [
    {
        title: "Your creative identity, mapped",
        subtitle: "Creator World Model",
        desc: "The Creator World Model is a living semantic map of everything you've made. Topics you own, tones you use, formats you favor, and the creative territory you've never explored.",
        bullets: ["Semantic topic clusters using transformer embeddings", "Tone fingerprint vector — your unique voice signature", "Format DNA ratio (tutorial / story / list)", "Temporal drift detection"],
        icon: Brain,
        align: "left"
    },
    {
        title: "Performance that actually means something",
        subtitle: "Content Resonance & Performance Score (CRPS)",
        desc: "Raw view counts lie. A video with 10k views on a channel that averages 100k is a failure. One with 5k views on a channel averaging 1k is a breakthrough. CRPS normalizes everything relative to your baseline.",
        code: "CRPS = 0.5 × (Views/Avg Views) + 0.3 × (Likes/Avg Likes)",
        icon: LineChart,
        align: "right"
    },
    {
        title: "Ideas that sound like you",
        subtitle: "Ideas Engine",
        desc: "Four generation lenses. Every idea scored on three axes before you see it: Audience Fit, Identity Alignment, and Novelty.",
        bullets: ["Contrast (Flip tone)", "Remix (Blend clusters)", "Inversion (Do worst differently)", "Expansion (Go deeper)"],
        icon: Sparkles,
        align: "left"
    },
    {
        title: "Ask anything. Get answers from data.",
        subtitle: "RAG Chatbot",
        desc: "The RAG chatbot doesn't hallucinate. Every answer is grounded in your actual clusters, CRPS trends, and content history.",
        icon: MessageSquare,
        align: "right"
    }
];

export function FeatureShowcase() {
    return (
        <section id="features" className="py-32 relative z-10 px-6">
            <div className="max-w-7xl mx-auto space-y-40">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-content-primary">Everything your creative process needs</h2>
                </div>

                {FEATURES.map((feat, i) => (
                    <StaggerContainer key={i} className={`flex flex-col ${feat.align === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16`}>

                        {/* Text Side */}
                        <div className="flex-1 space-y-8">
                            <FadeInUp>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-space-800 border border-content-tertiary/20 text-content-secondary text-xs font-bold uppercase tracking-widest">
                                    <feat.icon className="w-4 h-4 text-brand-teal" /> {feat.subtitle}
                                </div>
                            </FadeInUp>
                            <FadeInUp>
                                <h3 className="text-4xl md:text-5xl font-display font-bold text-content-primary leading-tight">{feat.title}</h3>
                            </FadeInUp>
                            <FadeInUp>
                                <p className="text-lg text-content-secondary leading-relaxed">{feat.desc}</p>
                            </FadeInUp>

                            {feat.bullets && (
                                <FadeInUp>
                                    <ul className="space-y-3">
                                        {feat.bullets.map((b, j) => (
                                            <li key={j} className="flex items-start gap-3 text-content-secondary">
                                                <Target className="w-5 h-5 text-brand-amber shrink-0 mt-0.5" />
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </FadeInUp>
                            )}

                            {feat.code && (
                                <FadeInUp>
                                    <div className="p-4 rounded-xl bg-space-900 border border-borderBase font-mono text-xs md:text-sm text-brand-teal">
                                        {feat.code}
                                    </div>
                                </FadeInUp>
                            )}
                        </div>

                        {/* Visual Side Mockup */}
                        <div className="flex-1 w-full">
                            <HoverCard3D glowColor={i % 2 === 0 ? "teal" : "violet"}>
                                <div className="aspect-square md:aspect-[4/3] w-full bg-space-800/50 rounded-2xl flex items-center justify-center p-8 overflow-hidden relative border border-white/5">
                                    {/* Abstract Visual representation */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-teal/5 to-transparent opacity-50" />
                                    <feat.icon className="w-32 h-32 text-content-secondary opacity-20 relative z-10" />
                                    {/* We could use Recharts here for the CRPS and specific UI mocks, but abstract icons keep the landing page clean until they enter the app. */}
                                </div>
                            </HoverCard3D>
                        </div>

                    </StaggerContainer>
                ))}
            </div>
        </section>
    );
}
